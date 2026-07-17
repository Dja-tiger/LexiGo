package learning

func validLessonState(status string, currentIndex int, items []LessonItem) bool {
	if len(items) == 0 {
		return false
	}
	for index, item := range items {
		if item.Position != index {
			return false
		}
	}

	switch status {
	case "active":
		if currentIndex < 0 || currentIndex >= len(items) {
			return false
		}
		for index, item := range items {
			if index < currentIndex {
				if item.Rating == nil {
					return false
				}
				continue
			}
			if item.Rating != nil {
				return false
			}
		}
		return true
	case "completed":
		if currentIndex != len(items) {
			return false
		}
		for _, item := range items {
			if item.Rating == nil {
				return false
			}
		}
		return true
	case "discarded":
		return currentIndex >= 0 && currentIndex <= len(items)
	default:
		return false
	}
}
