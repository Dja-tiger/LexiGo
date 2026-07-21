package performance

import "fmt"

const MaxJourneyEventBytes = 8 << 10

type JourneyEvent struct {
	AppVersion    string `json:"appVersion"`
	FromRoute     string `json:"fromRoute"`
	ToRoute       string `json:"toRoute"`
	Intent        string `json:"intent"`
	Backtrack     bool   `json:"backtrack"`
	DeviceClass   string `json:"deviceClass"`
	BrowserFamily string `json:"browserFamily"`
	DisplayMode   string `json:"displayMode"`
}

var allowedJourneyIntents = map[string]struct{}{
	"primary_navigation":       {},
	"home_next_action":         {},
	"home_configure_lesson":    {},
	"home_find_material":       {},
	"catalog_switch":           {},
	"catalog_open_detail":      {},
	"catalog_configure_lesson": {},
	"lesson_start":             {},
	"lesson_exit":              {},
	"authentication":           {},
	"browser_history":          {},
	"in_app_navigation":        {},
}

func (event JourneyEvent) Validate() error {
	if !appVersionPattern.MatchString(event.AppVersion) {
		return &ValidationError{Field: "appVersion", Message: "must contain 1-80 safe build identifier characters"}
	}
	if _, ok := allowedRoutes[event.FromRoute]; !ok {
		return &ValidationError{Field: "fromRoute", Message: "must be a normalized application route"}
	}
	if _, ok := allowedRoutes[event.ToRoute]; !ok {
		return &ValidationError{Field: "toRoute", Message: "must be a normalized application route"}
	}
	if event.FromRoute == event.ToRoute {
		return &ValidationError{Field: "toRoute", Message: "must differ from fromRoute"}
	}
	if _, ok := allowedJourneyIntents[event.Intent]; !ok {
		return &ValidationError{Field: "intent", Message: fmt.Sprintf("contains unsupported product intent %q", event.Intent)}
	}
	if _, ok := allowedDeviceClasses[event.DeviceClass]; !ok {
		return &ValidationError{Field: "deviceClass", Message: "must be mobile, tablet, or desktop"}
	}
	if _, ok := allowedBrowserFamilies[event.BrowserFamily]; !ok {
		return &ValidationError{Field: "browserFamily", Message: "must be chromium, webkit, firefox, or other"}
	}
	if _, ok := allowedDisplayModes[event.DisplayMode]; !ok {
		return &ValidationError{Field: "displayMode", Message: "contains an unsupported display mode"}
	}
	return nil
}
