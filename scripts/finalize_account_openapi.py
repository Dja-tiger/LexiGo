from pathlib import Path

SPECIFICATION = Path("api/openapi.yaml")

PATHS = '''  /api/v1/auth/sessions:
    get:
      operationId: listAccountSessions
      tags: [account]
      summary: Получить активные refresh-token families пользователя.
      security:
        - bearerAuth: []
          refreshCookie: []
      responses:
        "200":
          description: Активные устройства; ровно одна запись может быть текущей.
          content:
            application/json:
              schema:
                type: object
                required: [sessions]
                properties:
                  sessions:
                    type: array
                    items:
                      $ref: "#/components/schemas/AccountSession"
        "401":
          $ref: "#/components/responses/Unauthorized"
  /api/v1/auth/sessions/revoke-others:
    post:
      operationId: revokeOtherAccountSessions
      tags: [account]
      summary: Завершить все refresh-сессии, кроме текущей family.
      security:
        - bearerAuth: []
          refreshCookie: []
          csrfHeader: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ReauthenticationRequest"
      responses:
        "204":
          description: Остальные сессии отозваны, событие записано в security audit.
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "429":
          $ref: "#/components/responses/TooManyRequests"
  /api/v1/auth/password:
    put:
      operationId: changeAccountPassword
      tags: [account]
      summary: Изменить пароль и завершить остальные refresh-сессии.
      security:
        - bearerAuth: []
          refreshCookie: []
          csrfHeader: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ChangePasswordRequest"
      responses:
        "204":
          description: Пароль изменён, password-reset tokens аннулированы; после commit выполняется попытка критичного уведомления.
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "422":
          $ref: "#/components/responses/ValidationError"
        "429":
          $ref: "#/components/responses/TooManyRequests"
  /api/v1/auth/audit-events:
    get:
      operationId: listAccountAuditEvents
      tags: [account]
      summary: Последние security audit events текущего пользователя.
      security:
        - bearerAuth: []
      responses:
        "200":
          description: До 50 последних критичных событий.
          content:
            application/json:
              schema:
                type: object
                required: [events]
                properties:
                  events:
                    type: array
                    items:
                      $ref: "#/components/schemas/AccountAuditEvent"
        "401":
          $ref: "#/components/responses/Unauthorized"
  /api/v1/account/export:
    post:
      operationId: exportAccountData
      tags: [account]
      summary: Скачать versioned JSON с основными персональными и учебными данными.
      security:
        - bearerAuth: []
          csrfHeader: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ReauthenticationRequest"
      responses:
        "200":
          description: Машиночитаемый export без password hashes и token secrets.
          headers:
            Content-Disposition:
              schema: { type: string }
            Cache-Control:
              schema: { type: string, const: no-store }
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AccountExport"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "429":
          $ref: "#/components/responses/TooManyRequests"
  /api/v1/account:
    delete:
      operationId: deleteAccount
      tags: [account]
      summary: Необратимо удалить аккаунт и каскадно зависимые пользовательские данные.
      security:
        - bearerAuth: []
          csrfHeader: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/DeleteAccountRequest"
      responses:
        "204":
          description: Аккаунт удалён; cookies очищены, browser cache/storage получают Clear-Site-Data.
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "409":
          $ref: "#/components/responses/Conflict"
        "422":
          $ref: "#/components/responses/ValidationError"
        "429":
          $ref: "#/components/responses/TooManyRequests"
  /api/v1/account/email-change/request:
    post:
      operationId: requestAccountEmailChange
      tags: [account]
      summary: Отправить одноразовую verification link на новый email.
      description: Raw token передаётся только во fragment URL и не сохраняется в PostgreSQL.
      security:
        - bearerAuth: []
          csrfHeader: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/EmailChangeRequest"
      responses:
        "202":
          description: Одноразовая ссылка отправлена на новый адрес.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AcceptedResponse"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "409":
          $ref: "#/components/responses/Conflict"
        "422":
          $ref: "#/components/responses/ValidationError"
        "429":
          $ref: "#/components/responses/TooManyRequests"
  /api/v1/account/email-change/confirm:
    post:
      operationId: confirmAccountEmailChange
      tags: [account]
      summary: Подтвердить новый email одноразовым bearer token.
      description: Transaction меняет login identifier, использует token, отзывает все refresh-сессии и пишет audit event.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/EmailChangeConfirmRequest"
      responses:
        "204":
          description: Email изменён; session cookies очищены.
        "400":
          $ref: "#/components/responses/BadRequest"
        "409":
          $ref: "#/components/responses/Conflict"
        "429":
          $ref: "#/components/responses/TooManyRequests"
'''

SCHEMAS = '''    ReauthenticationRequest:
      type: object
      additionalProperties: false
      required: [currentPassword]
      properties:
        currentPassword:
          type: string
          maxLength: 72
    ChangePasswordRequest:
      type: object
      additionalProperties: false
      required: [currentPassword, newPassword]
      properties:
        currentPassword:
          type: string
          maxLength: 72
        newPassword:
          type: string
          minLength: 10
          maxLength: 72
    DeleteAccountRequest:
      type: object
      additionalProperties: false
      required: [currentPassword, confirmationEmail]
      properties:
        currentPassword:
          type: string
          maxLength: 72
        confirmationEmail:
          type: string
          format: email
    EmailChangeRequest:
      type: object
      additionalProperties: false
      required: [currentPassword, newEmail]
      properties:
        currentPassword:
          type: string
          maxLength: 72
        newEmail:
          type: string
          format: email
    EmailChangeConfirmRequest:
      type: object
      additionalProperties: false
      required: [token]
      properties:
        token:
          type: string
          minLength: 43
          maxLength: 43
          description: Одноразовый base64url bearer token из URL fragment.
    AccountSession:
      type: object
      required: [id, current, userAgent, createdAt, lastSeenAt, expiresAt]
      properties:
        id: { type: string, format: uuid }
        current: { type: boolean }
        userAgent: { type: string }
        ipAddress: { type: string }
        createdAt: { type: string, format: date-time }
        lastSeenAt: { type: string, format: date-time }
        expiresAt: { type: string, format: date-time }
    AccountAuditEvent:
      type: object
      required: [id, type, userAgent, metadata, createdAt]
      properties:
        id: { type: integer, format: int64 }
        type:
          type: string
          enum: [password_changed, other_sessions_revoked, email_changed]
        userAgent: { type: string }
        ipAddress: { type: string }
        metadata:
          type: object
          additionalProperties: { type: string }
        createdAt: { type: string, format: date-time }
    AccountExport:
      type: object
      required: [schemaVersion, generatedAt, account, words, reviewHistory, securityAudit]
      properties:
        schemaVersion: { type: integer, const: 1 }
        generatedAt: { type: string, format: date-time }
        account: { type: object, additionalProperties: true }
        learningPreferences: { type: [object, "null"], additionalProperties: true }
        words:
          type: array
          items: { type: object, additionalProperties: true }
        reviewHistory:
          type: array
          items: { type: object, additionalProperties: true }
        securityAudit:
          type: array
          items: { type: object, additionalProperties: true }
'''


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one anchor, found {count}")
    return source.replace(old, new, 1)


def main() -> None:
    source = SPECIFICATION.read_text()
    if "  version: 0.9.0" not in source:
        source = replace_once(source, "  version: 0.8.0", "  version: 0.9.0", "version")
    if "  /api/v1/auth/sessions:" not in source:
        source = replace_once(source, "  /api/v1/me:\n", PATHS + "  /api/v1/me:\n", "paths")
    if "    ReauthenticationRequest:" not in source:
        source = replace_once(source, "    AuthResponse:\n", SCHEMAS + "    AuthResponse:\n", "schemas")
    SPECIFICATION.write_text(source)


if __name__ == "__main__":
    main()
