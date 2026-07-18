# Adaptive navigation release checklist

Issue #50 introduces three navigation layouts and a focused lesson mode. Automated tests verify DOM, computed layout, keyboard-visible labels, scroll restoration and representative Chromium/WebKit viewports. They do not replace physical device validation.

## Automated contract

- Expanded width (`>= 1100px`): full labelled header navigation.
- Medium width (`720–1099px`): labelled navigation rail and no compact tab bar.
- Compact width (`<= 719px`): five-item bottom tab bar with safe-area insets.
- Every primary navigation target is at least 48 CSS px in both dimensions where space permits.
- Re-entering a top-level tab restores its previous nested target and scroll position.
- Active lessons remove top-level navigation and reject browser Back until the explicit `Сохранить и выйти` action is used.
- The PWA manifest does not force portrait orientation.
- No tested viewport creates horizontal document overflow.

## Physical device matrix

Record device model, OS version, browser/PWA mode, orientation and result.

| Platform | Required scenarios |
| --- | --- |
| iPhone Safari | Portrait compact tab bar; rotate to landscape rail; safe-area around notch/home indicator; 200% text zoom where available. |
| Installed iPhone PWA | Cold start in portrait and landscape; rotate during each top-level screen and during an active lesson; Home Screen relaunch preserves usable layout. |
| iPad Safari | Portrait and landscape rail; Split View at narrow and wide widths; keyboard navigation with hardware keyboard. |
| Installed iPad PWA | Portrait/landscape launch; Stage Manager/resizable window; lesson focus mode. |
| Android phone Chrome | Portrait bottom navigation; landscape rail; system font enlargement; gesture navigation inset. |
| Android tablet/foldable Chrome | Medium rail, expanded header when wide enough, resize/fold transition, no clipped content. |
| macOS Safari / Chrome | Expanded header labels, browser zoom 200%, keyboard focus order and scroll restoration. |

## Per-layout checks

### Compact

1. All five labels are readable and not replaced by icon-only controls.
2. The tab bar does not cover the last actionable element or status message.
3. Left, right and bottom safe areas are respected.
4. Each item can be activated with one thumb without overlapping adjacent targets.
5. Opening the on-screen keyboard does not permanently displace the tab bar after dismissal.

### Medium

1. The rail remains visible while scrolling and does not overlap the main landmark.
2. Labels remain visible in iPad portrait, phone landscape and foldable half-open widths.
3. Header tools do not collide with the brand or rail.
4. Resizing across 719/720 and 1099/1100 px does not duplicate accessible navigation landmarks.

### Expanded

1. Header labels remain visible at browser zoom up to 200%.
2. The five destinations fit without truncating the brand or account controls.
3. Focus indicators are visible and `aria-current="page"` tracks the active destination.

## Lesson focus mode

1. Start a server-backed lesson from every layout.
2. Confirm header, rail and bottom top-level navigation are absent.
3. Press browser Back and verify the lesson remains open with a clear instruction.
4. Reload/close and verify the browser presents its native unsaved-work warning where supported.
5. Use `Сохранить и выйти`; confirm navigation returns and the server lesson can be resumed.
6. Complete the lesson; confirm the results screen can navigate normally.

## Release blockers

Do not release when any of the following is reproduced:

- icon-only primary navigation at a supported width;
- content hidden under the compact tab bar;
- top-level navigation available during an active lesson;
- lost nested tab target or materially different scroll position after switching away and back;
- forced portrait launch or unusable landscape layout;
- touch target below 44 pt on iOS or 48 dp-equivalent on Android;
- horizontal page overflow caused by the navigation shell.
