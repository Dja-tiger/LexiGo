#!/usr/bin/env python3
"""Regression tests for LexiGo CI routing and architecture documentation contracts."""

from __future__ import annotations

import importlib.util
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCOPE_SCRIPT = ROOT / "scripts" / "ci" / "agent_docs_scope.py"
CI_WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"
DEPLOY_WORKFLOW = ROOT / ".github" / "workflows" / "deploy-stage.yml"
README = ROOT / "README.md"
ARCHITECTURE = ROOT / "docs" / "architecture.md"
BOOTSTRAP = ROOT / "frontend" / "components" / "lexigo-bootstrapped-app.tsx"

CANONICAL_ROUTE_ENTRIES = (
    ("LexigoHomeApp", "./lexigo-home-app"),
    ("LexigoLearnApp", "./lexigo-learn-app"),
    ("LexigoActiveLessonApp", "./lexigo-active-lesson-app"),
    ("LexigoDictionaryApp", "./lexigo-dictionary-app"),
    ("LexigoPhrasesApp", "./lexigo-phrases-app"),
    ("LexigoProgressApp", "./lexigo-progress-app"),
    ("LexigoProfileApp", "./lexigo-profile-app"),
    ("LexigoScenarioCatalogApp", "./lexigo-scenario-catalog-app"),
    ("LexigoScenarioApp", "./lexigo-scenario-app"),
)

STALE_ARCHITECTURE_CLAIMS = (
    "compatibility graph для ещё не извлечённых Phrases и Active Lesson",
    "только Phrases пока остаётся в compatibility graph",
    "текущая React state-модель ещё не извлечённых экранов",
)


def _load_scope_module():
    spec = importlib.util.spec_from_file_location("agent_docs_scope", SCOPE_SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {SCOPE_SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


scope = _load_scope_module()


def _run(*args: str, cwd: Path) -> str:
    process = subprocess.run(
        args,
        cwd=cwd,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return process.stdout.strip()


def _job_block(workflow: str, job_name: str) -> str:
    pattern = re.compile(r"^  ([A-Za-z0-9_-]+):\s*$", re.MULTILINE)
    matches = list(pattern.finditer(workflow))
    for index, match in enumerate(matches):
        if match.group(1) != job_name:
            continue
        end = matches[index + 1].start() if index + 1 < len(matches) else len(workflow)
        return workflow[match.start():end]
    raise AssertionError(f"job {job_name!r} is missing")


class PathClassificationTest(unittest.TestCase):
    def test_exact_agent_docs_scope(self) -> None:
        pure_paths = (
            "AGENTS.md",
            ".agents/PROJECT_STATE.md",
            ".agents/current/TASK.md",
            "docs/agent-harness.md",
        )
        result, normalized = scope.classify_paths(pure_paths)
        self.assertTrue(result)
        self.assertEqual(normalized, pure_paths)

    def test_mixed_and_unrelated_scopes_fail_closed(self) -> None:
        cases = (
            (),
            ("README.md",),
            ("docs/architecture.md",),
            (".github/workflows/ci.yml",),
            ("scripts/ci/agent_docs_scope.py",),
            (".agents/PROJECT_STATE.md", "backend/internal/learning/repository.go"),
            (".agents/PROJECT_STATE.md", "frontend/app/layout.tsx"),
            ("../.agents/PROJECT_STATE.md",),
            (".agents\\PROJECT_STATE.md",),
        )
        for paths in cases:
            with self.subTest(paths=paths):
                result, _ = scope.classify_paths(paths)
                self.assertFalse(result)

    def test_git_ranges_use_the_complete_base_to_head_diff(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            _run("git", "init", "--quiet", cwd=repo)
            _run("git", "config", "user.name", "LexiGo CI", cwd=repo)
            _run("git", "config", "user.email", "ci@example.invalid", cwd=repo)

            (repo / "AGENTS.md").write_text("entry\n", encoding="utf-8")
            _run("git", "add", "AGENTS.md", cwd=repo)
            _run("git", "commit", "--quiet", "-m", "base", cwd=repo)
            base = _run("git", "rev-parse", "HEAD", cwd=repo)

            (repo / ".agents").mkdir()
            (repo / ".agents" / "PROJECT_STATE.md").write_text("state\n", encoding="utf-8")
            _run("git", "add", ".agents/PROJECT_STATE.md", cwd=repo)
            _run("git", "commit", "--quiet", "-m", "agent docs", cwd=repo)
            docs_head = _run("git", "rev-parse", "HEAD", cwd=repo)

            docs_result = scope.classify_change_range(repo, base, docs_head)
            self.assertTrue(docs_result.agent_docs_only)
            self.assertEqual(docs_result.reason, "agent_docs_only")

            (repo / "backend").mkdir()
            (repo / "backend" / "main.go").write_text("package main\n", encoding="utf-8")
            _run("git", "add", "backend/main.go", cwd=repo)
            _run("git", "commit", "--quiet", "-m", "mixed", cwd=repo)
            mixed_head = _run("git", "rev-parse", "HEAD", cwd=repo)

            mixed_result = scope.classify_change_range(repo, base, mixed_head)
            self.assertFalse(mixed_result.agent_docs_only)
            self.assertEqual(mixed_result.reason, "non_agent_docs_change")
            self.assertIn("backend/main.go", mixed_result.changed_paths)

            missing_base = scope.classify_change_range(repo, "0" * 40, mixed_head)
            self.assertFalse(missing_base.agent_docs_only)
            self.assertEqual(missing_base.reason, "base_commit_unavailable")

    def test_scope_artifact_revalidates_paths_and_exact_head(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            artifact = Path(directory) / "scope.json"
            payload = {
                "schema_version": 1,
                "agent_docs_only": True,
                "reason": "agent_docs_only",
                "base_sha": "a" * 40,
                "head_sha": "b" * 40,
                "changed_paths": [".agents/PROJECT_STATE.md"],
            }
            artifact.write_text(json.dumps(payload), encoding="utf-8")
            result = scope.validate_artifact(artifact, "b" * 40)
            self.assertTrue(result.agent_docs_only)

            payload["changed_paths"].append("frontend/app/layout.tsx")
            artifact.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "classification"):
                scope.validate_artifact(artifact, "b" * 40)

            payload["changed_paths"] = [".agents/PROJECT_STATE.md"]
            artifact.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "head_sha"):
                scope.validate_artifact(artifact, "c" * 40)


class ArchitectureDocumentationContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.bootstrap = BOOTSTRAP.read_text(encoding="utf-8")
        cls.readme = README.read_text(encoding="utf-8")
        cls.architecture = ARCHITECTURE.read_text(encoding="utf-8")

    def test_public_docs_match_the_canonical_bootstrap_inventory(self) -> None:
        for component, module in CANONICAL_ROUTE_ENTRIES:
            with self.subTest(component=component):
                self.assertIn(f'import("{module}")', self.bootstrap)
                self.assertIn(f"`{component}`", self.readme)
                self.assertIn(f"`{component}`", self.architecture)

    def test_compatibility_fallback_does_not_reclaim_extracted_routes(self) -> None:
        public_architecture = f"{self.readme}\n{self.architecture}"

        self.assertIn('import("./lexigo-premium-app")', self.bootstrap)
        self.assertIn("`LexigoPremiumApp`", self.readme)
        self.assertIn("`LexigoPremiumApp`", self.architecture)
        self.assertIn("Issue #70", self.readme)
        self.assertIn("Issue #70", self.architecture)

        for stale_claim in STALE_ARCHITECTURE_CLAIMS:
            with self.subTest(stale_claim=stale_claim):
                self.assertNotIn(stale_claim, public_architecture)


class WorkflowContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.ci = CI_WORKFLOW.read_text(encoding="utf-8")
        cls.deploy = DEPLOY_WORKFLOW.read_text(encoding="utf-8")

    def test_ci_always_registers_and_publishes_exact_scope_evidence(self) -> None:
        self.assertIn("on:\n  pull_request:\n  push:\n    branches: [main]", self.ci)
        scope_job = _job_block(self.ci, "change-scope")
        self.assertIn("fetch-depth: 0", scope_job)
        self.assertIn("github.event.pull_request.base.sha", scope_job)
        self.assertIn("github.event.before", scope_job)
        self.assertIn("python3 scripts/ci/agent_docs_scope.py classify", scope_job)
        self.assertIn("python3 scripts/ci/agent_docs_scope_test.py", scope_job)
        self.assertIn("name: ci-scope-${{ github.sha }}", scope_job)
        self.assertIn("continue-on-error: true", scope_job)
        self.assertIn("retention-days: 1", scope_job)

    def test_only_heavy_jobs_are_skipped_for_agent_docs(self) -> None:
        expected_needs = {
            "backend-unit": "needs: [change-scope]",
            "backend-integration": "needs: [change-scope]",
            "frontend-core": "needs: [change-scope]",
            "frontend-browser": "needs: [change-scope, frontend-core]",
            "frontend": "needs: [change-scope, frontend-core, frontend-browser]",
            "container-build": "needs: [change-scope, backend-unit, backend-integration, frontend]",
        }
        for job_name, needs in expected_needs.items():
            with self.subTest(job=job_name):
                block = _job_block(self.ci, job_name)
                self.assertIn(needs, block)
                self.assertIn("needs.change-scope.outputs.agent_docs_only != 'true'", block)

        agent_docs = _job_block(self.ci, "agent-docs")
        self.assertIn("needs: [change-scope]", agent_docs)
        self.assertIn("needs.change-scope.outputs.agent_docs_only == 'true'", agent_docs)
        self.assertIn("bash scripts/ci/check-agent-harness.sh", agent_docs)

    def test_product_commands_and_matrix_remain_present(self) -> None:
        required_contracts = (
            "go test -race -count=1 -coverprofile=coverage.out ./...",
            "go test -race -count=1 -tags=integration ./...",
            "npm run lint",
            "npm run typecheck",
            "npm run test",
            "npm run build",
            "npm audit --omit=dev --audit-level=high",
            'name: "UI tests (shard 1/2)"',
            'name: "UI tests (shard 2/2)"',
            'name: "Lesson completion"',
            'name: "Content security"',
            'name: "iOS PWA dictionary"',
            'name: "Accessibility audit"',
            'name: "Controlled service worker"',
            'name: "Visual regression"',
            'name: "Performance budgets"',
            'name: "Dictionary smoke"',
            "component: [api, web]",
            "push: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}",
        )
        for contract in required_contracts:
            with self.subTest(contract=contract):
                self.assertIn(contract, self.ci)

    def test_stage_deploy_consumes_exact_ci_scope_and_keeps_manual_dispatch(self) -> None:
        workflow_header = self.deploy.split("\njobs:\n", maxsplit=1)[0]
        self.assertNotIn("\nconcurrency:\n", workflow_header)
        self.assertIn("actions: read", self.deploy)

        scope_job = _job_block(self.deploy, "scope")
        self.assertNotIn("concurrency:", scope_job)
        self.assertIn("actions/download-artifact@v7", scope_job)
        self.assertIn("name: ci-scope-${{ github.event.workflow_run.head_sha }}", scope_job)
        self.assertIn("run-id: ${{ github.event.workflow_run.id }}", scope_job)
        self.assertIn("github-token: ${{ secrets.GITHUB_TOKEN }}", scope_job)
        self.assertIn("python3 scripts/ci/agent_docs_scope.py validate-artifact", scope_job)
        self.assertIn("--expected-head-sha", scope_job)

        deploy_job = _job_block(self.deploy, "deploy")
        self.assertIn("needs: [scope]", deploy_job)
        self.assertIn("always()", deploy_job)
        self.assertIn("github.event_name == 'workflow_dispatch'", deploy_job)
        self.assertIn("needs.scope.outputs.agent_docs_only != 'true'", deploy_job)
        self.assertIn(
            "    concurrency:\n"
            "      group: deploy-stage\n"
            "      cancel-in-progress: true",
            deploy_job,
        )
        self.assertLess(deploy_job.index("    if: >-"), deploy_job.index("    concurrency:"))
        self.assertIn('run: bash scripts/ci/deploy-over-ssh.sh stage "$IMAGE_TAG"', deploy_job)


if __name__ == "__main__":
    unittest.main(verbosity=2)
