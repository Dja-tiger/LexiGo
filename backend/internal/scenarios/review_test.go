package scenarios

import (
	"testing"

	"github.com/Dja-tiger/LexiGo/backend/internal/learning"
)

func TestNormalizedWholeTermPresent(t *testing.T) {
	tests := []struct {
		name     string
		response string
		target   string
		want     bool
	}{
		{name: "exact term", response: "The incident is affecting checkout requests.", target: "incident", want: true},
		{name: "case and punctuation", response: "Rollback, then validate the release.", target: "rollback", want: true},
		{name: "multiword term", response: "We should compare event-time with processing time.", target: "event time", want: true},
		{name: "slash term", response: "This is a go/no-go decision for the release.", target: "go/no-go", want: true},
		{name: "substring rejected", response: "The homeowner approved the change.", target: "owner", want: false},
		{name: "missing term", response: "We should investigate the database metrics.", target: "latency", want: false},
		{name: "empty response", response: " ", target: "risk", want: false},
		{name: "empty target", response: "The risk is documented.", target: " ", want: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := normalizedWholeTermPresent(test.response, test.target); got != test.want {
				t.Fatalf("normalizedWholeTermPresent(%q, %q) = %v, want %v", test.response, test.target, got, test.want)
			}
		})
	}
}

func TestBuildScenarioReview(t *testing.T) {
	responseMS := 1450
	metadata := StepReviewRequest{ResponseMS: &responseMS, TimezoneOffsetMinutes: -180}
	target := ScenarioReviewTarget{Term: "mitigation"}

	request, assessment := buildScenarioReview(
		"The mitigation is active and the error rate is decreasing.",
		target,
		metadata,
	)
	if request.Rating != learning.RatingKnown || request.AnswerMode != learning.AnswerModeRecall {
		t.Fatalf("successful review request = %+v", request)
	}
	if request.ResponseMS == nil || *request.ResponseMS != responseMS || request.TimezoneOffsetMinutes != -180 {
		t.Fatalf("review metadata = %+v", request)
	}
	if request.AnswerRevealed == nil || *request.AnswerRevealed {
		t.Fatalf("answerRevealed = %v, want false", request.AnswerRevealed)
	}
	if assessment.Correct == nil || !*assessment.Correct {
		t.Fatalf("successful assessment correctness = %v", assessment.Correct)
	}
	if assessment.EffectiveRating != learning.RatingKnown || assessment.JudgementSource != learning.JudgementSourceServer {
		t.Fatalf("successful assessment = %+v", assessment)
	}
	if assessment.JudgementReason != judgementReasonScenarioTargetPresent || assessment.MatchedAnswer != target.Term {
		t.Fatalf("successful judgement evidence = %+v", assessment)
	}

	request, assessment = buildScenarioReview(
		"The database metrics are stable and the investigation is continuing.",
		target,
		metadata,
	)
	if request.Rating != learning.RatingAgain || assessment.EffectiveRating != learning.RatingAgain {
		t.Fatalf("failed review rating: request=%+v assessment=%+v", request, assessment)
	}
	if assessment.Correct == nil || *assessment.Correct {
		t.Fatalf("failed assessment correctness = %v", assessment.Correct)
	}
	if assessment.JudgementReason != judgementReasonScenarioTargetMissing || assessment.MatchedAnswer != "" {
		t.Fatalf("failed judgement evidence = %+v", assessment)
	}
}
