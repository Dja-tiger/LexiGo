# Current Task Progress

## 2026-08-05 15:30 Europe/Moscow

### Completed evidence

- Draft PR #395 exact head: `ab86d442bba2420a5445b2c92427f924ddee780f`;
- branch base and live `main`: `e46881b9fc9def630343e3ee69425492bc0aefe7`;
- branch is not behind `main` and changes only nine allowed paths;
- authoritative CI #2820/run `31003511778` passed completely;
- frontend core passed: lint, TypeScript, 98 Vitest files, production build and dependency audit;
- backend unit/security/integration passed;
- both UI shards passed, including desktop Chromium, Android Chromium and iOS WebKit focused target proof;
- visual regression passed without baseline changes;
- accessibility, performance, content security, service worker, PWA, dictionary smoke and lesson completion passed;
- web and api container builds passed;
- PR comments, reviews and unresolved review threads are empty.

### Delivered behavior

- live `button.lx-streak` uses a real 44px fine / 48px coarse minimum border box;
- decorative Dictionary streak remains excluded;
- fixed reminder parent and original summary box do not intercept the streak boundary;
- reminder generated target remains full-size, native-disclosure capable and shifts 16px on 720–1099px and 28px from 1100px;
- disclosed preview remains interactive;
- reminder, streak and profile targets are separated;
- painted output, phone hiding, focus and `/progress` navigation remain unchanged.

### Next action

Mark PR #395 Ready and perform expected-head squash merge. Then validate the exact merge SHA through main CI, stage deployment and public browser checks. Issue #74 remains open for later slices.