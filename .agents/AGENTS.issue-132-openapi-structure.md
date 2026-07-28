# Structurally valid OpenAPI YAML

## Scope

This rule applies to every change of `api/openapi.yaml`, including focused additions that do not touch the malformed section directly.

## Confirmed failure

On 2026-07-28, Issue #132 validation found two `LessonSource` `$ref` mappings at YAML column zero. The contract therefore failed real YAML parsing even though existing source-fragment tests were green.

## Root cause

The schema references lost their property-level indentation. Existing OpenAPI tests searched for expected text fragments but did not reject structurally impossible root-level `$ref` keys.

## Why it escaped

Neither the focused contract tests nor the normal validation ladder parsed or structurally scanned the complete OpenAPI document. The malformed references were outside the feature section under test.

## Mandatory prevention

1. Treat the complete OpenAPI document as one downstream consumer whenever it is edited.
2. Reject root-level `$ref` mappings; schema references must remain nested under their owners.
3. Run a real YAML parse when the available project toolchain provides a parser.
4. Do not accept fragment-presence tests as sole evidence of a valid OpenAPI document.

## Regression gate

- `backend/internal/moderation/openapi_contract_test.go` rejects every column-zero `$ref`.
- Issue #132 validation parses `api/openapi.yaml` with the repository-installed `js-yaml` parser.

## Reusable lesson

Text-fragment contract tests prove content presence, not YAML structure. Validate the whole contract after every OpenAPI write.
