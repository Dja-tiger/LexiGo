package words

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/Dja-tiger/LexiGo/backend/internal/httpx"
)

const maxCatalogFilterLength = 120

type Handler struct{ repository *Repository }

func NewHandler(repository *Repository) *Handler { return &Handler{repository: repository} }

func (h *Handler) PublicAll(w http.ResponseWriter, r *http.Request) {
	options, ok := commonListOptions(w, r)
	if !ok {
		return
	}
	if !validPublicCatalogSource(options.Source) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_source", "source must be a supported public word catalog section")
		return
	}
	if strings.TrimSpace(r.URL.Query().Get("status")) != "" {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_status", "status is available only for an authenticated catalog")
		return
	}
	result, err := h.repository.ListPublicPage(r.Context(), options)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) PublicDetail(w http.ResponseWriter, r *http.Request) {
	wordID, err := positiveWordID(r.PathValue("wordID"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_word_id", "catalog item id must be a positive integer")
		return
	}
	item, err := h.repository.GetPublic(r.Context(), wordID)
	if errors.Is(err, ErrCatalogItemNotFound) {
		httpx.WriteError(w, http.StatusNotFound, "catalog_item_not_found", "catalog item was not found")
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, item)
}

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
	wordID, err := positiveWordID(r.PathValue("wordID"))
	if err != nil {
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

func (h *Handler) PhraseDetail(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}

	slug := r.PathValue("slug")
	if !ValidPhraseSlug(slug) {
		// Invalid and absent identifiers deliberately share one response. This
		// keeps the route contract simple and avoids exposing personalized shape.
		httpx.WriteError(w, http.StatusNotFound, "phrase_not_found", "phrase is not available to the current user")
		return
	}

	item, err := h.repository.GetPhraseBySlug(r.Context(), userID, slug)
	if errors.Is(err, ErrCatalogItemNotFound) {
		httpx.WriteError(w, http.StatusNotFound, "phrase_not_found", "phrase is not available to the current user")
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

	options, ok := commonListOptions(w, r)
	if !ok {
		return
	}
	if !validCatalogSource(options.Source) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_source", "source must be a supported catalog section")
		return
	}

	kind := strings.TrimSpace(r.URL.Query().Get("kind"))
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
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	if !validCatalogStatus(status) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_status", "status must be new, learning, review or mastered")
		return
	}
	options.Kind = kind
	options.Status = status

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

func commonListOptions(w http.ResponseWriter, r *http.Request) (ListOptions, bool) {
	queryValues := r.URL.Query()
	page, ok := positiveQueryInteger(queryValues.Get("page"), 1, 1_000_000)
	if !ok {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_page", "page must be a positive integer")
		return ListOptions{}, false
	}
	limit, ok := positiveQueryInteger(queryValues.Get("limit"), 30, 100)
	if !ok {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_limit", "limit must be between 1 and 100")
		return ListOptions{}, false
	}

	source := strings.TrimSpace(queryValues.Get("source"))
	topic := strings.TrimSpace(queryValues.Get("topic"))
	search := strings.TrimSpace(queryValues.Get("query"))
	if search == "" {
		search = strings.TrimSpace(queryValues.Get("q"))
	}
	if utf8.RuneCountInString(topic) > maxCatalogFilterLength || utf8.RuneCountInString(search) > maxCatalogFilterLength {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_catalog_filter", "topic and query must contain at most 120 characters")
		return ListOptions{}, false
	}

	sortMode := strings.TrimSpace(queryValues.Get("sort"))
	if sortMode == "" {
		sortMode = "default"
	}
	if sortMode != "default" && sortMode != "az" && sortMode != "za" {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_sort", "sort must be default, az or za")
		return ListOptions{}, false
	}

	return ListOptions{
		Page: page, Limit: limit, Source: source,
		Topic: topic, Query: search, Sort: sortMode,
	}, true
}

func positiveWordID(raw string) (int64, error) {
	wordID, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || wordID <= 0 {
		return 0, errors.New("invalid word id")
	}
	return wordID, nil
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

func validPublicCatalogSource(value string) bool {
	switch value {
	case "", "mixed", "noun", "verb", "adjective", "daily-life", "travel", "data-engineering", "backend", "academic-technical-english":
		return true
	default:
		return false
	}
}

func validCatalogSource(value string) bool {
	switch value {
	case "", "mixed", "noun", "verb", "adjective", "phrases", "daily-life", "travel", "data-engineering", "backend", "academic-technical-english":
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
