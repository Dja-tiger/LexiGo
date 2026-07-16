package words

import (
	"net/http"
	"strconv"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

type Handler struct{ repository *Repository }

func NewHandler(repository *Repository) *Handler { return &Handler{repository: repository} }

func (h *Handler) All(w http.ResponseWriter, r *http.Request) {
	h.list(w, r, false)
}

func (h *Handler) Due(w http.ResponseWriter, r *http.Request) {
	h.list(w, r, true)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request, dueOnly bool) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	kind := r.URL.Query().Get("kind")
	if kind == "" {
		kind = "word"
	}
	if kind != "word" && kind != "phrase" {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_kind", "kind must be word or phrase")
		return
	}

	var (
		items []UserWord
		err   error
	)
	if dueOnly {
		items, err = h.repository.ListDue(r.Context(), userID, limit, kind)
	} else {
		items, err = h.repository.List(r.Context(), userID, limit, kind)
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"items": items, "count": len(items)})
}
