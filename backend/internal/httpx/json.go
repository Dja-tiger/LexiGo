package httpx

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

const defaultJSONLimit int64 = 1 << 20

type ErrorResponse struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
		Field   string `json:"field,omitempty"`
	} `json:"error"`
}

func DecodeJSON(w http.ResponseWriter, r *http.Request, target any) error {
	return DecodeJSONLimit(w, r, target, defaultJSONLimit)
}

func DecodeJSONLimit(w http.ResponseWriter, r *http.Request, target any, maxBytes int64) error {
	if maxBytes <= 0 {
		maxBytes = defaultJSONLimit
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("request body must contain one JSON object")
	}
	return nil
}

func WriteJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func WriteError(w http.ResponseWriter, status int, code, message string) {
	WriteFieldError(w, status, code, message, "")
}

func WriteFieldError(w http.ResponseWriter, status int, code, message, field string) {
	var response ErrorResponse
	response.Error.Code = code
	response.Error.Message = message
	response.Error.Field = field
	WriteJSON(w, status, response)
}
