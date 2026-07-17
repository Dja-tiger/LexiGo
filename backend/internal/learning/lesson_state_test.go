package learning

import "testing"

func TestValidLessonState(t *testing.T) {
	rating := RatingKnown
	items := func(ratings ...*Rating) []LessonItem {
		result := make([]LessonItem, len(ratings))
		for index, itemRating := range ratings {
			result[index] = LessonItem{Position: index, Rating: itemRating}
		}
		return result
	}

	tests := []struct {
		name         string
		status       string
		currentIndex int
		items        []LessonItem
		want         bool
	}{
		{name: "new active lesson", status: "active", currentIndex: 0, items: items(nil, nil), want: true},
		{name: "resumed active lesson", status: "active", currentIndex: 1, items: items(&rating, nil), want: true},
		{name: "negative index", status: "active", currentIndex: -1, items: items(nil), want: false},
		{name: "index outside items", status: "active", currentIndex: 2, items: items(nil, nil), want: false},
		{name: "empty active lesson", status: "active", currentIndex: 0, items: nil, want: false},
		{name: "current item already rated", status: "active", currentIndex: 0, items: items(&rating), want: false},
		{name: "gap before current item", status: "active", currentIndex: 1, items: items(nil, nil), want: false},
		{name: "future item already rated", status: "active", currentIndex: 1, items: items(&rating, nil, &rating), want: false},
		{name: "missing server position", status: "active", currentIndex: 1, items: []LessonItem{{Position: 0, Rating: &rating}, {Position: 2}}, want: false},
		{name: "completed lesson", status: "completed", currentIndex: 2, items: items(&rating, &rating), want: true},
		{name: "completed lesson with missing rating", status: "completed", currentIndex: 2, items: items(&rating, nil), want: false},
		{name: "completed lesson with wrong index", status: "completed", currentIndex: 1, items: items(&rating, &rating), want: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := validLessonState(test.status, test.currentIndex, test.items); got != test.want {
				t.Fatalf("validLessonState() = %v, want %v", got, test.want)
			}
		})
	}
}
