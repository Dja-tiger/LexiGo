package scenarios

import (
	"strings"

	"github.com/Dja-tiger/LexiGo/backend/internal/learning"
)

const (
	judgementReasonScenarioTargetPresent = "scenario_target_present"
	judgementReasonScenarioTargetMissing = "scenario_target_missing"
)

func buildScenarioReview(
	response string,
	target ScenarioReviewTarget,
	metadata StepReviewRequest,
) (learning.ReviewRequest, learning.ReviewAssessment) {
	matched := normalizedWholeTermPresent(response, target.Term)
	rating := learning.RatingAgain
	reason := judgementReasonScenarioTargetMissing
	matchedAnswer := ""
	if matched {
		rating = learning.RatingKnown
		reason = judgementReasonScenarioTargetPresent
		matchedAnswer = strings.TrimSpace(target.Term)
	}
	answerRevealed := false
	correct := matched
	request := learning.ReviewRequest{
		Rating:                rating,
		ResponseMS:            metadata.ResponseMS,
		AnswerMode:            learning.AnswerModeRecall,
		AnswerRevealed:        &answerRevealed,
		TimezoneOffsetMinutes: metadata.TimezoneOffsetMinutes,
	}
	assessment := learning.ReviewAssessment{
		RequestedRating: rating,
		EffectiveRating: rating,
		Correct:         &correct,
		JudgementSource: learning.JudgementSourceServer,
		JudgementReason: reason,
		MatchedAnswer:   matchedAnswer,
	}
	return request, assessment
}

func normalizedWholeTermPresent(response, target string) bool {
	normalizedResponse := learning.NormalizeSubmittedAnswer(response)
	normalizedTarget := learning.NormalizeSubmittedAnswer(target)
	if normalizedResponse == "" || normalizedTarget == "" {
		return false
	}
	return strings.Contains(" "+normalizedResponse+" ", " "+normalizedTarget+" ")
}
