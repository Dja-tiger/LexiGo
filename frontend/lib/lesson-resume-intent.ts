export const LESSON_RESUME_QUERY_PARAMETER = "resume";
export const LESSON_RESUME_QUERY_VALUE = "1";
export const ACTIVE_LESSON_PATH = "/lesson/active";

export function lessonResumeURL(): string {
  return `${ACTIVE_LESSON_PATH}?${LESSON_RESUME_QUERY_PARAMETER}=${LESSON_RESUME_QUERY_VALUE}`;
}

export function consumeLessonResumeIntent(
  location: Pick<Location, "pathname" | "search" | "hash">,
  history: Pick<History, "state" | "replaceState">,
): boolean {
  if (location.pathname !== ACTIVE_LESSON_PATH) return false;

  const parameters = new URLSearchParams(location.search);
  if (parameters.get(LESSON_RESUME_QUERY_PARAMETER) !== LESSON_RESUME_QUERY_VALUE) return false;

  parameters.delete(LESSON_RESUME_QUERY_PARAMETER);
  const query = parameters.toString();
  history.replaceState(
    history.state,
    "",
    `${ACTIVE_LESSON_PATH}${query ? `?${query}` : ""}${location.hash}`,
  );
  return true;
}
