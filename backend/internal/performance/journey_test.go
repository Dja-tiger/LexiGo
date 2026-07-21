package performance

import "testing"

func validJourneyEvent() JourneyEvent {
	return JourneyEvent{
		AppVersion:    "release-2026.07.21",
		FromRoute:     "/",
		ToRoute:       "/dictionary",
		Intent:        "home_find_material",
		Backtrack:     false,
		DeviceClass:   "mobile",
		BrowserFamily: "webkit",
		DisplayMode:   "standalone",
	}
}

func TestJourneyEventValidateAcceptsBoundedAnonymousTransition(t *testing.T) {
	if err := validJourneyEvent().Validate(); err != nil {
		t.Fatalf("Validate() error = %v", err)
	}
}

func TestJourneyEventValidateRejectsIdentifiersAndUnboundedDimensions(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*JourneyEvent)
	}{
		{name: "raw route", mutate: func(event *JourneyEvent) { event.ToRoute = "/dictionary?query=user@example.com" }},
		{name: "unknown intent", mutate: func(event *JourneyEvent) { event.Intent = "searched user@example.com" }},
		{name: "same route", mutate: func(event *JourneyEvent) { event.ToRoute = event.FromRoute }},
		{name: "raw browser", mutate: func(event *JourneyEvent) { event.BrowserFamily = "Mozilla/5.0 user@example.com" }},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			event := validJourneyEvent()
			test.mutate(&event)
			if err := event.Validate(); err == nil {
				t.Fatal("Validate() error = nil, want validation error")
			}
		})
	}
}
