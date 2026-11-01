# LeadsGate website: security plan

Status: **prototype**. Checkout, MoMo proof upload, admin and stock currently run in the browser with demo data (`dist/lg-store.js`). That proves the flow for the client. It is **not** secure enough for real customers or money. This document covers what is in place now and what the production build must add before launch.

## What is in place now (prototype)

| Area | Done |
|---|---|
| Security headers (`vercel.json`) | Content-Security-Policy (scripts only from this site plus two hashed inline scripts; no third-party scripts), `X-Frame-Options: DENY`, `frame-ancestors 'none'`, HSTS, `nosniff`, a strict Referrer-Policy, a Permissions-Policy that disables camera, microphone and location, and COOP |
| Admin pages | `noindex` and `no-store` headers, no referrer, a passcode lock (salted SHA-256), a 30-minute idle timeout, and a 60-second lockout after 5 failed attempts. **The lock only protects the demo in that browser.** |
| Checkout | Prices are always recalculated from the catalogue, never taken from the page. Ghana phone numbers are validated. A transaction ID can't be reused across orders. The amount must match the total. Uploads accept PNG, JPG or WebP only, up to 8 MB, and are re-encoded so metadata such as GPS is removed. |
| Stock | Every change is written to a ledger (who, when, type, change, balance, reference, note). Stock is held when an order is placed, released on rejection and marked as a sale on approval. Write-offs and adjustments need a note. |
| CSV | Import is previewed before it's applied, with row-level validation and a 1,000-row / 2 MB cap. Values beginning `= + - @` are escaped to stop spreadsheet formula injection. |
| Output | All user text is HTML-escaped before rendering. |
| Customer order lookup | Needs both the order reference and the phone number. |

## Production build (required before real orders)

**Backend:** Supabase (Postgres, Auth and Storage), with the Vercel site as the front end.

1. **Admin accounts.** Use Supabase Auth with a personal email login for each staff member, require MFA (TOTP), and remove shared passcodes. Give each person a role: `owner` (settings, refunds, users), `staff` (orders, stock) or `viewer`.
2. **Row Level Security on every table.** Customers can only insert orders. They never read other orders. Admin reads and writes require an authenticated user with a staff role. Deny everything by default.
3. **Server-side order creation.** Orders are created by an Edge Function (or Postgres RPC) that recalculates prices, checks stock in the same transaction and writes the stock hold. The browser never sets prices, totals or status.
4. **Payment proofs.** Store them in a **private** bucket. Uploads go through a signed upload URL scoped to that one order. Admins view them through short-lived signed URLs. Check file type by magic bytes server-side and limit size to 8 MB. Delete proofs after the agreed retention period, for example 12 months.
5. **Payment verification.** Staff approve only after matching the transaction ID, amount and sender in the **MoMo merchant statement**, because screenshots can be edited. Optional later step: a provider such as Paystack or Hubtel for automatic MoMo confirmation via webhooks, verified with signatures.
6. **Abuse protection.** Add rate limits on order submission and order lookup (per IP and per phone), Cloudflare Turnstile or hCaptcha on checkout, and Vercel Firewall rules for bursts.
7. **Audit log.** Make the database audit table append-only, covering every admin action, sign-in and settings change.
8. **Secrets.** The Supabase service-role key lives only in Vercel environment variables used by server functions. It never goes in the browser or the repo. Only the anon key is public, and RLS protects the data.
9. **Data protection (Ghana).** LeadsGate is the data controller under the Data Protection Act, 2012 (Act 843). It should register with the Data Protection Commission and publish a privacy notice covering what is collected (name, phone, MoMo number, proof image), why, how long it is kept and who to contact. Collect only what's needed. The Commission began compliance checks in October 2026.
10. **Operations.** Turn on backups (Supabase PITR or daily), set up uptime and error monitoring, add Dependabot for the repo, protect branches (no direct pushes to `main`) and review deploys.

## Hand-over checklist

- [ ] LeadsGate confirms the MoMo merchant number and the registered account name
- [ ] Real prices and opening stock are loaded (CSV import)
- [ ] Staff accounts are created with MFA, and the prototype passcode lock is removed
- [ ] RLS policies are tested with anon, staff and owner roles
- [ ] The privacy notice is published and DPC registration is confirmed
- [ ] Demo labels and the prototype banner are removed
