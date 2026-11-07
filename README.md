# Clay & Glaze

Storefront for handmade ceramics and craft kits. Built with Next.js 15 (App Router, TypeScript), Tailwind and shadcn/ui, MongoDB Atlas with Mongoose, Auth.js (email OTP and Google), Razorpay, Cloudinary and Resend. It installs as a PWA.

## Getting started

```bash
cp .env.example .env        # fill in the values
npx auth secret             # writes AUTH_SECRET
npm install
npm run seed -- --owner you@example.com
npm run dev
```

**Local development without Atlas or Docker:** run `npm run db` in one terminal. It starts a local replica set on port 27017, with data kept in `.data/mongo`. Then run `npm run seed` and `npm run dev` in another terminal. Set `DEMO_LOGIN=true` to turn on the demo accounts below. They never work in production.

| Role | Email | Password |
| --- | --- | --- |
| Customer | `customer@demo.local` | `demo1234` (`DEMO_PASSWORD`) |
| Owner / admin | `owner@demo.local` | `demo1234` |

The visual design ("Stone & Ink": colours, type, motion) is documented in [DESIGN.md](DESIGN.md). The demo product images in `public/demo/` are generated SVG placeholders (`node scripts/make-demo-images.mjs`). Replace them with real photography. Search for `<Placeholder>` and `<Fill>` to find copy that still needs writing.

Without `RESEND_API_KEY`, OTP codes and emails are printed to the dev server console. Checkout needs real Razorpay test keys.

MongoDB must be a **replica set**, because checkout uses transactions. Every Atlas cluster, including the free tier, is one. For a local database, run `mongod --replSet rs0` and then `rs.initiate()`.

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run seed` | Upsert sample categories, glazes, sizes and products |

## Folder structure

```
src/
  app/                     Routes only: pages, layouts, route handlers
    (shop)/                Storefront: header, bottom tab bar, footer
    (auth)/login/          OTP request and code entry
    admin/                 Owner dashboard (requireOwner in layout)
    api/auth/              Auth.js handlers
    api/payments/          verify (browser callback) and webhook
    api/cron/              expire-orders (releases stock held by unpaid checkouts)
    manifest.ts, pwa-icon/, offline/
  actions/                 Server actions: validate -> call service -> revalidate
  services/                Business logic and all DB access
    catalog / cart / order / inventory / payment .service.ts
    mappers.ts             Mongoose doc -> serialisable DTO
  models/                  One Mongoose model per file, indexes beside the schema
  lib/
    db/connect.ts          Cached connection, withTransaction()
    auth/                  Auth.js config, providers (swappable), guards
    payments/              PaymentProvider interface + Razorpay implementation
    email/  cloudinary.ts  validations/  utils.ts
  components/
    ui/                    shadcn-style primitives (button, input, drawer, sheet)
    layout/ product/ cart/ auth/ pwa/
  config/                  env (zod-validated), site constants
  types/                   DTOs, next-auth augmentation
scripts/seed.ts
public/sw.js               Service worker
```

**Rules for the layers:**
- Pages, actions and route handlers never touch models directly for writes. They go through `services/`.
- Only DTOs from `types/dto.ts` cross from server to client components.
- Authorisation is checked with `lib/auth/guards.ts` in every page, action and handler that needs it. Middleware is not used as a security boundary.
- Money is stored as integer **paise** everywhere.

## Owner dashboard (`/admin`)

| Section | What it does |
| --- | --- |
| **Analytics** | Revenue, paid orders, average order value and new customers for the last 7, 30 or 90 days, each compared with the previous period. Also shows revenue per day, top products, orders by status and low stock. |
| **Approvals** | Paid orders waiting for you (approve, or reject and refund), return requests (approve, reject, mark received, mark refunded) and new reviews (approve, hide, reply). |
| **Orders** | Filter by status, search by order number, email, name or phone. Each order has a detail page with items, customer, payment, refund state, timeline, the allowed next actions and internal notes. |
| **Products** | List with filters. The add/edit form covers photos, variants (glaze × size, SKU, price, compare-at price, stock), visibility and details. **Active** products appear in the store straight away. A product that appears in past orders is archived instead of deleted. |
| **Categories** | Categories (image, slug, order, visibility), glazes (colour and finish) and sizes. |
| **Users** | Order count and spend for each user. Change roles (the store always keeps at least one owner) and block or unblock accounts. |
| **Settings** | Shipping fee, free-shipping threshold, return window, unpaid hold time, announcement bar and contact details. |

Order statuses run: `PENDING_PAYMENT → AWAITING_APPROVAL → CONFIRMED → (IN_PRODUCTION) → DISPATCHED → DELIVERED`. Rejecting or cancelling an order puts the stock back and refunds through the payment provider. Without Razorpay keys, the refund is recorded as pending for you to issue by hand.

Image uploads go to Cloudinary when it's configured. In development without Cloudinary keys, they're saved to `public/uploads/`.

`npm run seed:demo` (development only) adds demo customers, about 90 days of orders, reviews and a return request, so the dashboard has data to show. Its records are prefixed `DEMO-` and `@demo.local`, and each run replaces them.

## Key flows

**Stock and overselling.** Variants are embedded in the product. `inventory.service.reserveLine` runs `findOneAndUpdate` with `variants: { $elemMatch: { _id, stock: { $gte: qty } } }` and `$inc: { "variants.$.stock": -qty }`. `order.service.createOrderFromCart` reserves every line and creates the order in one transaction, so if one line is short, nothing is decremented. A unique piece flips to `SOLD` when its last unit is reserved. Made-to-order lines are not limited by stock.

**Order snapshots.** Order items copy the name, SKU, glaze, size, image and unit price at purchase time.

**Payments.** `placeOrderAction` creates the order (`PENDING_PAYMENT`, stock reserved), then a Razorpay order, then opens the widget in the browser. Confirmation is idempotent and comes from two places: `/api/payments/verify` (signature check) and `/api/payments/webhook` (HMAC over the raw body). `/api/cron/expire-orders` releases stock for unpaid orders after `settings.unpaidOrderTtlMinutes`. Schedule it every 10 minutes with `Authorization: Bearer $CRON_SECRET`.

To switch payment gateway, implement `PaymentProvider` in `lib/payments/` and return it from `getPaymentProvider()`.

**Auth.** Email OTP is Auth.js's email provider with a 6-digit `generateVerificationToken`. The code entry page forwards to `/api/auth/callback/email-otp?token=…`. Providers live only in `lib/auth/providers.ts`. On sign-in, the guest cart is merged into the user's cart.

## Razorpay webhook

In Dashboard → Webhooks, add `https://<domain>/api/payments/webhook` with the events `payment.captured`, `payment.failed` and `refund.processed`, and put the secret in `RAZORPAY_WEBHOOK_SECRET`.
