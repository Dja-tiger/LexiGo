package learning

import "testing"

func TestListeningModeIsObjective(t *testing.T) {
	if !AnswerModeListening.Objective() {
		t.Fatal("listening must be an objective answer mode")
	}
	if AnswerModeStudy.Objective() {
		t.Fatal("study must remain non-objective")
	}
}

func TestNormalizeAndValidateReviewRequestAcceptsListening(t *testing.T) {
	submitted := "  pipeline  "
	request := ReviewRequest{
		Rating:          RatingKnown,
		AnswerMode:      AnswerModeListening,
		SubmittedAnswer: &submitted,
	}

	code, message := normalizeAndValidateReviewRequest(&request)
	if code != "" || message != "" {
		t.Fatalf("listening request rejected: code=%q message=%q", code, message)
	}
	if request.SubmittedAnswer == nil || *request.SubmittedAnswer != "pipeline" {
		t.Fatalf("submitted answer = %v, want trimmed listening answer", request.SubmittedAnswer)
	}
}

func TestNormalizeAndValidateReviewRequestKeepsLegacyDefaultRecall(t *testing.T) {
	request := ReviewRequest{Rating: RatingKnown}
	code, message := normalizeAndValidateReviewRequest(&request)
	if code != "" || message != "" {
		t.Fatalf("legacy request rejected: code=%q message=%q", code, message)
	}
	if request.AnswerMode != AnswerModeRecall {
		t.Fatalf("legacy answer mode = %q, want recall", request.AnswerMode)
	}
}

func TestNormalizeAndValidateReviewRequestRejectsUnknownMode(t *testing.T) {
	request := ReviewRequest{Rating: RatingKnown, AnswerMode: AnswerMode("video")}
	code, _ := normalizeAndValidateReviewRequest(&request)
	if code != "invalid_answer_mode" {
		t.Fatalf("code = %q, want invalid_answer_mode", code)
	}
}
