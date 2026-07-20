package performance

import (
	"errors"
	"testing"
)

func validReport() Report {
	return Report{
		AppVersion:    "release-2026.07.20",
		Route:         "/dictionary",
		DeviceClass:   "mobile",
		BrowserFamily: "webkit",
		DisplayMode:   "standalone",
		Samples: []Sample{
			{
				Name:           MetricLCP,
				Value:          1825.5,
				Rating:         "good",
				NavigationType: "navigate",
			},
		},
	}
}

func TestReportValidateAcceptsPrivacySafeMetrics(t *testing.T) {
	report := validReport()
	report.Samples = append(report.Samples,
		Sample{Name: MetricCLS, Value: 0.04, Rating: "good", NavigationType: "navigate"},
		Sample{Name: MetricINP, Value: 148, Rating: "good", NavigationType: "navigate"},
		Sample{Name: MetricLongTaskCount, Value: 2, Rating: "unknown", NavigationType: "navigate"},
	)

	if err := report.Validate(); err != nil {
		t.Fatalf("Validate() error = %v", err)
	}
}

func TestReportValidateRejectsIdentifiersAndUnboundedDimensions(t *testing.T) {
	tests := []struct {
		name      string
		mutate    func(*Report)
		wantField string
	}{
		{
			name: "full URL with query",
			mutate: func(report *Report) {
				report.Route = "/dictionary?email=user@example.com"
			},
			wantField: "route",
		},
		{
			name: "unsafe app version",
			mutate: func(report *Report) {
				report.AppVersion = "release/user@example.com"
			},
			wantField: "appVersion",
		},
		{
			name: "raw browser family",
			mutate: func(report *Report) {
				report.BrowserFamily = "Mozilla/5.0 (iPhone; user-specific)"
			},
			wantField: "browserFamily",
		},
		{
			name: "unsupported metric",
			mutate: func(report *Report) {
				report.Samples[0].Name = "USER_EMAIL"
			},
			wantField: "samples[0].name",
		},
		{
			name: "fractional task count",
			mutate: func(report *Report) {
				report.Samples[0] = Sample{Name: MetricLongTaskCount, Value: 1.5, Rating: "unknown", NavigationType: "navigate"}
			},
			wantField: "samples[0].value",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			report := validReport()
			test.mutate(&report)
			err := report.Validate()
			var validationError *ValidationError
			if !errors.As(err, &validationError) {
				t.Fatalf("Validate() error = %v, want ValidationError", err)
			}
			if validationError.Field != test.wantField {
				t.Fatalf("ValidationError.Field = %q, want %q", validationError.Field, test.wantField)
			}
		})
	}
}

func TestReportValidateLimitsBatchSize(t *testing.T) {
	report := validReport()
	report.Samples = make([]Sample, MaxSamplesPerReport+1)
	for index := range report.Samples {
		report.Samples[index] = Sample{Name: MetricFCP, Value: 100, Rating: "good", NavigationType: "navigate"}
	}

	err := report.Validate()
	var validationError *ValidationError
	if !errors.As(err, &validationError) || validationError.Field != "samples" {
		t.Fatalf("Validate() error = %v, want samples ValidationError", err)
	}
}
