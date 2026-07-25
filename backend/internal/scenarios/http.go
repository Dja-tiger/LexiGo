package scenarios

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/Dja-tiger/LexiGo/backend/internal/httpx"
)

type Handler struct {
	repository *Repository
}

func NewHandler(repository *Repository) *Handler {
	return &Handler{repository: repository}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.repository.List(r.Context())
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{
		"items": items,
		"count": len(items),
	})
}

func (h *Handler) Detail(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimSpace(r.PathValue("slug"))
	if slug == "" {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_scenario_slug", "scenario slug is required")
		return
	}
	item, err := h.repository.Detail(r.Context(), slug)
	if err != nil {
		writeScenarioError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, item)
}

func (h *Handler) Start(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	slug := strings.TrimSpace(r.PathValue("slug"))
	if slug == "" {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_scenario_slug", "scenario slug is required")
		return
	}
	result, err := h.repository.Start(r.Context(), userID, slug)
	if err != nil {
		writeScenarioError(w, err)
		return
	}
	status := http.StatusCreated
	if result.Resumed {
		status = http.StatusOK
	}
	httpx.WriteJSON(w, status, result)
}

func (h *Handler) Attempt(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	attemptID := strings.TrimSpace(r.PathValue("attemptID"))
	if !validUUID(attemptID) {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_attempt_id", "attempt id must be a UUID")
		return
	}
	attempt, err := h.repository.Attempt(r.Context(), userID, attemptID)
	if err != nil {
		writeScenarioError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, attempt)
}

func (h *Handler) Pause(w http.ResponseWriter, r *http.Request) {
	h.changeAttemptStatus(w, r, true)
}

func (h *Handler) Resume(w http.ResponseWriter, r *http.Request) {
	h.changeAttemptStatus(w, r, false)
}

func (h *Handler) changeAttemptStatus(w http.ResponseWriter, r *http.Request, pause bool) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	attemptID := strings.TrimSpace(r.PathValue("attemptID"))
	if !validUUID(attemptID) {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_attempt_id", "attempt id must be a UUID")
		return
	}
	var request AttemptVersionRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
		return
	}
	if request.AttemptVersion <= 0 {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_attempt_version", "attemptVersion must be positive")
		return
	}

	var (
		attempt Attempt
		err     error
	)
	if pause {
		attempt, err = h.repository.Pause(r.Context(), userID, attemptID, request.AttemptVersion)
	} else {
		attempt, err = h.repository.Resume(r.Context(), userID, attemptID, request.AttemptVersion)
	}
	if err != nil {
		writeScenarioError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, attempt)
}

func (h *Handler) SubmitStep(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	attemptID := strings.TrimSpace(r.PathValue("attemptID"))
	if !validUUID(attemptID) {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_attempt_id", "attempt id must be a UUID")
		return
	}
	position, err := strconv.Atoi(r.PathValue("position"))
	if err != nil || position < 0 {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_scenario_position", "scenario position must be a non-negative integer")
		return
	}

	var request SubmitStepRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
		return
	}
	if code, message := normalizeAndValidateSubmission(&request); code != "" {
		httpx.WriteError(w, http.StatusUnprocessableEntity, code, message)
		return
	}
	requestHash, err := hashSubmission(position, request)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	result, err := h.repository.SubmitStep(
		r.Context(),
		userID,
		attemptID,
		position,
		request,
		requestHash,
	)
	if err != nil {
		writeScenarioError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, result)
}

func normalizeAndValidateSubmission(request *SubmitStepRequest) (code, message string) {
	request.SubmissionID = strings.TrimSpace(request.SubmissionID)
	if !validUUID(request.SubmissionID) {
		return "invalid_submission_id", "submissionId must be a UUID"
	}
	if request.AttemptVersion <= 0 {
		return "invalid_attempt_version", "attemptVersion must be positive"
	}
	request.Response = strings.TrimSpace(request.Response)
	if utf8.RuneCountInString(request.Response) > 5000 {
		return "invalid_scenario_response", "response must not exceed 5000 characters"
	}
	if code, message := normalizeEvidencePayload(&request.Facts); code != "" {
		return code, message
	}
	if code, message := normalizeEvidencePayload(&request.Hypotheses); code != "" {
		return code, message
	}
	if request.Review.ResponseMS != nil && (*request.Review.ResponseMS < 0 || *request.Review.ResponseMS > 3_600_000) {
		return "invalid_response_ms", "review.responseMs must be between 0 and 3600000"
	}
	if request.Review.TimezoneOffsetMinutes < -840 || request.Review.TimezoneOffsetMinutes > 840 {
		return "invalid_timezone_offset", "review.timezoneOffsetMinutes must be between -840 and 840"
	}
	return "", ""
}

func normalizeEvidencePayload(values *[]string) (code, message string) {
	if len(*values) > 10 {
		return "too_many_evidence_items", "facts and hypotheses may contain at most 10 items each"
	}
	normalized := make([]string, 0, len(*values))
	seen := make(map[string]struct{}, len(*values))
	for _, value := range *values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		if utf8.RuneCountInString(trimmed) > 500 {
			return "evidence_item_too_long", "each fact or hypothesis must not exceed 500 characters"
		}
		key := strings.ToLower(trimmed)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		normalized = append(normalized, trimmed)
	}
	*values = normalized
	return "", ""
}

func hashSubmission(position int, request SubmitStepRequest) ([]byte, error) {
	canonical := struct {
		Position int               `json:"position"`
		Request  SubmitStepRequest `json:"request"`
	}{Position: position, Request: request}
	body, err := json.Marshal(canonical)
	if err != nil {
		return nil, err
	}
	hash := sha256.Sum256(body)
	return hash[:], nil
}

func validUUID(value string) bool {
	if len(value) != 36 || value[8] != '-' || value[13] != '-' || value[18] != '-' || value[23] != '-' {
		return false
	}
	compact := strings.ReplaceAll(value, "-", "")
	if len(compact) != 32 {
		return false
	}
	_, err := hex.DecodeString(compact)
	return err == nil
}

func writeScenarioError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrScenarioNotFound):
		httpx.WriteError(w, http.StatusNotFound, "scenario_not_found", "scenario was not found")
	case errors.Is(err, ErrAttemptNotFound):
		httpx.WriteError(w, http.StatusNotFound, "scenario_attempt_not_found", "scenario attempt was not found")
	case errors.Is(err, ErrAttemptConflict):
		httpx.WriteError(w, http.StatusConflict, "scenario_attempt_conflict", "scenario attempt changed; reload it before retrying")
	case errors.Is(err, ErrAttemptPaused):
		httpx.WriteError(w, http.StatusConflict, "scenario_attempt_paused", "resume the scenario attempt before submitting")
	case errors.Is(err, ErrAttemptCompleted):
		httpx.WriteError(w, http.StatusConflict, "scenario_attempt_completed", "scenario attempt is already completed")
	case errors.Is(err, ErrStepOutOfOrder):
		httpx.WriteError(w, http.StatusConflict, "scenario_step_out_of_order", "submit the current scenario step in order")
	case errors.Is(err, ErrResponseTooShort):
		httpx.WriteError(w, http.StatusUnprocessableEntity, "scenario_response_too_short", "response does not satisfy the current production outcome")
	case errors.Is(err, ErrFactHypothesisRequired):
		httpx.WriteError(w, http.StatusUnprocessableEntity, "fact_hypothesis_required", "confirmed facts and current hypotheses must be provided separately")
	case errors.Is(err, ErrFactHypothesisOverlap):
		httpx.WriteError(w, http.StatusUnprocessableEntity, "fact_hypothesis_overlap", "the same statement cannot be both a fact and a hypothesis")
	default:
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
