export type FeedbackCategory = "blocking-error" | "error" | "success" | "info";

export type FeedbackPresentation = "banner" | "toast";
export type FeedbackLiveMode = "assertive" | "polite";
export type FeedbackRole = "alert" | "status";

export type FeedbackAction = {
  label: string;
  onInvoke: () => void;
};

export type FeedbackInput = {
  category: FeedbackCategory;
  title?: string;
  message: string;
  key?: string;
  action?: FeedbackAction;
};

export type FeedbackPolicy = {
  presentation: FeedbackPresentation;
  role: FeedbackRole;
  live: FeedbackLiveMode;
  dismissible: boolean;
  autoDismiss: boolean;
};

export type FeedbackItem = FeedbackInput & FeedbackPolicy & {
  id: string;
  durationMs: number | null;
};

export type FeedbackState = {
  banners: FeedbackItem[];
  activeToast: FeedbackItem | null;
  toastQueue: FeedbackItem[];
};

export type FeedbackActionState =
  | { type: "publish"; item: FeedbackItem }
  | { type: "dismiss"; id: string }
  | { type: "clear-key"; key: string };

export const INITIAL_FEEDBACK_STATE: FeedbackState = {
  banners: [],
  activeToast: null,
  toastQueue: [],
};

const MIN_TOAST_DURATION_MS = 5_000;
const MAX_TOAST_DURATION_MS = 12_000;
const CHARACTER_READING_TIME_MS = 45;

const POLICY: Record<FeedbackCategory, FeedbackPolicy> = {
  "blocking-error": {
    presentation: "banner",
    role: "alert",
    live: "assertive",
    dismissible: false,
    autoDismiss: false,
  },
  error: {
    presentation: "toast",
    role: "status",
    live: "polite",
    dismissible: true,
    autoDismiss: true,
  },
  success: {
    presentation: "toast",
    role: "status",
    live: "polite",
    dismissible: true,
    autoDismiss: true,
  },
  info: {
    presentation: "toast",
    role: "status",
    live: "polite",
    dismissible: true,
    autoDismiss: true,
  },
};

export function feedbackPolicy(category: FeedbackCategory): FeedbackPolicy {
  return POLICY[category];
}

export function feedbackDurationMs(input: Pick<FeedbackInput, "category" | "title" | "message">): number | null {
  const policy = feedbackPolicy(input.category);
  if (!policy.autoDismiss) return null;

  const textLength = `${input.title ?? ""} ${input.message}`.trim().length;
  return Math.min(
    MAX_TOAST_DURATION_MS,
    Math.max(MIN_TOAST_DURATION_MS, MIN_TOAST_DURATION_MS + textLength * CHARACTER_READING_TIME_MS),
  );
}

export function createFeedbackItem(id: string, input: FeedbackInput): FeedbackItem {
  const policy = feedbackPolicy(input.category);
  return {
    ...input,
    ...policy,
    id,
    durationMs: feedbackDurationMs(input),
  };
}

function advanceToast(state: FeedbackState): Pick<FeedbackState, "activeToast" | "toastQueue"> {
  if (state.toastQueue.length === 0) {
    return { activeToast: null, toastQueue: [] };
  }
  const [activeToast, ...toastQueue] = state.toastQueue;
  return { activeToast, toastQueue };
}

function publishBanner(state: FeedbackState, item: FeedbackItem): FeedbackState {
  if (!item.key) {
    return { ...state, banners: [...state.banners, item] };
  }

  const existingIndex = state.banners.findIndex((banner) => banner.key === item.key);
  if (existingIndex < 0) {
    return { ...state, banners: [...state.banners, item] };
  }

  const banners = [...state.banners];
  banners[existingIndex] = item;
  return { ...state, banners };
}

function dismissToast(state: FeedbackState, id: string): FeedbackState {
  if (state.activeToast?.id === id) {
    return { ...state, ...advanceToast(state) };
  }

  return {
    ...state,
    toastQueue: state.toastQueue.filter((item) => item.id !== id),
  };
}

export function feedbackReducer(state: FeedbackState, action: FeedbackActionState): FeedbackState {
  if (action.type === "publish") {
    if (action.item.presentation === "banner") return publishBanner(state, action.item);
    if (!state.activeToast) return { ...state, activeToast: action.item };
    return { ...state, toastQueue: [...state.toastQueue, action.item] };
  }

  if (action.type === "dismiss") {
    if (state.banners.some((banner) => banner.id === action.id)) {
      return { ...state, banners: state.banners.filter((banner) => banner.id !== action.id) };
    }
    return dismissToast(state, action.id);
  }

  const banners = state.banners.filter((item) => item.key !== action.key);
  const queued = state.toastQueue.filter((item) => item.key !== action.key);
  if (state.activeToast?.key !== action.key) {
    return { ...state, banners, toastQueue: queued };
  }

  const [activeToast = null, ...toastQueue] = queued;
  return { banners, activeToast, toastQueue };
}
