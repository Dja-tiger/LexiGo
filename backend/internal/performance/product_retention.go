package performance

import "fmt"

const MaxProductRetentionEventBytes = 8 << 10

const (
	ProductRetentionEventLessonCompleted = "lesson_completed"
	ProductRetentionEventNextAction      = "completion_to_next_action"
	ProductRetentionEventReturnSession   = "return_to_next_session"

	ProductRetentionActionNone         = "none"
	ProductRetentionActionReviewDue    = "review_due"
	ProductRetentionActionContinueGoal = "continue_goal"
	ProductRetentionActionNextLesson   = "next_lesson"
	ProductRetentionActionHome         = "home"

	ProductRetentionDelayNone           = "none"
	ProductRetentionDelayUnder1Minute   = "under_1m"
	ProductRetentionDelayUnder5Minutes  = "under_5m"
	ProductRetentionDelayUnder30Minutes = "under_30m"
	ProductRetentionDelayUnder4Hours    = "under_4h"
	ProductRetentionDelayUnder24Hours   = "under_24h"
	ProductRetentionDelayUnder72Hours   = "under_72h"
	ProductRetentionDelayLater          = "later"
)

// ProductRetentionEvent is deliberately aggregate-only. It must never grow
// learner/session/lesson/content identifiers or free-form URL/query/referrer
// fields. Cross-session timing is reduced to a coarse elapsed-time bucket on
// the client before transmission.
type ProductRetentionEvent struct {
	AppVersion    string `json:"appVersion"`
	Event         string `json:"event"`
	Action        string `json:"action"`
	DelayBucket   string `json:"delayBucket"`
	DeviceClass   string `json:"deviceClass"`
	BrowserFamily string `json:"browserFamily"`
	DisplayMode   string `json:"displayMode"`
}

var allowedProductRetentionEvents = map[string]struct{}{
	ProductRetentionEventLessonCompleted: {},
	ProductRetentionEventNextAction:      {},
	ProductRetentionEventReturnSession:   {},
}

var allowedProductRetentionActions = map[string]struct{}{
	ProductRetentionActionNone:         {},
	ProductRetentionActionReviewDue:    {},
	ProductRetentionActionContinueGoal: {},
	ProductRetentionActionNextLesson:   {},
	ProductRetentionActionHome:         {},
}

var allowedProductRetentionDelayBuckets = map[string]struct{}{
	ProductRetentionDelayNone:           {},
	ProductRetentionDelayUnder1Minute:   {},
	ProductRetentionDelayUnder5Minutes:  {},
	ProductRetentionDelayUnder30Minutes: {},
	ProductRetentionDelayUnder4Hours:    {},
	ProductRetentionDelayUnder24Hours:   {},
	ProductRetentionDelayUnder72Hours:   {},
	ProductRetentionDelayLater:          {},
}

func (event ProductRetentionEvent) Validate() error {
	if !appVersionPattern.MatchString(event.AppVersion) {
		return &ValidationError{Field: "appVersion", Message: "must contain 1-80 safe build identifier characters"}
	}
	if _, ok := allowedProductRetentionEvents[event.Event]; !ok {
		return &ValidationError{Field: "event", Message: fmt.Sprintf("contains unsupported retention event %q", event.Event)}
	}
	if _, ok := allowedProductRetentionActions[event.Action]; !ok {
		return &ValidationError{Field: "action", Message: fmt.Sprintf("contains unsupported retention action %q", event.Action)}
	}
	if _, ok := allowedProductRetentionDelayBuckets[event.DelayBucket]; !ok {
		return &ValidationError{Field: "delayBucket", Message: fmt.Sprintf("contains unsupported retention delay bucket %q", event.DelayBucket)}
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

	switch event.Event {
	case ProductRetentionEventLessonCompleted:
		if event.Action == ProductRetentionActionNone {
			return &ValidationError{Field: "action", Message: "must contain the primary recommendation for lesson_completed"}
		}
		if event.DelayBucket != ProductRetentionDelayNone {
			return &ValidationError{Field: "delayBucket", Message: "must be none for lesson_completed"}
		}
	case ProductRetentionEventNextAction:
		if event.Action == ProductRetentionActionNone {
			return &ValidationError{Field: "action", Message: "must identify the chosen next action"}
		}
		if event.DelayBucket == ProductRetentionDelayNone {
			return &ValidationError{Field: "delayBucket", Message: "must contain an elapsed-time bucket"}
		}
	case ProductRetentionEventReturnSession:
		if event.Action != ProductRetentionActionNone {
			return &ValidationError{Field: "action", Message: "must be none for return_to_next_session"}
		}
		if event.DelayBucket == ProductRetentionDelayNone {
			return &ValidationError{Field: "delayBucket", Message: "must contain an elapsed-time bucket"}
		}
	}

	return nil
}
