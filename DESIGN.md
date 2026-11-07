# Clay & Glaze: Design System ("Stone & Ink")

Calm, editorial and premium. The product photos carry the colour. The interface stays in warm neutrals and near-black, with one clay accent used sparingly. Tokens live in `src/app/globals.css` (CSS variables) and `tailwind.config.ts` (names). Components use the names, never raw hex values.

## Colour

| Token | Value | Role |
| --- | --- | --- |
| `canvas` | #F6F4F0 | Page background |
| `surface` | #ECE8E1 | Cards, inputs, section bands |
| `surface-strong` | #E2DCD2 | Hover on surface, image placeholders |
| `line` | #DDD7CC | Borders and dividers |
| `ink` | #1A1917 | Body text, headings, **primary buttons**, footer background |
| `muted` | #64605A | Secondary text (≥ 5:1 on canvas and surface) |
| `accent` | #A24A25 | Clay: links, highlights, sale and "only n left" text, focus details. Never large fills. |
| `accent-soft` | #E7A07F | Accent on ink backgrounds only (8:1 on ink) |
| `ready-soft` | #9BD3AE | Success text on ink backgrounds only |
| `ready` | #3F6B4F | "Ready to ship" tag text |
| `mto` | #8A5A12 | "Made to order" tag text |
| `sold` | #64605A | "Sold" tag text |
| `danger` | #B3261E | Errors |

Tags use the colour at 12% opacity as the background and the full colour as the text. Every text pairing passes 4.5:1. White on `accent` is 5.9:1. There is no dark mode yet.

## Typography

- **Display:** Instrument Serif, 400 regular and italic. Used for headings and the wordmark. Italic is for one emphasised word per headline at most.
- **UI and body:** Geist, at 400, 500 and 600.

| Name | Size / line height | Use |
| --- | --- | --- |
| display | clamp(48px, 8vw, 112px) / 0.95 | Hero headline |
| h1 | clamp(40px, 5vw, 64px) / 1.0 | Page titles |
| h2 | clamp(32px, 3.6vw, 48px) / 1.05 | Section titles |
| h3 | 24px / 1.2 | Card and sub-section titles (serif) |
| lg | 18px / 1.6 | Lead paragraphs |
| base | 16px / 1.6 | Body |
| sm | 14px / 1.5 | Meta, nav |
| eyebrow | 12px / 1.4, 600, uppercase, 0.14em tracking | Section labels |

Keep line length to 65ch or less.

## Spacing and layout

- The scale is 4px-based (Tailwind defaults). Sections use `py-20 md:py-32`. The container is 1360px max with a 20px gutter on mobile and 40px on desktop.
- Layouts are asymmetric. Split sections run 5/7 or 7/5. Avoid stacking centred sections one after another.

## Shape and depth

- **Radius:** `sm` 6px (tags, thumbnails), `md` 12px (inputs, cards), `lg` 20px (large images, sheets), `full` (buttons).
- **Shadows:** `float` only, for the header when scrolled, menus and sheets. Cards have no shadow; they lift with image scale on hover.

## Components

- **Buttons** are pill-shaped and at least 44px tall.
  - `primary`: ink fill with canvas text.
  - `secondary`: ink outline.
  - `quiet`: text with an underline on hover.
  - `accent`: clay fill, used only for the final purchase action.
  - Hover darkens the fill, and an arrow icon nudges 4px. Focus shows a 2px ink ring with a 2px offset. Disabled is 40% opacity.
- **Links:** ink text with an underline that grows from the left on hover. Inline links in body copy use the accent colour.
- **Inputs:** surface fill, line border, 12px radius, 48px tall. Focus switches the border to ink.
- **Header:** transparent over the home hero and canvas with blur once scrolled. It hides on scroll down and shows on scroll up. The **Shop** item opens a mega-menu of category images. Cart shows as text, "Cart (n)".
- **Footer:** ink background with canvas text, an oversized serif wordmark and three link columns.
- **Mobile:** a full-screen menu that animates in, and a floating bottom tab bar (pill, ink at 92% opacity).

## Motion

- **Reveal:** fade in and rise 24px over 700ms with `cubic-bezier(.2,.7,.2,1)`. Items in a group stagger by 80ms.
- **Hero headline:** each line rises out of a mask. The hero image scales from 1.08 to 1.
- **Marquee:** glaze and category names scroll at a constant 40s per loop and pause on hover.
- All motion is disabled under `prefers-reduced-motion`.

## Imagery and icons

- Photography is warm, natural-light product shots on neutral backgrounds. Use 4:5 for products and 16:10 or full-bleed for stories.
- Icons are Lucide at 1.5 stroke and 20px. Never use emoji as icons.
