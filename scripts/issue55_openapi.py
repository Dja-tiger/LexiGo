from pathlib import Path

path = Path("api/openapi.yaml")
text = path.read_text()

query_parameter = '        - { name: query, in: query, schema: { type: string, maxLength: 120 } }\n'
status_parameter = '        - { name: status, in: query, schema: { type: string, enum: [new, learning, review, mastered] } }\n'
if text.count(query_parameter) < 2:
    raise SystemExit("Expected catalog query parameters were not found")
text = text.replace(query_parameter, query_parameter + status_parameter, 2)

review_path = "  /api/v1/words/{wordID}/review:\n"
detail_path = '''  /api/v1/words/{wordID}:
    get:
      operationId: getWord
      tags: [learning]
      summary: Full catalog card assigned to the current user.
      security:
        - bearerAuth: []
      parameters:
        - name: wordID
          in: path
          required: true
          schema:
            type: integer
            format: int64
            minimum: 1
      responses:
        "200":
          description: Full word or term card with the current learning status.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserWord"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          description: Catalog item is not assigned to the current user.
  /api/v1/words/{wordID}/review:
'''
if review_path not in text:
    raise SystemExit("Review endpoint marker was not found")
text = text.replace(review_path, detail_path, 1)

user_word_fields = '''        topic:
          type: string
        examples:
'''
user_word_aliases = '''        topic:
          type: string
        aliases:
          type: array
          items:
            type: string
        examples:
'''
if user_word_fields not in text:
    raise SystemExit("UserWord topic marker was not found")
text = text.replace(user_word_fields, user_word_aliases, 1)

lesson_fields = '''        topic: { type: string }
        examples:
'''
lesson_aliases = '''        topic: { type: string }
        aliases:
          type: array
          items: { type: string }
        examples:
'''
if lesson_fields not in text:
    raise SystemExit("LessonItem topic marker was not found")
text = text.replace(lesson_fields, lesson_aliases, 1)

path.write_text(text)
