# GitHub Actions runner policy

## Active profile: public repository

LexiGo uses standard GitHub-hosted Linux runners for build, test, browser and container jobs while the repository is public. Standard GitHub-hosted runner minutes are free for public repositories.

Runner selection uses the repository variable `CI_RUNNER` with `ubuntu-latest` as the fallback. Browser suites and API/web image builds run as normal parallel matrix jobs without the former shared-host `max-parallel: 1` throttle.

GitHub-hosted jobs use isolated ephemeral virtual machines. The final `ci-resource-cleanup` job was removed because it cannot clean Docker resources created on other hosted VMs and is unnecessary after VM disposal. Per-job cleanup remains for deterministic diagnostics.

`Actions storage cleanup` also uses GitHub-hosted runners. Artifact uploads remain failure-oriented, non-blocking and retained for no more than three days. Public runner minutes are free, but artifact and package storage still require the bounded-storage policy.

## Dormant self-hosted profile

`Self-hosted runner smoke` and manual `Runner resource cleanup` remain available. The daily Selectel cleanup schedule is disabled while CI does not use the physical host.

To return after the repository becomes private:

1. Start and verify Selectel runner services with the `lexigo-ci` label.
2. Run `Self-hosted runner smoke` and require all slots to pass.
3. Set the repository Actions variable `CI_RUNNER` to `lexigo-ci`.
4. Re-enable the schedule in `runner-resource-cleanup.yml` through a reviewed PR.
5. Confirm a full CI run, both container builds and cleanup behavior.

Do not point a public repository at persistent self-hosted infrastructure.
