import { RequestFailure } from "./request-failure";

export type AuthMode = "login" | "register" | "forgot" | "reset";
export type AuthField = "displayName" | "email" | "password" | "passwordConfirmation" | "token";
export type AuthFieldErrors = Partial<Record<AuthField, string>>;

export type AuthValues = {
  displayName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  token: string;
};

export type PasswordRequirement = {
  id: "length" | "byteLength" | "controlCharacters";
  label: string;
  met: boolean;
};

export type AuthFailurePresentation = {
  fieldErrors: AuthFieldErrors;
  formError: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const CONTROL_CHARACTER_PATTERN = /\p{Cc}/u;

function unicodeLength(value: string): number {
  return Array.from(value).length;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function passwordRequirements(value: string): PasswordRequirement[] {
  return [
    { id: "length", label: "Не менее 10 символов", met: unicodeLength(value) >= 10 },
    { id: "byteLength", label: "Не более 72 байт", met: byteLength(value) <= 72 },
    { id: "controlCharacters", label: "Без управляющих символов", met: !CONTROL_CHARACTER_PATTERN.test(value) },
  ];
}

export function validateAuthValues(mode: AuthMode, values: AuthValues): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const email = values.email.trim();

  if (mode !== "reset") {
    if (!email) errors.email = "Введите email.";
    else if (!EMAIL_PATTERN.test(email)) errors.email = "Введите корректный email.";
  }

  if (mode === "forgot") return errors;

  if (mode === "register") {
    const name = values.displayName.trim();
    const nameLength = unicodeLength(name);
    if (!name) errors.displayName = "Введите имя.";
    else if (nameLength < 2) errors.displayName = "Имя должно содержать минимум 2 символа.";
    else if (nameLength > 80) errors.displayName = "Имя должно содержать не более 80 символов.";
    else if (CONTROL_CHARACTER_PATTERN.test(name)) errors.displayName = "Имя содержит недопустимые символы.";
  }

  if (!values.password) {
    errors.password = mode === "login" ? "Введите пароль." : "Создайте пароль.";
  } else if (mode !== "login") {
    const unmet = passwordRequirements(values.password).find((requirement) => !requirement.met);
    if (unmet) errors.password = unmet.label + ".";
  }

  if (mode === "register" || mode === "reset") {
    if (!values.passwordConfirmation) errors.passwordConfirmation = "Повторите пароль.";
    else if (values.passwordConfirmation !== values.password) errors.passwordConfirmation = "Пароли не совпадают.";
  }

  if (mode === "reset" && !values.token.trim()) {
    errors.token = "Ссылка восстановления неполная. Запросите новую.";
  }

  return errors;
}

const FIELD_MESSAGES: Record<string, string> = {
  email_invalid: "Введите корректный email.",
  email_taken: "Аккаунт с таким email уже существует.",
  display_name_required: "Введите имя.",
  display_name_too_short: "Имя должно содержать минимум 2 символа.",
  display_name_too_long: "Имя должно содержать не более 80 символов.",
  display_name_invalid: "Имя содержит недопустимые символы.",
  password_too_short: "Пароль должен содержать минимум 10 символов.",
  password_too_long: "Пароль превышает ограничение 72 байта.",
  password_invalid: "Пароль содержит недопустимые управляющие символы.",
  password_reset_invalid: "Ссылка восстановления недействительна или уже использована.",
};

const FORM_MESSAGES: Record<string, string> = {
  invalid_credentials: "Неверный email или пароль.",
  rate_limited: "Слишком много попыток. Повторите через минуту.",
  password_reset_unavailable: "Восстановление пароля временно недоступно.",
  invalid_request: "Не удалось обработать данные формы. Проверьте поля и повторите.",
  internal_error: "Сервис временно недоступен. Повторите позже.",
};

function fieldFromFailure(failure: RequestFailure): AuthField | null {
  if (["displayName", "email", "password", "passwordConfirmation", "token"].includes(failure.field)) {
    return failure.field as AuthField;
  }
  if (failure.code.startsWith("display_name_")) return "displayName";
  if (failure.code.startsWith("email_")) return "email";
  if (failure.code.startsWith("password_") && failure.code !== "password_reset_invalid") return "password";
  if (failure.code === "password_reset_invalid") return "token";
  return null;
}

export function presentAuthFailure(error: unknown): AuthFailurePresentation {
  if (!(error instanceof RequestFailure)) {
    return {
      fieldErrors: {},
      formError: "Не удалось выполнить запрос. Проверьте соединение и повторите.",
    };
  }

  const field = fieldFromFailure(error);
  const fieldMessage = FIELD_MESSAGES[error.code];
  if (field && fieldMessage) {
    return { fieldErrors: { [field]: fieldMessage }, formError: "" };
  }

  if (error.kind === "offline") {
    return { fieldErrors: {}, formError: "Нет подключения к сети. Проверьте соединение и повторите." };
  }
  if (error.kind === "timeout") {
    return { fieldErrors: {}, formError: "Сервер отвечает слишком долго. Повторите запрос." };
  }
  return {
    fieldErrors: {},
    formError: FORM_MESSAGES[error.code] ?? "Не удалось выполнить запрос. Повторите позже.",
  };
}

export function isAcceptedResponse(value: unknown): value is { accepted: true } {
  return Boolean(value)
    && typeof value === "object"
    && !Array.isArray(value)
    && (value as { accepted?: unknown }).accepted === true;
}
