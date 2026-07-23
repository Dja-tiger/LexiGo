#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS = ROOT / ".github" / "workflows"


def patch_uploads(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(
        r"(?m)^(\s*)uses: actions/upload-artifact@v7\n(?!\1continue-on-error: true\n)",
        r"\1uses: actions/upload-artifact@v7\n\1continue-on-error: true\n",
        text,
    )

    def cap_retention(match: re.Match[str]) -> str:
        return f"{match.group(1)}{min(int(match.group(2)), 3)}"

    text = re.sub(r"(?m)^(\s*retention-days:\s*)(\d+)\s*$", cap_retention, text)
    path.write_text(text, encoding="utf-8")


def patch_ci() -> None:
    path = WORKFLOWS / "ci.yml"
    text = path.read_text(encoding="utf-8")
    old_condition = (
        "        if: always() && matrix.suite == 'ui-runtime' && steps.performance.outcome != 'skipped'\n"
        "        uses: actions/upload-artifact@v7"
    )
    new_condition = (
        "        if: failure() && matrix.suite == 'ui-runtime' && steps.performance.outcome != 'skipped'\n"
        "        uses: actions/upload-artifact@v7"
    )
    if text.count(old_condition) != 1:
        raise SystemExit("Expected exactly one always-on performance artifact upload")
    text = text.replace(old_condition, new_condition)

    gha_cache = (
        "          cache-from: type=gha,scope=${{ matrix.component }}\n"
        "          cache-to: type=gha,mode=max,scope=${{ matrix.component }},ignore-error=true\n"
    )
    if text.count(gha_cache) != 1:
        raise SystemExit("Expected exactly one GitHub Actions BuildKit cache block")
    path.write_text(text.replace(gha_cache, ""), encoding="utf-8")


def patch_cleanup_workflow() -> None:
    path = WORKFLOWS / "actions-storage-cleanup.yml"
    text = path.read_text(encoding="utf-8")
    text = text.replace(
        '      - ".github/workflows/actions-storage-cleanup.yml"',
        '      - ".github/workflows/**"',
    )

    cleanup_test_path = '      - "scripts/ci/actions_storage_cleanup_test.py"\n'
    policy_path = '      - "scripts/ci/actions_storage_policy_test.py"\n'
    if text.count(cleanup_test_path) != 2:
        raise SystemExit("Unexpected cleanup workflow path filters")
    text = text.replace(cleanup_test_path, cleanup_test_path + policy_path)

    old_concurrency = (
        "concurrency:\n"
        "  group: lexigo-actions-storage-cleanup\n"
        "  cancel-in-progress: false\n"
    )
    new_concurrency = (
        "concurrency:\n"
        "  group: lexigo-actions-storage-cleanup-${{ github.event_name }}-${{ github.run_id }}\n"
        "  cancel-in-progress: false\n"
    )
    if text.count(old_concurrency) != 1:
        raise SystemExit("Expected original cleanup concurrency block")
    text = text.replace(old_concurrency, new_concurrency)

    planner = (
        "      - name: Test cleanup planner\n"
        "        run: python3 scripts/ci/actions_storage_cleanup_test.py\n"
    )
    policy = (
        planner
        + "\n"
        + "      - name: Validate Actions storage policy\n"
        + "        run: python3 scripts/ci/actions_storage_policy_test.py\n"
    )
    if text.count(planner) != 2:
        raise SystemExit("Expected two cleanup planner steps")
    text = text.replace(planner, policy)

    defaults = (
        "          mode=apply\n"
        "          artifact_retention_days=3\n"
        "          delete_all_caches=true\n"
    )
    emergency = (
        defaults
        + "\n"
        + "          if [ \"$GITHUB_EVENT_NAME\" = \"push\" ] && git log -1 --pretty=%B | grep -Fq '[actions-storage-emergency]'; then\n"
        + "            artifact_retention_days=0\n"
        + "          fi\n"
    )
    if text.count(defaults) != 1:
        raise SystemExit("Expected cleanup policy defaults")
    path.write_text(text.replace(defaults, emergency), encoding="utf-8")


def write_policy_test() -> None:
    path = ROOT / "scripts" / "ci" / "actions_storage_policy_test.py"
    path.write_text(
        '''#!/usr/bin/env python3
"""Regression checks for bounded GitHub Actions storage usage."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW_DIR = ROOT / ".github" / "workflows"


def step_block(lines: list[str], uses_index: int) -> list[str]:
    uses_indent = len(lines[uses_index]) - len(lines[uses_index].lstrip())
    step_indent = max(uses_indent - 2, 0)
    end = uses_index + 1
    while end < len(lines):
        stripped = lines[end].lstrip()
        indent = len(lines[end]) - len(stripped)
        if indent == step_indent and stripped.startswith("- "):
            break
        end += 1
    return lines[uses_index:end]


def main() -> None:
    paths = sorted(WORKFLOW_DIR.glob("*.yml"))
    violations: list[str] = []
    upload_count = 0

    for path in paths:
        text = path.read_text(encoding="utf-8")
        lines = text.splitlines()
        if "type=gha" in text:
            violations.append(f"{path}: GitHub Actions cache import/export is prohibited")

        for index, line in enumerate(lines):
            if line.strip() != "uses: actions/upload-artifact@v7":
                continue
            upload_count += 1
            block = step_block(lines, index)
            if not any(item.strip() == "continue-on-error: true" for item in block):
                violations.append(f"{path}:{index + 1}: artifact upload must be non-blocking")
            retention = [item for item in block if item.strip().startswith("retention-days:")]
            if len(retention) != 1:
                violations.append(f"{path}:{index + 1}: define exactly one retention-days value")
                continue
            days = int(retention[0].split(":", 1)[1].strip())
            if days > 3:
                violations.append(f"{path}:{index + 1}: retention-days {days} exceeds 3")

    ci = (WORKFLOW_DIR / "ci.yml").read_text(encoding="utf-8")
    condition = "if: failure() && matrix.suite == 'ui-runtime' && steps.performance.outcome != 'skipped'"
    if condition not in ci:
        violations.append("ci.yml: successful performance runs must not upload an artifact")

    cleanup = (WORKFLOW_DIR / "actions-storage-cleanup.yml").read_text(encoding="utf-8")
    if "lexigo-actions-storage-cleanup-${{ github.event_name }}-${{ github.run_id }}" not in cleanup:
        violations.append("cleanup workflow needs a unique concurrency group")
    if "[actions-storage-emergency]" not in cleanup:
        violations.append("cleanup workflow emergency marker is missing")

    if upload_count < 1:
        violations.append("No upload-artifact steps found")
    if violations:
        raise SystemExit("\n".join(violations))
    print(f"Validated {upload_count} bounded artifact upload steps across {len(paths)} workflows")


if __name__ == "__main__":
    main()
''',
        encoding="utf-8",
    )


def patch_docs() -> None:
    path = ROOT / "docs" / "github-actions-storage.md"
    text = path.read_text(encoding="utf-8")
    old_intro = (
        "LexiGo uses self-hosted runners, but GitHub-hosted Actions storage is still consumed by repository artifacts and caches. "
        "The largest storage source is the BuildKit cache exported through `type=gha`; browser and diagnostic artifacts are comparatively small but accumulate across frequent CI runs."
    )
    new_intro = (
        "LexiGo uses self-hosted runners, but GitHub-hosted Actions storage is still consumed by repository artifacts and caches. "
        "GitHub Actions BuildKit cache export is disabled; diagnostic artifacts are non-blocking, failure-oriented and retained for at most three days."
    )
    if old_intro not in text:
        raise SystemExit("Unexpected storage documentation introduction")
    text = text.replace(old_intro, new_intro)

    marker = "The API deletion itself is immediate.\n"
    if marker not in text:
        raise SystemExit("Missing billing update marker")
    text = text.replace(
        marker,
        marker + "\nA merge commit containing `[actions-storage-emergency]` applies zero-day artifact retention once; ordinary automatic runs keep the three-day policy.\n",
    )

    old_follow_up = (
        "## Follow-up optimization\n\n"
        "The cleanup workflow prevents persistent accumulation. A separate CI optimization should remove or replace the `type=gha` BuildKit export so the cache is not uploaded before being reclaimed. That change should be measured independently because it can affect container build duration."
    )
    new_follow_up = (
        "## CI upload policy\n\n"
        "`scripts/ci/actions_storage_policy_test.py` scans every workflow. It blocks GitHub Actions cache export, artifact retention above three days, blocking artifact uploads and successful-run performance uploads. Test failures remain blocking; failure diagnostics are best-effort so a full storage quota cannot mask the actual test result."
    )
    if old_follow_up not in text:
        raise SystemExit("Unexpected storage documentation follow-up")
    path.write_text(text.replace(old_follow_up, new_follow_up), encoding="utf-8")


def main() -> None:
    patch_ci()
    patch_cleanup_workflow()
    write_policy_test()
    patch_docs()
    for workflow in sorted(WORKFLOWS.glob("*.yml")):
        patch_uploads(workflow)

    (WORKFLOWS / "patch-actions-storage-policy.yml").unlink()
    (ROOT / "scripts" / "ci" / "patch_actions_storage_policy.py").unlink()


if __name__ == "__main__":
    main()
