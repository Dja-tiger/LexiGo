package learning

import "testing"

func TestValidLessonState(t *testing.T) {
	rating := RatingKnown
	tests := []struct {
		name         string
		status       string
		currentIndex int
		items        []LessonItem
		want         bool
	}{
		{name: "new active lesson", status: "active", currentIndex: 0, items: []LessonItem{{}, {}}, want: true},
		{name: "resumed active lesson", status: "active", currentIndex: 1, items: []LessonItem{{Rating: &rating}, {}}, want: true},
		{name: "negative index", status: "active", currentIndex: -1, items: []LessonItem{{}}, want: false},
		{name: "index outside items", status: "active", currentIndex: 2, items: []LessonItem{{}, {}}, want: false},
		{name: "empty active lesson", status: "active", currentIndex: 0, items: nil, want: false},
		{name: "current item already rated", status: "active", currentIndex: 0, items: []LessonItem{{Rating: &rating}}, want: false},
		{name: "gap before current item", status: "active", currentIndex: 1, items: []LessonItem{{}, {}}, want: false},
		{name: "future item already rated", status: "active", currentIndex: 1, items: []LessonItem{{Rating: &rating}, {}, {Rating: &rating}}, want: false},
		{name: "completed lesson", status: "completed", currentIndex: 2, items: []LessonItem{{Rating: &rating}, {Rating: &rating}}, want: true},
		{name: "completed lesson with missing rating", status: "completed", currentIndex: 2, items: []LessonItem{{Rating: &rating}, {}}, want: false},
		{name: "completed lesson with wrong index", status: "completed", currentIndex: 1, items: []LessonItem{{Rating: &rating}, {Rating: &rating}}, want: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := validLessonState(test.status, test.currentIndex, test.items); got != test.want {
				t.Fatalf("validLessonState() = %v, want %v", got, test.want)
			}
		})
	}
}
