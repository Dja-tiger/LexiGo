package learning

import (
	"strings"
	"testing"
)

func TestNormalizeSubmittedAnswerIsPredictable(t *testing.T) {
	cases := map[string]string{
		"  Ёмкость,   системы! ": "емкость системы",
		"backward-compatible":    "backward compatible",
		"DON'T":                  "dont",
	}
	for input, expected := range cases {
		if actual := NormalizeSubmittedAnswer(input); actual != expected {
			t.Fatalf("NormalizeSubmittedAnswer(%q) = %q, want %q", input, actual, expected)
		}
	}
}

func TestJudgeSubmittedAnswerAcceptsCanonicalAlternativesAndCuratedMorphology(t *testing.T) {
	definition := AnswerDefinition{
		Kind:            "word",
		Translation:     "инцидент, происшествие",
		AcceptedAnswers: []string{"инцидента"},
	}
	for _, answer := range []string{"Инцидент", "происшествие!", "инцидента"} {
		correct, reason, matched := JudgeSubmittedAnswer(definition, answer)
		if !correct || matched == "" {
			t.Fatalf("answer %q correct=%v reason=%q matched=%q", answer, correct, reason, matched)
		}
	}
}

func TestCanonicalTranslationCandidatesPreserveFullValueAndSplitSupportedDelimiters(t *testing.T) {
	actual := canonicalTranslationCandidates("инцидент, происшествие; событие / случай")
	expected := []string{"инцидент, происшествие; событие / случай", "инцидент", "происшествие", "событие", "случай"}
	if len(actual) != len(expected) {
		t.Fatalf("candidates = %#v, want %#v", actual, expected)
	}
	for index := range expected {
		if actual[index] != expected[index] {
			t.Fatalf("candidate %d = %q, want %q", index, actual[index], expected[index])
		}
	}
}

func TestJudgeSubmittedAnswerAcceptsPhraseClozeVariants(t *testing.T) {
	definition := AnswerDefinition{
		Kind:            "phrase",
		Translation:     "Это изменение обратно совместимо.",
		ClozeAnswer:     "backward",
		AcceptedAnswers: []string{"backwards"},
	}
	for _, answer := range []string{"Backward", "backwards"} {
		correct, _, _ := JudgeSubmittedAnswer(definition, answer)
		if !correct {
			t.Fatalf("cloze answer %q was rejected", answer)
		}
	}
}

func TestJudgeSubmittedAnswerRejectsSubstringAndUncuratedMorphology(t *testing.T) {
	definition := AnswerDefinition{
		Kind:            "word",
		Translation:     "кэш",
		AcceptedAnswers: []string{"кэш"},
	}
	for _, answer := range []string{"к", "кэширование", "cache"} {
		correct, reason, matched := JudgeSubmittedAnswer(definition, answer)
		if correct || reason != JudgementReasonRejectedNoMatch || matched != "" {
			t.Fatalf("answer %q correct=%v reason=%q matched=%q", answer, correct, reason, matched)
		}
	}
}

func TestAssessReviewSeparatesConfidenceFromSchedulerRating(t *testing.T) {
	answer := "неверный ответ"
	assessment := AssessReview(ReviewRequest{
		Rating:          RatingKnown,
		AnswerMode:      AnswerModeRecall,
		SubmittedAnswer: &answer,
	}, AnswerDefinition{
		Kind:            "word",
		Translation:     "правильный ответ",
		AcceptedAnswers: []string{"правильный ответ"},
	})

	if assessment.RequestedRating != RatingKnown {
		t.Fatalf("requested rating = %q, want known", assessment.RequestedRating)
	}
	if assessment.EffectiveRating != RatingAgain {
		t.Fatalf("effective rating = %q, want again", assessment.EffectiveRating)
	}
	if assessment.Correct == nil || *assessment.Correct {
		t.Fatalf("correct = %v, want false", assessment.Correct)
	}
	if !assessment.SuggestionAvailable {
		t.Fatal("rejected non-empty server-judged answer must allow a moderation suggestion")
	}
}

func TestNormalizeAndValidateReviewRequestRejectsAmbiguousAndOversizedAnswers(t *testing.T) {
	answer := "accepted"
	legacyCorrect := true
	request := ReviewRequest{AnswerMode: AnswerModeRecall, SubmittedAnswer: &answer, Correct: &legacyCorrect}
	if code, _ := normalizeAndValidateReviewRequest(&request); code != "ambiguous_objective_answer" {
		t.Fatalf("validation code = %q, want ambiguous_objective_answer", code)
	}

	oversized := strings.Repeat("я", MaxSubmittedAnswerRunes+1)
	request = ReviewRequest{AnswerMode: AnswerModeRecall, SubmittedAnswer: &oversized}
	if code, _ := normalizeAndValidateReviewRequest(&request); code != "invalid_submitted_answer" {
		t.Fatalf("validation code = %q, want invalid_submitted_answer", code)
	}
}

func TestAssessReviewPreservesCorrectConfidenceAndStudySemantics(t *testing.T) {
	answer := "правильный ответ"
	objective := AssessReview(ReviewRequest{
		Rating:          RatingAlmost,
		AnswerMode:      AnswerModeRecall,
		SubmittedAnswer: &answer,
	}, AnswerDefinition{Kind: "word", Translation: "правильный ответ"})
	if objective.EffectiveRating != RatingAlmost || objective.Correct == nil || !*objective.Correct {
		t.Fatalf("objective assessment = %+v", objective)
	}

	study := AssessReview(ReviewRequest{
		Rating:     RatingKnown,
		AnswerMode: AnswerModeStudy,
	}, AnswerDefinition{})
	if study.Correct != nil || study.EffectiveRating != RatingKnown || study.JudgementSource != JudgementSourceStudy {
		t.Fatalf("study assessment = %+v", study)
	}
}
