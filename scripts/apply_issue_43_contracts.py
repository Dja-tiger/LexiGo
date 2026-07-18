from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one marker, found {count}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "backend/integration/password_recovery_test.go",
    'import (\n\t"bytes"\n\t"context"\n',
    'import (\n\t"bytes"\n\t"context"\n\t"encoding/json"\n',
    "integration JSON import",
)

replace_once(
    "backend/internal/auth/postgres_repository.go",
    '''\tvar (
\t\tresetID   string
\t\tuserID    string
\t\texpiresAt time.Time
\t\tusedAt    *time.Time
\t)
\terr = tx.QueryRow(ctx, `
\t\tselect id::text, user_id::text, expires_at, used_at
\t\tfrom password_reset_tokens
\t\twhere token_hash = $1
\t\tfor update
\t`, tokenHash).Scan(&resetID, &userID, &expiresAt, &usedAt)
''',
    '''\tvar (
\t\tuserID    string
\t\texpiresAt time.Time
\t\tusedAt    *time.Time
\t)
\terr = tx.QueryRow(ctx, `
\t\tselect user_id::text, expires_at, used_at
\t\tfrom password_reset_tokens
\t\twhere token_hash = $1
\t\tfor update
\t`, tokenHash).Scan(&userID, &expiresAt, &usedAt)
''',
    "password reset row lock query",
)
replace_once(
    "backend/internal/auth/postgres_repository.go",
    '''\t_ = resetID
\treturn nil
''',
    '''\treturn nil
''',
    "remove unused reset ID",
)

openapi = Path("api/openapi.yaml")
text = openapi.read_text(encoding="utf-8")
text = text.replace("version: 0.7.0", "version: 0.8.0", 1)
login_marker = '''  /api/v1/auth/refresh:
'''
recovery_paths = '''  /api/v1/auth/password-reset/request:
    post:
      operationId: requestPasswordReset
      tags: [auth]
      summary: Запросить одноразовую ссылку восстановления пароля.
      description: Ответ одинаков для существующего и отсутствующего аккаунта и не раскрывает регистрацию email.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PasswordResetRequest"
      responses:
        "202":
          description: Запрос принят. Письмо отправляется только для существующего аккаунта.
          headers:
            Cache-Control:
              schema: { type: string, const: no-store }
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AcceptedResponse"
        "400":
          $ref: "#/components/responses/BadRequest"
        "429":
          $ref: "#/components/responses/TooManyRequests"
  /api/v1/auth/password-reset/confirm:
    post:
      operationId: confirmPasswordReset
      tags: [auth]
      summary: Установить новый пароль по одноразовому токену.
      description: Успешная операция отзывает все refresh-сессии пользователя.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PasswordResetConfirmRequest"
      responses:
        "204":
          description: Пароль изменён, токен использован, активные сессии отозваны.
        "400":
          $ref: "#/components/responses/BadRequest"
        "422":
          $ref: "#/components/responses/ValidationError"
        "429":
          $ref: "#/components/responses/TooManyRequests"
'''
if text.count(login_marker) != 1:
    raise SystemExit("OpenAPI refresh path marker not found exactly once")
text = text.replace(login_marker, recovery_paths + login_marker, 1)

text = text.replace(
    '''        "422":
          $ref: "#/components/responses/ValidationError"
  /api/v1/auth/login:
''',
    '''        "422":
          $ref: "#/components/responses/ValidationError"
        "429":
          $ref: "#/components/responses/TooManyRequests"
  /api/v1/auth/login:
''',
    1,
)
text = text.replace(
    '''        "401":
          $ref: "#/components/responses/Unauthorized"
  /api/v1/auth/password-reset/request:
''',
    '''        "401":
          $ref: "#/components/responses/Unauthorized"
        "429":
          $ref: "#/components/responses/TooManyRequests"
  /api/v1/auth/password-reset/request:
''',
    1,
)

responses_marker = '''    Unauthorized:
'''
responses = '''    BadRequest:
      description: Запрос содержит некорректный JSON, недействительный или использованный reset token.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    TooManyRequests:
      description: Превышен лимит запросов для IP и endpoint.
      headers:
        Retry-After:
          schema: { type: integer, const: 60 }
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
'''
if text.count(responses_marker) != 1:
    raise SystemExit("OpenAPI response marker not found exactly once")
text = text.replace(responses_marker, responses + responses_marker, 1)

text = text.replace(
    '''    RegisterRequest:
      type: object
      required: [email, password]
''',
    '''    RegisterRequest:
      type: object
      required: [email, password, displayName]
''',
    1,
)
text = text.replace(
    '''        displayName:
          type: string
          maxLength: 100
    LoginRequest:
''',
    '''        displayName:
          type: string
          minLength: 2
          maxLength: 80
    LoginRequest:
''',
    1,
)

schema_marker = '''    AuthResponse:
'''
recovery_schemas = '''    PasswordResetRequest:
      type: object
      additionalProperties: false
      required: [email]
      properties:
        email:
          type: string
          description: Ответ endpoint не раскрывает, зарегистрирован ли адрес.
    PasswordResetConfirmRequest:
      type: object
      additionalProperties: false
      required: [token, newPassword]
      properties:
        token:
          type: string
          minLength: 43
          maxLength: 43
          description: Одноразовый base64url bearer token из письма.
        newPassword:
          type: string
          minLength: 10
          maxLength: 72
    AcceptedResponse:
      type: object
      required: [accepted]
      properties:
        accepted:
          type: boolean
          const: true
'''
if text.count(schema_marker) != 1:
    raise SystemExit("OpenAPI auth schema marker not found exactly once")
text = text.replace(schema_marker, recovery_schemas + schema_marker, 1)

text = text.replace(
    '''            message:
              type: string
''',
    '''            message:
              type: string
            field:
              type: string
              description: Опциональное стабильное имя поля формы, связанное с ошибкой.
              enum: [email, password, displayName, passwordConfirmation, token]
''',
    1,
)
openapi.write_text(text, encoding="utf-8")
