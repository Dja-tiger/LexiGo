package learning

import (
	"strings"
	"unicode"
	"unicode/utf8"
)

const MaxSubmittedAnswerRunes = 500

const (
	JudgementSourceStudy        = "study"
	JudgementSourceServer       = "server"
	JudgementSourceLegacyClient = "legacy_client"

	JudgementReasonPassiveExposure    = "passive_exposure"
	JudgementReasonAcceptedExact      = "accepted_exact"
	JudgementReasonAcceptedNormalized = "accepted_normalized"
	JudgementReasonRejectedNoAnswer   = "rejected_no_answer"
	JudgementReasonRejectedNoMatch    = "rejected_no_match"
	JudgementReasonLegacyCorrect      = "legacy_client_correct"
	JudgementReasonLegacyIncorrect    = "legacy_client_incorrect"
	JudgementReasonLegacyNoAnswer     = "legacy_client_no_answer"
)

type AnswerDefinition struct {
	Kind            string
	Translation     string
	ClozeAnswer     string
	AcceptedAnswers []string
}

type ReviewAssessment struct {
	RequestedRating     Rating
	EffectiveRating     Rating
	Correct             *bool
	SubmittedAnswer     *string
	JudgementSource     string
	JudgementReason     string
	MatchedAnswer       string
	SuggestionAvailable bool
}

// NormalizeSubmittedAnswer is deliberately deterministic and conservative.
// It normalizes case, Russian ё, whitespace and punctuation, but never applies
// stemming, substring matching, edit distance or an LLM decision. Morphological
// and semantic variants must be curated explicitly in words.accepted_answers.
func NormalizeSubmittedAnswer(value string) string {
	var builder strings.Builder
	builder.Grow(len(value))
	spacePending := false

	for _, current := range strings.TrimSpace(value) {
		current = unicode.ToLower(current)
		if current == 'ё' {
			current = 'е'
		}
		switch {
		case unicode.IsLetter(current) || unicode.IsNumber(current):
			if spacePending && builder.Len() > 0 {
				builder.WriteByte(' ')
			}
			builder.WriteRune(current)
			spacePending = false
		case current == '\'' || current == '’' || current == 'ʼ':
			// Apostrophes do not create a token boundary: "don't" and "dont"
			// are judged identically.
		default:
			spacePending = builder.Len() > 0
		}
	}
	return strings.TrimSpace(builder.String())
}

func SubmittedAnswerWithinLimit(value string) bool {
	return utf8.RuneCountInString(value) <= MaxSubmittedAnswerRunes
}

// canonicalTranslationCandidates preserves the complete catalog translation
// and also exposes alternatives separated by the catalog's supported
// delimiters. This is evaluated at request time so a clean database seeded
// after migrations behaves identically to an upgraded database backfilled by
// migration 000013.
func canonicalTranslationCandidates(value string) []string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	candidates := []string{trimmed}
	parts := strings.FieldsFunc(trimmed, func(current rune) bool {
		return current == ',' || current == ';' || current == '/'
	})
	if len(parts) <= 1 {
		return candidates
	}
	for _, part := range parts {
		if alternative := strings.TrimSpace(part); alternative != "" {
			candidates = append(candidates, alternative)
		}
	}
	return candidates
}

func acceptedAnswerCandidates(definition AnswerDefinition) []string {
	candidates := make([]string, 0, len(definition.AcceptedAnswers)+4)
	if definition.Kind == "phrase" && strings.TrimSpace(definition.ClozeAnswer) != "" {
		candidates = append(candidates, definition.ClozeAnswer)
	} else {
		candidates = append(candidates, canonicalTranslationCandidates(definition.Translation)...)
	}
	candidates = append(candidates, definition.AcceptedAnswers...)

	seen := make(map[string]struct{}, len(candidates))
	result := make([]string, 0, len(candidates))
	for _, candidate := range candidates {
		trimmed := strings.TrimSpace(candidate)
		normalized := NormalizeSubmittedAnswer(trimmed)
		if normalized == "" {
			continue
		}
		if _, exists := seen[normalized]; exists {
			continue
		}
		seen[normalized] = struct{}{}
		result = append(result, trimmed)
	}
	return result
}

func JudgeSubmittedAnswer(definition AnswerDefinition, submitted string) (bool, string, string) {
	trimmed := strings.TrimSpace(submitted)
	if trimmed == "" {
		return false, JudgementReasonRejectedNoAnswer, ""
	}
	normalized := NormalizeSubmittedAnswer(trimmed)
	if normalized == "" {
		return false, JudgementReasonRejectedNoAnswer, ""
	}

	for _, candidate := range acceptedAnswerCandidates(definition) {
		if strings.EqualFold(trimmed, strings.TrimSpace(candidate)) {
			return true, JudgementReasonAcceptedExact, candidate
		}
		if normalized == NormalizeSubmittedAnswer(candidate) {
			return true, JudgementReasonAcceptedNormalized, candidate
		}
	}
	return false, JudgementReasonRejectedNoMatch, ""
}

func boolPointer(value bool) *bool {
	return &value
}

// AssessReview keeps confidence and correctness as independent facts. The
// requested rating is stored for learner analytics, while effective_rating is
// the only value allowed to mutate the spaced-repetition state.
func AssessReview(request ReviewRequest, definition AnswerDefinition) ReviewAssessment {
	assessment := ReviewAssessment{
		RequestedRating: request.Rating,
		EffectiveRating: request.Rating,
		SubmittedAnswer: request.SubmittedAnswer,
	}

	if !request.AnswerMode.Objective() {
		assessment.JudgementSource = JudgementSourceStudy
		assessment.JudgementReason = JudgementReasonPassiveExposure
		return assessment
	}

	if request.SubmittedAnswer != nil {
		correct, reason, matched := JudgeSubmittedAnswer(definition, *request.SubmittedAnswer)
		assessment.Correct = boolPointer(correct)
		assessment.JudgementSource = JudgementSourceServer
		assessment.JudgementReason = reason
		assessment.MatchedAnswer = matched
		assessment.SuggestionAvailable = !correct && NormalizeSubmittedAnswer(*request.SubmittedAnswer) != ""
	} else if request.Correct != nil {
		assessment.Correct = boolPointer(*request.Correct)
		assessment.JudgementSource = JudgementSourceLegacyClient
		if *request.Correct {
			assessment.JudgementReason = JudgementReasonLegacyCorrect
		} else {
			assessment.JudgementReason = JudgementReasonLegacyIncorrect
		}
	} else {
		assessment.Correct = boolPointer(false)
		assessment.JudgementSource = JudgementSourceLegacyClient
		assessment.JudgementReason = JudgementReasonLegacyNoAnswer
	}

	if assessment.Correct != nil && !*assessment.Correct {
		assessment.EffectiveRating = RatingAgain
	}
	return assessment
}
