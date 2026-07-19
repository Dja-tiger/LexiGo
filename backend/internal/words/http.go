package words

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

const maxCatalogFilterLength = 120

type Handler struct{ repository *Repository }

func NewHandler(repository *Repository) *Handler { return &Handler{repository: repository} }

func (h *Handler) All(w http.ResponseWriter, r *http.Request) {
	h.list(w, r, false)
}

func (h *Handler) Due(w http.ResponseWriter, r *http.Request) {
	h.list(w, r, true)
}

func (h *Handler) Detail(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	wordID, err := strconv.ParseInt(r.PathValue("wordID"), 10, 64)
	if err != nil || wordID <= 0 {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_word_id", "catalog item id must be a positive integer")
		return
	}
	item, err := h.repository.Get(r.Context(), userID, wordID)
	if errors.Is(err, ErrCatalogItemNotFound) {
		httpx.WriteError(w, http.StatusNotFound, "catalog_item_not_found", "catalog item is not assigned to the current user")
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, item)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request, dueOnly bool) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}

	queryValues := r.URL.Query()
	page, ok := positiveQueryInteger(queryValues.Get("page"), 1, 1_000_000)
	if !ok {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_page", "page must be a positive integer")
		return
	}
	limit, ok := positiveQueryInteger(queryValues.Get("limit"), 30, 100)
	if !ok {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_limit", "limit must be between 1 and 100")
		return
	}

	kind := strings.TrimSpace(queryValues.Get("kind"))
	if kind == "" {
		kind = "word"
	}
	if kind != "word" && kind != "phrase" && kind != "all" {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_kind", "kind must be word, phrase or all")
		return
	}
	if kind == "all" {
		kind = ""
	}

	source := strings.TrimSpace(queryValues.Get("source"))
	if !validCatalogSource(source) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_source", "source must be a supported catalog section")
		return
	}
	topic := strings.TrimSpace(queryValues.Get("topic"))
	search := strings.TrimSpace(queryValues.Get("query"))
	if search == "" {
		search = strings.TrimSpace(queryValues.Get("q"))
	}
	if utf8.RuneCountInString(topic) > maxCatalogFilterLength || utf8.RuneCountInString(search) > maxCatalogFilterLength {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_catalog_filter", "topic and query must contain at most 120 characters")
		return
	}
	status := strings.TrimSpace(queryValues.Get("status"))
	if !validCatalogStatus(status) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_status", "status must be new, learning, review or mastered")
		return
	}
	sortMode := strings.TrimSpace(queryValues.Get("sort"))
	if sortMode == "" {
		sortMode = "default"
	}
	if sortMode != "default" && sortMode != "az" && sortMode != "za" {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_sort", "sort must be default, az or za")
		return
	}

	options := ListOptions{
		Page: page, Limit: limit, Kind: kind, Source: source,
		Topic: topic, Query: search, Status: status, Sort: sortMode,
	}
	var result Page
	var err error
	if dueOnly {
		result, err = h.repository.ListDuePage(r.Context(), userID, options)
	} else {
		result, err = h.repository.ListPage(r.Context(), userID, options)
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, result)
}

func positiveQueryInteger(raw string, defaultValue, maximum int) (int, bool) {
	if strings.TrimSpace(raw) == "" {
		return defaultValue, true
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 || value > maximum {
		return 0, false
	}
	return value, true
}

func validCatalogSource(value string) bool {
	switch value {
	case "", "mixed", "noun", "verb", "adjective", "phrases", "daily-life", "travel", "data-engineering", "backend":
		return true
	default:
		return false
	}
}

func validCatalogStatus(value string) bool {
	switch value {
	case "", "new", "learning", "review", "mastered":
		return true
	default:
		return false
	}
}
