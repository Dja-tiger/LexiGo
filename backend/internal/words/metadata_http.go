package words

import (
	"net/http"
	"strings"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

func (h *Handler) Metadata(w http.ResponseWriter, r *http.Request) {
	metadata, err := h.repository.Metadata(r.Context())
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	etag := `"` + metadata.CatalogVersion + `"`
	w.Header().Set("Cache-Control", "public, max-age=60, must-revalidate")
	w.Header().Set("ETag", etag)
	if matchesETag(r.Header.Get("If-None-Match"), etag) {
		w.WriteHeader(http.StatusNotModified)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, metadata)
}

func matchesETag(header, expected string) bool {
	for _, candidate := range strings.Split(header, ",") {
		value := strings.TrimSpace(candidate)
		value = strings.TrimPrefix(value, "W/")
		if value == expected || value == "*" {
			return true
		}
	}
	return false
}
