# App Store Launch Website, Contact, and Discount Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Planning only. This document does not authorize website edits, deployment, App Store pricing changes, email-account creation, or customer communication.

**Goal:** Replace the pre-launch message with a clear App Store download action, retain a useful way to contact the developer, organize those messages without adding an unnecessary inbox, and document the discount options that fit Peregrine's one-time paid-app model.

**Architecture:** Make the App Store link the primary conversion action and a compact Netlify contact form the secondary action. Keep the source/public split intact: author changes in `index.editor.html`, generate `public/` with `./publish.sh`, and configure form notifications in Netlify rather than embedding private email-routing details in the site.

**Tech Stack:** Static HTML/CSS/JavaScript, Netlify Forms, Netlify email notifications, Porkbun email forwarding, SMTP2GO, Gmail filters/labels, App Store Connect.

## Global Constraints

- Do not hand-edit `public/`; it is generated and is the only folder Netlify publishes.
- Preserve `index.editor.html` as the authoring source and run `./publish.sh` to create the public site.
- Peregrine's documented product model is a one-time paid app with included updates, not a subscription or a paywalled free app.
- Do not publish an App Store URL, Apple ID, price, discount date, or response-time promise until the real value has been confirmed.
- The confirmed public support address is `support@peregrinedryfire.com`; never commit its forwarding destination, SMTP password, or other account credentials.
- Use Apple's official App Store badge artwork without modification.
- Do not display the developer's personal Gmail address on the public site.
- Collect only the information needed to reply: optional name, required email, reason, and message.

---

## 1. Current State

The current bottom CTA in `index.editor.html` says:

- Heading: `Be first on the line`
- Body: `Peregrine is coming to iPhone. Leave your email and we'll let you know the moment it's ready.`
- Button: `Notify me`
- Note: `No spam — just one email when we launch.`
- Success: `You're on the list. We'll email you at launch.`

The form is already submitted to Netlify as `launch-signup`. The publish script adds a honeypot, and the regression tests require that protection. The JavaScript currently validates only one email field, starts the request without waiting for a successful response, and immediately shows a success message.

Important consequence: changing only `Notify me` to `Email me` would not create a useful contact channel. The launch signup remains focused on collecting an address. As a pre-launch bridge, the site now shows `support@peregrinedryfire.com` directly below the form for questions while leaving the post-launch contact-form conversion as a separate task.

Before changing or renaming the form, export the existing `launch-signup` submissions from Netlify to CSV so the launch list is preserved as a historical record.

## 2. CTA Approaches

### Approach A — App Store first, contact second (recommended)

Make the official App Store badge the primary CTA. Put a secondary `Contact the developer` action below it that reveals or leads to a compact contact form.

**Advantages:** Gives visitors the action most likely to matter after launch, still provides direct access to the developer, and does not confuse a support form with a mailing list.

**Trade-off:** Requires expanding the current one-field form and improving its JavaScript success/error handling.

### Approach B — App Store and full contact form always visible

Show the App Store badge, then display all contact fields directly underneath.

**Advantages:** Most discoverable for support and partnership inquiries.

**Trade-off:** Makes the bottom CTA visually heavier and competes with the download action.

### Approach C — Keep an updates mailing list

Change the section to `Get Peregrine updates` and continue collecting email addresses for release notes, new drills, or major features.

**Advantages:** Preserves an audience for future announcements.

**Trade-off:** This is a newsletter commitment, not a general contact channel. Netlify Forms stores submissions but does not by itself manage consent, unsubscribes, campaigns, or confirmation emails. Use this only if regular product email is genuinely planned, and connect a mailing-list service later.

**Decision for implementation:** Use Approach A. It is the clearest post-launch conversion path and keeps ongoing email obligations small.

## 3. Recommended Post-Launch Copy

### Primary copy set

- Heading: `Start training with Peregrine`
- Body: `Peregrine is available for iPhone. Download it on the App Store, or send a note if you have a question, feedback, or a partnership idea.`
- Primary action: official `Download on the App Store` badge
- Secondary action: `Contact the developer`

### Contact form copy

- Name label: `Name (optional)`
- Email label: `Email`
- Reason label: `What can I help with?`
- Message label: `Message`
- Submit button: `Send message`
- Privacy note: `I'll use your email only to respond to your message.`
- Pending state: `Sending…`
- Success state: `Thanks — your message was sent.`
- Error state: `That message didn't go through. Please try again or email support directly.`

Do not promise a response within a specific number of hours or days until there is a support routine that can reliably meet that promise.

### Alternate headline/body options

1. `Ready for the range?`
   `Download Peregrine for iPhone and turn every dry-fire session into measurable training. Questions or feedback? Send me a note.`
2. `Take your training further`
   `Peregrine is now available on the App Store. Download the app, or get in touch about support, feedback, or group use.`
3. `Questions about Peregrine?`
   `Get Peregrine on the App Store, or contact the developer for setup help, feedback, partnerships, and other questions.`

The primary copy set is recommended because it leads with the product action, clearly states availability, and keeps the contact invitation broad without sounding like a customer-service department.

## 4. Reasons People May Contact the Developer

Use the following choices in the reason selector:

1. `Setup or troubleshooting`
2. `Bug report`
3. `Feedback or feature idea`
4. `Instructor, range, or group use`
5. `Media or review request`
6. `Privacy question`
7. `Other`

These choices cover the most likely requests:

- Help with camera placement, target printing, laser detection, compatible hardware, or app behavior.
- A reproducible bug report; the developer may ask the user to export the app's existing support bundle from Settings → Help & Support.
- Suggestions for drills, targets, workflow, accessibility, or other product improvements.
- Questions from instructors, clubs, ranges, organizations, or training groups about adoption and pricing.
- Review copies, screenshots, interviews, press, podcasts, or creator coverage.
- Privacy-policy and data-handling questions.
- App Store billing/refund questions. The developer can explain the product, but purchases and refund decisions are handled through Apple.

Do not add file upload to the public form in the first version. Support bundles may contain diagnostic material and are better shared through an intentional support exchange after the initial message.

## 5. Email Address and Gmail Organization

### Confirmed setup — completed July 10, 2026

The public address is:

```text
support@peregrinedryfire.com
```

It uses a free, single-inbox route:

```text
Incoming: support@peregrinedryfire.com → Porkbun forwarding → existing Gmail inbox
Outgoing: existing Gmail inbox → SMTP2GO → recipient sees support@peregrinedryfire.com
```

The following configuration was completed and verified with a successful two-way test:

- Porkbun forwards `support@peregrinedryfire.com` to the existing Gmail account.
- Porkbun's incoming-mail MX records remain `fwd1.porkbun.com` at priority 10 and `fwd2.porkbun.com` at priority 20.
- SMTP2GO has verified the sender domain `peregrinedryfire.com`.
- Gmail `Send mail as` uses the display name `Tyler — Peregrine Support` and the address `support@peregrinedryfire.com`.
- Gmail treats the address as an alias and does not specify a different Reply-To address.
- A message sent from Gmail arrived with `support@peregrinedryfire.com` as the visible sender, and a reply to that message returned to the existing Gmail inbox through Porkbun.

SMTP2GO's public DNS records are:

| Type | Hostname | Value |
|---|---|---|
| CNAME | `em662372` | `return.smtp2go.net` |
| CNAME | `s662372._domainkey` | `dkim.smtp2go.net` |
| CNAME | `email-links` | `track.smtp2go.net` |

The SMTP connection used by Gmail is:

```text
Server: mail.smtp2go.com
Port: 587
Security: TLS
SMTP username: peregrinedryfire.com
```

The SMTP user description is `Gmail send-as for support@peregrinedryfire.com`. The password is intentionally not recorded in this repository and must remain in the account/password manager only.

SMTP2GO user settings for ordinary support correspondence are:

- Unsubscribe footer: off
- Open tracking: off
- Click tracking: off
- User status: allowed
- Email auditing/BCC: blank
- Bounce notifications: on, delivered to the original sender

The `email-links.peregrinedryfire.com` tracking record may remain configured even though tracking is disabled. It does not affect the main website and will remain unused unless tracked email is intentionally enabled later.

This setup provides a professional, portable public address without adding a second inbox or a paid mailbox. A dedicated mailbox becomes worthwhile only when another person needs access, message volume becomes difficult to manage, or separate retention/security rules are needed.

### Gmail filter

Configure Netlify's notification subject to begin with `[Peregrine Website]`. Then create this Gmail filter:

```text
from:(formresponses@netlify.com) subject:("[Peregrine Website]")
```

Actions:

- Apply label `Peregrine/Website`
- Never send to spam
- Mark as important, if that remains useful after observing actual volume
- Do not automatically archive at first; keep new messages visible in the inbox

Optional later sub-labels are `Peregrine/Support`, `Peregrine/Feedback`, and `Peregrine/Partnerships`. Start with one label; splitting too early creates more sorting work than it saves.

## 6. Netlify Form and Notification Plan

### Website form

Rename `launch-signup` to `contact-developer` so future Netlify submissions are clearly separated from the historical waitlist. Include these fields:

- `form-name=contact-developer` (hidden)
- `name` (optional text)
- `email` (required email)
- `reason` (required select)
- `message` (required textarea)
- `bot-field` (hidden honeypot added/maintained by the publish workflow)

Keep the field name exactly `email`. Netlify uses it as the notification's Reply-To address, allowing a reply to go to the visitor instead of `formresponses@netlify.com`.

### Netlify UI configuration

After deploying the renamed form:

1. Open the Peregrine project in Netlify.
2. Confirm form detection is enabled and `contact-developer` appears under Forms after the deploy.
3. Go to **Project configuration → Notifications → Emails and webhooks → Form submission notifications**.
4. Add an email notification limited to the `contact-developer` form.
5. Send it to `support@peregrinedryfire.com`, which forwards into the existing Gmail inbox.
6. Set the subject to `[Peregrine Website] New %{formName} message (%{submissionId})`.
7. Submit one real test message and verify that it appears both in Netlify Forms and in the labeled Gmail view.
8. Reply to the test and confirm that the reply is addressed to the submitted email.

Netlify retains verified submissions in the Forms UI, which provides a backup when an email notification is missed. Check the spam-submissions view periodically during the first few weeks.

### Runtime behavior

The implementation must:

- Disable the button and show `Sending…` during the request.
- Wait for the Netlify response.
- Show success only when `response.ok` is true.
- Preserve the entered message if the request fails.
- Re-enable the button and show the error state after failure.
- Offer `support@peregrinedryfire.com` as the direct-email fallback.
- Keep the honeypot and do not add CAPTCHA unless actual spam volume requires it.

Netlify email notifications do not send an automatic receipt to the visitor. Do not add an autoresponder initially. If message volume later justifies one, use a Netlify webhook/function or an email automation service and make the receipt clear that it is automated.

## 7. App Store Link Plan

Once the real App Store product URL is available:

1. Copy the canonical App Store product URL shown in App Store Connect rather than publishing a temporary or hand-constructed URL.
2. Generate/download the official badge from Apple's App Store Marketing Tools.
3. Place one official badge in the bottom CTA as the primary action; do not redraw, animate, recolor, or put text inside the badge.
4. If a header CTA is later desired, link it to the same product URL with the text `Get Peregrine`; avoid placing a second large badge in the same layout.
5. Add the Apple Smart App Banner meta tag using the confirmed Apple ID.
6. Update the page's SoftwareApplication JSON-LD with the real App Store `url` and `downloadUrl`.
7. Add an accessible label such as `Download Peregrine on the App Store`.
8. Test the link on iPhone Safari and a desktop browser before publishing.

Rename the CTA anchor from `signup` to `contact` and use `https://peregrinedryfire.com/#contact` as the App Store Connect Support URL only after confirming that the deployed anchor opens the form correctly. If App Review requires a standalone support page, add that as a separate follow-up rather than overloading the launch change.

If the app is available for pre-order before release, use Apple's official pre-order badge. Replace it with the download badge as part of the release-day checklist.

## 8. App Store Discount Options for Peregrine

The app repository documents Peregrine as a one-time paid app with included updates. Use the paid-app options below rather than subscription offers.

### Limited-time public discount (recommended for a sale)

App Store Connect supports a temporary app price with definite start and end dates:

1. Open **Apps → Peregrine → Monetization → Pricing and Availability**.
2. Under Price Schedule, select the add button.
3. Choose **Temporary Price Change**.
4. Set the start/end dates, storefronts, and temporary price.
5. Review and confirm the scheduled return to the normal price.

This is the correct tool for a launch week, holiday, event, or month-long promotion. The lower price is visible to everyone in the selected storefronts; it cannot be restricted to people who know a code.

### Small group, instructor, reviewer, or giveaway

Paid-app promo codes give recipients a **free copy**, not a percentage discount. Apple currently permits up to 100 app promo codes per version for each supported platform. Each is single-use and expires four weeks after generation.

Use these for reviewers, a small instructor cohort, contest winners, or selected evaluators. Do not use them as a substitute for a large paid group promotion.

### Educational institutions

Before the app is approved, decide whether to enable the Apple School Manager volume-purchase discount. Apple allows a 50% discount for educational institutions buying at least 20 copies. This is specifically for eligible educational institutions, not a general gun club, range, or informal training group.

This setting deserves an explicit pre-submission decision because Apple's documentation says the reduced-price education option is available before approval.

### Ordinary group-specific percentage discount

A one-time paid App Store download does not have a normal reusable `GROUP20`-style percentage-off code. The practical choices are:

1. Run a temporary public price reduction during the group's enrollment window.
2. Give a small number of people free paid-app promo codes.
3. Use the education-volume option when the buyer qualifies.
4. Discuss a separate managed/private distribution strategy only if a business requires organization-controlled deployment; do not change the public distribution model solely for a promotion.

Apple now supports discounted offer codes for In-App Purchases, but using them would require changing Peregrine from its planned paid-download model to a free download with an In-App Purchase. That adds StoreKit implementation, purchase restoration, pricing, testing, and customer-support complexity. Do not change the product model merely to gain discount codes.

### Promotion record

For every promotion, record:

- Internal campaign name
- Goal and audience
- Normal and promotional price
- Storefronts
- Start and end dates
- Promo-code count, if applicable
- Public copy and channels
- App Store Connect confirmation screenshot
- Results from Sales and Trends after the promotion

Do not advertise an exact discount until the price schedule is visible and confirmed in App Store Connect.

## 9. Implementation Tasks

### Task 1: Archive the launch list and finish inbox organization

**Files:** No repository files.

- [ ] Export `launch-signup` submissions from the Netlify Forms UI to CSV.
- [x] Create the free `support@peregrinedryfire.com` Porkbun forward to the existing Gmail inbox.
- [x] Verify `peregrinedryfire.com` in SMTP2GO with authenticated return-path, DKIM, and tracking CNAME records.
- [x] Configure Gmail `Send mail as` through `mail.smtp2go.com` on port 587 with TLS.
- [x] Verify two-way delivery: send from the public alias and receive a reply through the forward.
- [ ] Create the Gmail label and Netlify-notification filter.

### Task 1A: Add the support address to the pre-launch website

**Files:**

- Modify: `index.editor.html`
- Modify: `styles.css`
- Modify: `script.js`
- Modify: `README.md`
- Test: `tests/editor-regression.test.js`

- [x] Show `support@peregrinedryfire.com` as a visible mailto link below the launch signup for general questions.
- [x] Replace the personal-Gmail mailto fallback in `script.js` with `support@peregrinedryfire.com`.
- [x] Keep the existing `Notify me` button posting to Netlify Forms instead of opening an email client.
- [x] Add regression coverage requiring the public support link and forbidding the personal Gmail address in the published runtime.
- [x] Document the distinction between the source-code fallback and Netlify's dashboard-managed notification recipient.
- [ ] In Netlify, change the `launch-signup` form-notification recipient to `support@peregrinedryfire.com`, then submit a live test signup.

### Task 2: Convert the CTA and form

**Files:**

- Modify: `index.editor.html`
- Modify: `styles.css` only if the extra fields or collapsed contact action require layout rules
- Modify: `script.js`

- [ ] Replace all launch/waitlist copy with the selected post-launch copy.
- [ ] Add the official App Store action only after the product URL is confirmed.
- [ ] Rename the form and add name, email, reason, and message fields.
- [ ] Add accessible labels, focus states, pending/success/error status text, and keyboard behavior.
- [ ] Replace optimistic submission handling with response-aware success and error handling.

### Task 3: Generalize publish protection and regression checks

**Files:**

- Modify: `publish.sh`
- Modify: `tests/editor-regression.test.js`
- Modify: `tests/public-responsive.test.js` only if the CTA layout assertions need coverage

- [ ] Replace launch-specific names such as `protectLaunchSignup` and `launchSignupFormMatch` with contact-form names.
- [ ] Require the `contact-developer` form, all registered fields, and exactly one hidden honeypot in generated output.
- [ ] Add a regression assertion that no `coming soon`, `Notify me`, or launch-list success copy remains in `public/index.html`.
- [ ] Add a regression assertion that the public App Store link uses the confirmed product URL.

### Task 4: Update documentation and metadata

**Files:**

- Modify: `README.md`
- Modify: `index.editor.html` for Smart App Banner and JSON-LD metadata

- [x] Replace the outdated README instructions that describe Formspree/Getform/Basin instead of the active Netlify Forms route.
- [ ] Document Netlify Forms as the active contact transport.
- [ ] Add the confirmed App Store URL to JSON-LD and the Smart App Banner.
- [ ] Document the source → publish workflow for future copy changes.
- [ ] Confirm the App Store Connect Support URL opens the deployed contact section.
- [ ] In the separate app repository, replace the `<support-email>` marker in `PRIVACY.md` with `support@peregrinedryfire.com` before App Store submission.

### Task 5: Configure and test Netlify notifications

**Files:** No repository files.

- [ ] Deploy the updated static form so Netlify detects `contact-developer`.
- [ ] Add the form-specific email notification addressed to `support@peregrinedryfire.com` and set its subject.
- [ ] Send one successful test and one validation-failure test.
- [ ] Confirm the successful submission appears in Netlify and Gmail.
- [ ] Confirm Gmail labels it correctly and Reply-To targets the visitor.

### Task 6: Publish verification

Run:

```bash
./publish.sh
node tests/editor-regression.test.js
node tests/public-responsive.test.js
git diff --check
python3 serve.py
```

Expected results:

- Both Node scripts print their passing summaries and exit 0.
- `git diff --check` produces no output.
- The locally served site loads at `http://localhost:8099`.
- `public/index.html` contains the contact form and App Store link but no editor shell or pre-launch copy.
- The form layout works at narrow iPhone width and desktop width.
- Keyboard navigation reaches every field, both CTA actions, and all status messages are announced appropriately.

## 10. Release-Day Checklist

- [ ] App Store product URL opens the released product in every intended storefront.
- [ ] Download badge is used instead of a pre-order badge.
- [ ] Smart App Banner contains the correct Apple ID.
- [ ] JSON-LD contains the real App Store URL.
- [ ] No `coming soon`, launch-list, or one-time-launch-email copy remains.
- [ ] Contact form sends and shows an honest success/error state.
- [x] Pre-launch website shows `support@peregrinedryfire.com` for questions without exposing the personal Gmail address.
- [ ] Netlify retains the submission and Gmail receives the notification.
- [x] The public alias can receive mail and send replies.
- [ ] Any advertised discount matches the confirmed App Store price schedule.
- [ ] Existing launch-list data has been exported before the form is renamed.

## 11. Primary References (verified July 10, 2026)

- [Netlify form notifications](https://docs.netlify.com/manage/forms/notifications/)
- [Netlify form submissions](https://docs.netlify.com/manage/forms/submissions/)
- [Porkbun: email forwarding](https://kb.porkbun.com/article/10-how-to-set-up-email-forwarding-service)
- [SMTP2GO: verified sender domains](https://support.smtp2go.com/hc/en-gb/articles/115004408567-Verified-Senders)
- [SMTP2GO: SMTP settings](https://support.smtp2go.com/hc/en-gb/articles/223087627-SMTP-Settings)
- [Gmail: send mail from another address](https://support.google.com/mail/answer/22370)
- [Apple: schedule price changes for apps](https://developer.apple.com/help/app-store-connect/manage-app-pricing/schedule-price-changes-for-apps)
- [Apple: request and manage paid-app promo codes](https://developer.apple.com/help/app-store-connect/offer-promo-codes/request-and-manage-promo-codes/)
- [Apple: distribution methods and education pricing](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/set-distribution-methods)
- [Apple: App Store marketing and badge guidelines](https://developer.apple.com/app-store/marketing/guidelines/)
- [Apple: Smart App Banners](https://developer.apple.com/documentation/webkit/promoting-apps-with-smart-app-banners)
- [Apple: In-App Purchase offer codes](https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/create-offer-codes-for-in-app-purchases/)
