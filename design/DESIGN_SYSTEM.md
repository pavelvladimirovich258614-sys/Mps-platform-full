# MPS Design System

This document is the layout and theme contract for the MPS frontend. The executable source of theme values remains `frontend/app/src/styles.css`.

## Shell layout

| Zone | Contract |
| --- | --- |
| Left sidebar | The `side-nav` container is flat on `var(--bg)`: transparent background, no enclosing border, and no shadow. Inactive navigation items are transparent. The active item uses `var(--gold-soft)`; hover uses `var(--hover)`. |
| Center | Primary page content is wrapped once in `PageCard`. On desktop: `background: var(--card)`, `border: 1px solid var(--card-line)`, `border-radius: 16px`, `padding: 40px 40px 44px`, `box-shadow: var(--card-shadow)`. Responsive layouts may reduce padding, but must preserve the card boundary and theme tokens. Modals, popovers, toasts, and other overlays stay outside `PageCard`. |
| Right column | The `right-rail` container is flat and transparent. Each independent section, including `SubscriptionsPanel` and presence, is its own card with `background: var(--shell)`, `border: 1px solid var(--card-line)`, `border-radius: 8px`, and `box-shadow: var(--card-shadow)`. Do not merge the sections into one enclosing card. |

The Feed page is the structural reference. A new section must reuse the shared center wrapper rather than reproduce these styles in a page component.

Inside `PageCard`, secondary content surfaces use `var(--card-soft)`: empty states and inset informational or CTA blocks such as `video-request`, `article-cta`, `tour-cta`, `subscribe-cta`, and `about-contacts`. In the light theme this is the warm cream `#f6f3ec`, distinct from the white `--card`. Interactive controls and overlays may continue to use `--panel`; they must not be used as the background of these inset content blocks.

## Theme tokens

| Token | Light | Dark |
| --- | --- | --- |
| `--bg` | `#efece4` | `#0a0e18` |
| `--shell` | `#ffffff` | `#0e1425` |
| `--shell-2` | `#ffffff` | `#141b2e` |
| `--line` | `rgba(20,25,40,0.10)` | `rgba(255,255,255,0.08)` |
| `--text` | `#1c2130` | `#f4efe2` |
| `--muted` | `#6b7180` | `#98a1b5` |
| `--hover` | `rgba(20,25,40,0.05)` | `rgba(255,255,255,0.05)` |
| `--card` | `#ffffff` | `#161e33` |
| `--card-text` | `#1c2130` | `#f4efe2` |
| `--card-muted` | `#6b7180` | `#a6afc3` |
| `--card-line` | `rgba(20,25,40,0.10)` | `rgba(217,172,87,0.18)` |
| `--card-soft` | `#f6f3ec` | `#1c2540` |
| `--field` | `rgba(20,25,40,0.04)` | `rgba(255,255,255,0.04)` |
| `--gold` | `#c08e37` | `#cf9c47` |
| `--gold-lt` | `#e0b463` | `#e6bc6f` |
| `--gold-soft` | `rgba(192,142,55,0.12)` | `rgba(217,172,87,0.12)` |
| `--gold-ink` | `#a9803a` | `#a9803a` |
| `--action-ink` | `#1c1408` | `#1c1408` |
| `--avatar-start` | `#2a3550` | `#2a3550` |
| `--avatar-end` | `#161c2c` | `#161c2c` |
| `--avatar-ink` | `var(--gold-lt)` | `var(--gold-lt)` |
| `--ok` | `#2f6b4f` | `#7fa98a` |
| `--qa-answer-bg` | `#8f1d2c` | `#8f1d2c` |
| `--qa-answer-text` | `#fff7f7` | `#fff7f7` |
| `--card-shadow` | `0 10px 30px rgba(28,33,48,.08)` | `0 12px 32px rgba(0,0,0,.24)` |

## Semantic aliases

Aliases resolve through the active theme and must remain variable references rather than copied color values.

| Alias | Definition |
| --- | --- |
| `--surface` | `var(--card)` |
| `--body` | `var(--card-text)` |
| `--soft` | `var(--card-text)` |
| `--border` | `var(--card-line)` |
| `--chip` | `var(--card-soft)` |
| `--header` | `var(--shell)` |
| `--onhead` | `var(--text)` |
| `--accent` | `var(--gold)` |
| `--accent-hi` | `var(--text)` |
| `--accent-2` | `var(--text)` |
| `--panel` | `var(--shell-2)` |
| `--onpanel` | `var(--text)` |
| `--onpanel-dim` | `var(--card-text)` |

## Typography and contrast

- Body and controls use Inter, weights 400-800.
- Display headings and the logo use Playfair Display, weights 600, 700, and 900.
- Body copy, form text, and reviews use `--text` or `--card-text`.
- `--muted` and `--gold-ink` are reserved for decorative or large text: at least 19px bold or 24px regular.

## Change checklist

- Keep the sidebar, center card, and right-section cards as three distinct visual layers.
- Verify both themes at 375, 768, 1024, and 1440px without horizontal overflow or content reflow.
- Preserve visible focus states and `prefers-reduced-motion` behavior.
- Add a failing structural or style-contract test before changing the implementation.
