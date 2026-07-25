package learning

import (
	"strings"
	"testing"
)

func TestValidateTrustedReviewAssessment(t *testing.T) {
	falseValue := false
	trueValue := true
	knownRequest := ReviewRequest{
		Rating:         RatingKnown,
		AnswerMode:     AnswerModeRecall,
		AnswerRevealed: &falseValue,
	}
	validSuccess := ReviewAssessment{
		RequestedRating: RatingKnown,
		EffectiveRating: RatingKnown,
		Correct:         &trueValue,
		JudgementSource: JudgementSourceServer,
		JudgementReason: "scenario_target_present",
		MatchedAnswer:   "rollback",
	}
	validFailure := ReviewAssessment{
		RequestedRating: RatingAgain,
		EffectiveRating: RatingAgain,
		Correct:         &falseValue,
		JudgementSource: JudgementSourceServer,
		JudgementReason: "scenario_target_missing",
	}

	tests := []struct {
		name       string
		request    ReviewRequest
		assessment ReviewAssessment
		wantError  bool
	}{
		{name: "successful server assessment", request: knownRequest, assessment: validSuccess},
		{
			name: "failed server assessment",
			request: ReviewRequest{
				Rating:         RatingAgain,
				AnswerMode:     AnswerModeRecall,
				AnswerRevealed: &falseValue,
			},
			assessment: validFailure,
		},
		{
			name:       "passive mode",
			request:    ReviewRequest{Rating: RatingKnown, AnswerMode: AnswerModeStudy},
			assessment: validSuccess,
			wantError:  true,
		},
		{
			name: "revealed answer",
			request: ReviewRequest{
				Rating:         RatingKnown,
				AnswerMode:     AnswerModeRecall,
				AnswerRevealed: &trueValue,
			},
			assessment: validSuccess,
			wantError:  true,
		},
		{
			name:    "non-server source",
			request: knownRequest,
			assessment: func() ReviewAssessment {
				value := validSuccess
				value.JudgementSource = JudgementSourceLegacyClient
				return value
			}(),
			wantError: true,
		},
		{
			name:    "missing reason",
			request: knownRequest,
			assessment: func() ReviewAssessment {
				value := validSuccess
				value.JudgementReason = " "
				return value
			}(),
			wantError: true,
		},
		{
			name:    "missing correctness",
			request: knownRequest,
			assessment: func() ReviewAssessment {
				value := validSuccess
				value.Correct = nil
				return value
			}(),
			wantError: true,
		},
		{
			name:    "requested rating mismatch",
			request: knownRequest,
			assessment: func() ReviewAssessment {
				value := validSuccess
				value.RequestedRating = RatingAlmost
				return value
			}(),
			wantError: true,
		},
		{
			name:    "successful effective rating mismatch",
			request: knownRequest,
			assessment: func() ReviewAssessment {
				value := validSuccess
				value.EffectiveRating = RatingAlmost
				return value
			}(),
			wantError: true,
		},
		{
			name:    "successful missing match",
			request: knownRequest,
			assessment: func() ReviewAssessment {
				value := validSuccess
				value.MatchedAnswer = ""
				return value
			}(),
			wantError: true,
		},
		{
			name: "failed non-again rating",
			request: ReviewRequest{
				Rating:     RatingKnown,
				AnswerMode: AnswerModeRecall,
			},
			assessment: func() ReviewAssessment {
				value := validFailure
				value.RequestedRating = RatingKnown
				value.EffectiveRating = RatingKnown
				return value
			}(),
			wantError: true,
		},
		{
			name: "failed with matched evidence",
			request: ReviewRequest{
				Rating:     RatingAgain,
				AnswerMode: AnswerModeRecall,
			},
			assessment: func() ReviewAssessment {
				value := validFailure
				value.MatchedAnswer = "risk"
				return value
			}(),
			wantError: true,
		},
		{
			name:    "oversized submitted answer",
			request: knownRequest,
			assessment: func() ReviewAssessment {
				value := validSuccess
				answer := strings.Repeat("a", MaxSubmittedAnswerRunes+1)
				value.SubmittedAnswer = &answer
				return value
			}(),
			wantError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateTrustedReviewAssessment(test.request, test.assessment)
			if test.wantError && err == nil {
				t.Fatal("validateTrustedReviewAssessment() error = nil, want error")
			}
			if !test.wantError && err != nil {
				t.Fatalf("validateTrustedReviewAssessment() error = %v", err)
			}
		})
	}
}
