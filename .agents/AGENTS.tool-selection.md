# GitHub tool-selection safety

## Scope

This rule applies to every connector or API operation that can read or write repository state.

## Confirmed failure

On 2026-07-29, while preparing an Agent Docs reconciliation, the intended branch-creation operation was accidentally sent as a `create_file` call against a deliberately nonexistent branch. GitHub rejected the request with HTTP 404, so no repository artifact or ref changed.

## Root cause

The operation intent was not re-checked against the selected function name immediately before the tool call after tool discovery changed the available action set.

## Mandatory prevention

1. Before every repository tool call, compare the intended operation noun and verb with the selected function name.
2. For any write, verify the exact schema immediately before invocation; do not rely on a previously loaded tool list.
3. Branch creation must use `create_branch`; file creation must use `create_file`; file replacement must use `update_file` with the current blob SHA.
4. Every file write must name an already verified non-default branch explicitly.
5. After a rejected or misrouted write attempt, stop all writes, verify `main`, verify the target path is absent or unchanged, reload the exact action schema and update the pre-flight record before continuing.
6. A rejected request with no changed ref or artifact is still a process failure and must be recorded; do not silently retry.

## Regression gate

- The failed target path is read from `main` and confirmed absent or unchanged.
- The intended branch is created from the verified exact `main` SHA using `create_branch`.
- Every subsequent changed path is read back from the branch and its blob SHA is verified.
- The final PR diff contains only the explicitly allowed documentation paths.

## Reusable lesson

Tool availability is not operation selection. Re-validate the exact function name and schema at the write boundary, especially after discovery calls modify the active tool set.
