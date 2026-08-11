package performance

import (
	"errors"
	"testing"
)

func validProductRetentionEvent() ProductRetentionEvent {
	return ProductRetentionEvent{
		AppVersion:    "release-2026.08.11",
		Event:         ProductRetentionEventLessonCompleted,
		Action:        ProductRetentionActionNextLesson,
		DelayBucket:   ProductRetentionDelayNone,
		DeviceClass:   "mobile",
		BrowserFamily: "webkit",
		DisplayMode:   "standalone",
	}
}

func TestProductRetentionEventValidateAcceptsSupportedCombinations(t *testing.T) {
	tests := []ProductRetentionEvent{
		validProductRetentionEvent(),
		{
			AppVersion:    "release-2026.08.11",
			Event:         ProductRetentionEventNextAction,
			Action:        ProductRetentionActionReviewDue,
			DelayBucket:   ProductRetentionDelayUnder5Minutes,
			DeviceClass:   "desktop",
			BrowserFamily: "chromium",
			DisplayMode:   "browser",
		},
		{
			AppVersion:    "release-2026.08.11",
			Event:         ProductRetentionEventReturnSession,
			Action:        ProductRetentionActionNone,
			DelayBucket:   ProductRetentionDelayUnder24Hours,
			DeviceClass:   "tablet",
			BrowserFamily: "firefox",
			DisplayMode:   "browser",
		},
	}

	for _, event := range tests {
		if err := event.Validate(); err != nil {
			t.Fatalf("Validate(%+v) = %v, want nil", event, err)
		}
	}
}

func TestProductRetentionEventValidateRejectsUnsupportedOrCrossEventFields(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*ProductRetentionEvent)
		field  string
	}{
		{
			name:   "unknown event",
			mutate: func(event *ProductRetentionEvent) { event.Event = "opened_word" },
			field:  "event",
		},
		{
			name:   "unknown action",
			mutate: func(event *ProductRetentionEvent) { event.Action = "open_dictionary" },
			field:  "action",
		},
		{
			name:   "unknown delay",
			mutate: func(event *ProductRetentionEvent) { event.DelayBucket = "tomorrow" },
			field:  "delayBucket",
		},
		{
			name:   "completed without recommendation",
			mutate: func(event *ProductRetentionEvent) { event.Action = ProductRetentionActionNone },
			field:  "action",
		},
		{
			name:   "completed with delay",
			mutate: func(event *ProductRetentionEvent) { event.DelayBucket = ProductRetentionDelayUnder1Minute },
			field:  "delayBucket",
		},
		{
			name: "next action without action",
			mutate: func(event *ProductRetentionEvent) {
				event.Event = ProductRetentionEventNextAction
				event.Action = ProductRetentionActionNone
				event.DelayBucket = ProductRetentionDelayUnder1Minute
			},
			field: "action",
		},
		{
			name: "next action without delay",
			mutate: func(event *ProductRetentionEvent) {
				event.Event = ProductRetentionEventNextAction
				event.Action = ProductRetentionActionHome
				event.DelayBucket = ProductRetentionDelayNone
			},
			field: "delayBucket",
		},
		{
			name: "return with action",
			mutate: func(event *ProductRetentionEvent) {
				event.Event = ProductRetentionEventReturnSession
				event.Action = ProductRetentionActionHome
				event.DelayBucket = ProductRetentionDelayUnder72Hours
			},
			field: "action",
		},
		{
			name: "return without delay",
			mutate: func(event *ProductRetentionEvent) {
				event.Event = ProductRetentionEventReturnSession
				event.Action = ProductRetentionActionNone
				event.DelayBucket = ProductRetentionDelayNone
			},
			field: "delayBucket",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			event := validProductRetentionEvent()
			test.mutate(&event)

			err := event.Validate()
			if err == nil {
				t.Fatal("Validate() = nil, want validation error")
			}
			var validationError *ValidationError
			if !errors.As(err, &validationError) {
				t.Fatalf("Validate() error = %T %v, want *ValidationError", err, err)
			}
			if validationError.Field != test.field {
				t.Fatalf("validation field = %q, want %q", validationError.Field, test.field)
			}
		})
	}
}
