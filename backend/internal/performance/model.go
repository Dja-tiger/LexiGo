package performance

import (
	"fmt"
	"math"
	"regexp"
)

const (
	MaxSamplesPerReport = 16
	MaxReportBytes       = 32 << 10
)

const (
	MetricCLS                   = "CLS"
	MetricLCP                   = "LCP"
	MetricINP                   = "INP"
	MetricFCP                   = "FCP"
	MetricTTFB                  = "TTFB"
	MetricNextHydration         = "NEXT_HYDRATION"
	MetricNextRouteChange       = "NEXT_ROUTE_CHANGE"
	MetricNextRender            = "NEXT_RENDER"
	MetricLongTaskCount         = "LONG_TASK_COUNT"
	MetricLongTaskTotal         = "LONG_TASK_TOTAL"
	MetricLongTaskMax           = "LONG_TASK_MAX"
	MetricObserverCallbackTotal = "OBSERVER_CALLBACK_TOTAL"
	MetricObserverCallbackMax   = "OBSERVER_CALLBACK_MAX"
	MetricActionStartLesson     = "ACTION_START_LESSON"
	MetricActionReviewAnswer    = "ACTION_REVIEW_ANSWER"
)

type Report struct {
	AppVersion    string   `json:"appVersion"`
	Route         string   `json:"route"`
	DeviceClass   string   `json:"deviceClass"`
	BrowserFamily string   `json:"browserFamily"`
	DisplayMode   string   `json:"displayMode"`
	Samples       []Sample `json:"samples"`
}

type Sample struct {
	Name           string  `json:"name"`
	Value          float64 `json:"value"`
	Rating         string  `json:"rating"`
	NavigationType string  `json:"navigationType"`
}

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

var appVersionPattern = regexp.MustCompile(`^[A-Za-z0-9._-]{1,80}$`)

var allowedRoutes = map[string]struct{}{
	"/":           {},
	"/learn":      {},
	"/dictionary": {},
	"/phrases":    {},
	"/progress":   {},
	"/profile":    {},
	"/lesson":     {},
	"/word":       {},
	"/phrase":     {},
	"/privacy":    {},
	"/terms":      {},
	"/legal":      {},
	"/not-found":  {},
}

var allowedDeviceClasses = map[string]struct{}{
	"mobile": {}, "tablet": {}, "desktop": {},
}

var allowedBrowserFamilies = map[string]struct{}{
	"chromium": {}, "webkit": {}, "firefox": {}, "other": {},
}

var allowedDisplayModes = map[string]struct{}{
	"browser": {}, "standalone": {}, "fullscreen": {}, "minimal-ui": {}, "unknown": {},
}

var allowedRatings = map[string]struct{}{
	"good": {}, "needs-improvement": {}, "poor": {}, "unknown": {},
}

var allowedNavigationTypes = map[string]struct{}{
	"navigate": {}, "reload": {}, "back-forward": {}, "back-forward-cache": {},
	"prerender": {}, "restore": {}, "unknown": {},
}

var metricMaximums = map[string]float64{
	MetricCLS:                   10,
	MetricLCP:                   120_000,
	MetricINP:                   120_000,
	MetricFCP:                   120_000,
	MetricTTFB:                  120_000,
	MetricNextHydration:         120_000,
	MetricNextRouteChange:       120_000,
	MetricNextRender:            120_000,
	MetricLongTaskCount:         100_000,
	MetricLongTaskTotal:         600_000,
	MetricLongTaskMax:           120_000,
	MetricObserverCallbackTotal: 120_000,
	MetricObserverCallbackMax:   120_000,
	MetricActionStartLesson:     120_000,
	MetricActionReviewAnswer:    120_000,
}

func (report Report) Validate() error {
	if !appVersionPattern.MatchString(report.AppVersion) {
		return &ValidationError{Field: "appVersion", Message: "must contain 1-80 safe build identifier characters"}
	}
	if _, ok := allowedRoutes[report.Route]; !ok {
		return &ValidationError{Field: "route", Message: "must be a normalized application route"}
	}
	if _, ok := allowedDeviceClasses[report.DeviceClass]; !ok {
		return &ValidationError{Field: "deviceClass", Message: "must be mobile, tablet, or desktop"}
	}
	if _, ok := allowedBrowserFamilies[report.BrowserFamily]; !ok {
		return &ValidationError{Field: "browserFamily", Message: "must be chromium, webkit, firefox, or other"}
	}
	if _, ok := allowedDisplayModes[report.DisplayMode]; !ok {
		return &ValidationError{Field: "displayMode", Message: "contains an unsupported display mode"}
	}
	if len(report.Samples) == 0 || len(report.Samples) > MaxSamplesPerReport {
		return &ValidationError{Field: "samples", Message: fmt.Sprintf("must contain between 1 and %d metrics", MaxSamplesPerReport)}
	}
	for index, sample := range report.Samples {
		maximum, ok := metricMaximums[sample.Name]
		if !ok {
			return &ValidationError{Field: fmt.Sprintf("samples[%d].name", index), Message: "contains an unsupported metric"}
		}
		if math.IsNaN(sample.Value) || math.IsInf(sample.Value, 0) || sample.Value < 0 || sample.Value > maximum {
			return &ValidationError{Field: fmt.Sprintf("samples[%d].value", index), Message: "is outside the accepted range"}
		}
		if sample.Name == MetricLongTaskCount && math.Trunc(sample.Value) != sample.Value {
			return &ValidationError{Field: fmt.Sprintf("samples[%d].value", index), Message: "must be an integer for LONG_TASK_COUNT"}
		}
		if _, ok := allowedRatings[sample.Rating]; !ok {
			return &ValidationError{Field: fmt.Sprintf("samples[%d].rating", index), Message: "contains an unsupported rating"}
		}
		if _, ok := allowedNavigationTypes[sample.NavigationType]; !ok {
			return &ValidationError{Field: fmt.Sprintf("samples[%d].navigationType", index), Message: "contains an unsupported navigation type"}
		}
	}
	return nil
}
