# Current Task Execution

## Task

- Issue: #74
- Branch: `fix/issue-74-header-streak-target`
- Base SHA: `e46881b9fc9def630343e3ee69425492bc0aefe7`
- PR: #395 (Draft)

## Workflow

Used the connected GitHub CI-remediation workflow and repository Agent Harness. All writes target the task branch; `main` is unchanged.

## Evidence inspected

- CI #2795/run `30998706501`;
- CI #2811/run `31001271804`;
- CI #2815/run `31002439266`;
- UI shard artifacts, error contexts, traces and screenshots;
- compiled and source CSS for streak, reminder and profile owners.

## CI #2815 result

Every required job except UI shard 1 passed. UI shard 2 passed, including Android Chromium and iOS WebKit. Visual regression passed without baseline changes. Desktop Chromium alone still reported the left streak perimeter outside the button.

## Exact desktop diagnosis

At 720–1099px the reminder label is hidden and the existing 16px translated target clears the streak. At desktop widths the label remains visible, making the summary wider. The full 16px-translated target still ended about 10px inside the approximately 81.92px streak border box. This is no longer a stale parent pointer-box defect: it is a width-dependent target-overlap defect.

## Correction

- preserve the 16px border-aware translation for 720–1099px;
- add a 28px border-aware translation at `min-width: 1100px`;
- keep the fixed details parent and original summary box out of pointer hit-testing;
- keep `summary::before` and the disclosed preview interactive;
- preserve painted positions and do not update visual baselines;
- extend the source contract to require both responsive target translations;
- retain the focused browser test unchanged so it continues to prove the real shared boundary.

## Next gate

Read back all changed owners, compare the branch against `main`, freeze one immutable head and run full authoritative CI. No Ready transition or merge is allowed until every required job is green.