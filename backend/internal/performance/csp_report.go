package performance

import (
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"
	"net/url"
	"strings"
	"unicode"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

const maxCSPReportBytes int64 = 16 << 10

type cspReportEnvelope struct {
	Report cspViolation `json:"csp-report"`
}

type cspViolation struct {
	BlockedURI         string `json:"blocked-uri"`
	ColumnNumber       int    `json:"column-number"`
	DocumentURI        string `json:"document-uri"`
	EffectiveDirective string `json:"effective-directive"`
	Disposition        string `json:"disposition"`
	LineNumber         int    `json:"line-number"`
	Referrer           string `json:"referrer"`
	SourceFile         string `json:"source-file"`
	StatusCode         int    `json:"status-code"`
	ViolatedDirective  string `json:"violated-directive"`
}

func (handler *Handler) CSPReport(w http.ResponseWriter, r *http.Request) {
	mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || (mediaType != "application/csp-report" && mediaType != "application/json") {
		httpx.WriteError(w, http.StatusUnsupportedMediaType, "unsupported_media_type", "Content-Type must be application/csp-report or application/json")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxCSPReportBytes)
	decoder := json.NewDecoder(r.Body)
	var envelope cspReportEnvelope
	if err := decoder.Decode(&envelope); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_csp_report", "request body must contain one CSP violation report")
		return
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_csp_report", "request body must contain one CSP violation report")
		return
	}

	directive := safeCSPToken(envelope.Report.EffectiveDirective, 120)
	if directive == "" {
		directive = safeCSPToken(envelope.Report.ViolatedDirective, 120)
	}
	if directive == "" {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_csp_report", "CSP directive is required")
		return
	}

	handler.logger.WarnContext(r.Context(), "browser content security policy violation",
		"directive", directive,
		"disposition", safeCSPToken(envelope.Report.Disposition, 24),
		"document_origin", safeReportOrigin(envelope.Report.DocumentURI),
		"blocked_resource", safeBlockedResource(envelope.Report.BlockedURI),
		"source_origin", safeReportOrigin(envelope.Report.SourceFile),
		"status_code", envelope.Report.StatusCode,
		"line", max(envelope.Report.LineNumber, 0),
		"column", max(envelope.Report.ColumnNumber, 0),
	)

	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusNoContent)
}

func safeCSPToken(value string, limit int) string {
	value = strings.TrimSpace(value)
	if value == "" || limit <= 0 {
		return ""
	}
	var safe strings.Builder
	for _, character := range value {
		if safe.Len() >= limit {
			break
		}
		if unicode.IsLetter(character) || unicode.IsDigit(character) || strings.ContainsRune("-_ ':/.", character) {
			safe.WriteRune(character)
		}
	}
	return strings.TrimSpace(safe.String())
}

func safeReportOrigin(value string) string {
	parsed, err := url.Parse(strings.TrimSpace(value))
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return ""
	}
	return parsed.Scheme + "://" + parsed.Host
}

func safeBlockedResource(value string) string {
	trimmed := strings.TrimSpace(value)
	switch strings.ToLower(trimmed) {
	case "inline", "eval", "self", "data", "blob":
		return strings.ToLower(trimmed)
	}
	if origin := safeReportOrigin(trimmed); origin != "" {
		return origin
	}
	if strings.HasPrefix(trimmed, "/") {
		return "same-origin"
	}
	return "other"
}
