import { describe, expect, it } from "vitest";

import {
  isAcceptedResponse,
  passwordRequirements,
  presentAuthFailure,
  validateAuthValues,
  type AuthValues,
} from "./auth-form";
import { RequestFailure } from "./request-failure";

const VALUES: AuthValues = {
  displayName: "Test User",
  email: "test@example.com",
  password: "strong-password",
  passwordConfirmation: "strong-password",
  token: "reset-token",
};

describe("auth form validation", () => {
  it("requires a public registration name and matching strong passwords", () => {
    expect(validateAuthValues("register", VALUES)).toEqual({});
    expect(validateAuthValues("register", {
      ...VALUES,
      displayName: " ",
      password: "short",
      passwordConfirmation: "different",
    })).toEqual({
      displayName: "Введите имя.",
      password: "Не менее 10 символов.",
      passwordConfirmation: "Пароли не совпадают.",
    });
  });

  it("keeps login validation minimal and validates recovery separately", () => {
    expect(validateAuthValues("login", { ...VALUES, password: "x" })).toEqual({});
    expect(validateAuthValues("forgot", { ...VALUES, email: "broken" })).toEqual({
      email: "Введите корректный email.",
    });
    expect(validateAuthValues("reset", { ...VALUES, token: "", passwordConfirmation: "other" })).toEqual({
      passwordConfirmation: "Пароли не совпадают.",
      token: "Ссылка восстановления неполная. Запросите новую.",
    });
  });

  it("updates password requirements without imposing composition rules", () => {
    expect(passwordRequirements("short").map((item) => item.met)).toEqual([false, true, true]);
    expect(passwordRequirements("correct horse battery staple").every((item) => item.met)).toBe(true);
    expect(passwordRequirements("long-enough\u0000").find((item) => item.id === "controlCharacters")?.met).toBe(false);
  });
});

describe("stable API error presentation", () => {
  it("binds backend field metadata to the corresponding input", () => {
    expect(presentAuthFailure(new RequestFailure("client", "english text may change", {
      status: 422,
      code: "display_name_too_short",
      field: "displayName",
    }))).toEqual({
      fieldErrors: { displayName: "Имя должно содержать минимум 2 символа." },
      formError: "",
    });
  });

  it("does not parse backend English messages", () => {
    expect(presentAuthFailure(new RequestFailure("unauthorized", "arbitrary backend wording", {
      status: 401,
      code: "invalid_credentials",
    }))).toEqual({
      fieldErrors: {},
      formError: "Неверный email или пароль.",
    });
  });

  it("distinguishes rate limit, offline and reset-token errors", () => {
    expect(presentAuthFailure(new RequestFailure("client", "", { status: 429, code: "rate_limited" })).formError)
      .toContain("через минуту");
    expect(presentAuthFailure(new RequestFailure("offline", "", { code: "network_offline" })).formError)
      .toContain("подключения к сети");
    expect(presentAuthFailure(new RequestFailure("client", "", {
      status: 400,
      code: "password_reset_invalid",
      field: "token",
    })).fieldErrors.token).toContain("недействительна");
  });

  it("validates the generic accepted recovery response", () => {
    expect(isAcceptedResponse({ accepted: true })).toBe(true);
    expect(isAcceptedResponse({ accepted: false })).toBe(false);
    expect(isAcceptedResponse(null)).toBe(false);
  });
});
