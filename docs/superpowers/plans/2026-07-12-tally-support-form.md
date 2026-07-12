# Tally Support Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Tally the only bug-report action on the website and in the iOS app while keeping `support@peregrinedryfire.com` visible and selectable as plain text.

**Architecture:** The website uses Tally's fixed iframe URL and official loader inside the existing support block. The iOS app opens the fixed public Tally URL with SwiftUI `openURL`; neither platform turns the support address into an action.

**Tech Stack:** Static HTML/CSS/JavaScript, Node assertion tests, SwiftUI, Swift Testing, Xcode 18.

## Global Constraints

- Website embed URL: `https://tally.so/embed/QKW7Vk?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`.
- iOS form URL: `https://tally.so/r/QKW7Vk`.
- Published support address: `support@peregrinedryfire.com`.
- The support address must not be an anchor or button.
- Do not add WKWebView, a JavaScript bridge, or a new dependency.
- Preserve unrelated working-tree changes in both repositories.

---

### Task 1: Website Support Form

**Files:**
- Modify: `tests/editor-regression.test.js`
- Modify: `index.editor.html`
- Modify: `styles.css`
- Verify generated/ignored output: `public/index.html`, `public/styles.css`, `public/script.js`, `public/assets/`

**Interfaces:**
- Consumes: the existing `.signup__contact` support block and `publish.sh` pipeline.
- Produces: one lazy Tally iframe, one Tally loader, and `.signup__email` selectable text in the generated public page.

- [ ] **Step 1: Write failing regression assertions**

Replace the existing mailto and in-app-template assertions with checks equivalent to:

```js
const tallyEmbedURL = "https://tally.so/embed/QKW7Vk?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";
assert(index.includes(`data-tally-src="${tallyEmbedURL.replaceAll("&", "&amp;")}"`));
assert.equal((index.match(/https:\/\/tally\.so\/widgets\/embed\.js/g) || []).length, 1);
assert(index.includes('class="signup__email"') && index.includes('>support@peregrinedryfire.com</span>'));
assert(!index.includes('mailto:support@peregrinedryfire.com'));
```

- [ ] **Step 2: Run the website test and verify RED**

Run: `node tests/editor-regression.test.js`

Expected: FAIL because `public/index.html` still has the mailto link and no Tally iframe.

- [ ] **Step 3: Add the Tally embed and selectable address**

Replace the old support paragraphs in `index.editor.html` with the supplied iframe and loader, followed by plain text:

```html
<div class="signup__contact" aria-label="Support and bug reports">
  <p class="signup__contact-title"><strong>Support &amp; Bug Reports</strong></p>
  <iframe data-tally-src="https://tally.so/embed/QKW7Vk?alignLeft=1&amp;hideTitle=1&amp;transparentBackground=1&amp;dynamicHeight=1" loading="lazy" width="100%" height="200" frameborder="0" marginheight="0" marginwidth="0" title="Peregrine Support: Bug Report"></iframe>
  <script>var d=document,w="https://tally.so/widgets/embed.js",v=function(){"undefined"!=typeof Tally?Tally.loadEmbeds():d.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((function(e){e.src=e.dataset.tallySrc}))};if("undefined"!=typeof Tally)v();else if(d.querySelector('script[src="'+w+'"]')==null){var s=d.createElement("script");s.src=w,s.onload=v,s.onerror=v,d.body.appendChild(s);}</script>
  <p class="signup__email-fallback">Prefer email? Copy <span class="signup__email">support@peregrinedryfire.com</span></p>
</div>
```

Add CSS that gives the form room and makes `.signup__email` use `user-select: all` and `cursor: text`.

- [ ] **Step 4: Publish and verify GREEN**

Run: `./publish.sh`

Expected: both Node regression scripts pass and generated public files contain no editor shell.

Run: `git diff --check`

Expected: exit 0 with no output.

---

### Task 2: iOS Support Form

**Files:**
- Modify: `/Users/tylerbeattie/Developer/Peregrine-iOS/Test4-LaserDotDetectorTests/Test4_LaserDotDetectorTests.swift`
- Modify: `/Users/tylerbeattie/Developer/Peregrine-iOS/Test4-LaserDotDetector/Views/SettingsView.swift`
- Modify: `/Users/tylerbeattie/Developer/Peregrine-iOS/docs/CHANGELOG_v2.0_build12.md`

**Interfaces:**
- Consumes: `SettingsView.openURL` and the existing support-bundle share message.
- Produces: `SupportContact.supportFormURL: URL?`, `SupportContact.supportEmail: String`, and a selectable email footer.

- [ ] **Step 1: Replace the mail-draft unit test with a failing form test**

```swift
@Test func supportContactUsesPublishedFormAndEmail() throws {
    let url = try #require(SupportContact.supportFormURL)
    #expect(url.absoluteString == "https://tally.so/r/QKW7Vk")
    #expect(url.scheme == "https")
    #expect(url.host == "tally.so")
    #expect(SupportContact.supportEmail == "support@peregrinedryfire.com")
}
```

- [ ] **Step 2: Run the focused unit test and verify RED**

Run from the iOS repository:

```bash
xcodebuild test -project Test4-LaserDotDetector.xcodeproj -scheme Test4-LaserDotDetector -destination 'platform=iOS Simulator,name=iPhone 15' -only-testing:Test4-LaserDotDetectorTests
```

Expected: FAIL to compile because `SupportContact.formURL` does not exist.

- [ ] **Step 3: Replace the email draft with the fixed form model and view**

Use a nonisolated support model:

```swift
nonisolated enum SupportContact {
    static let supportEmail = "support@peregrinedryfire.com"
    static let supportFormURL = URL(string: "https://tally.so/r/QKW7Vk")
    static let supportBundleShareMessage = "Please send this Peregrine support bundle to " +
        "support@peregrinedryfire.com with a short description of the problem."
}
```

Change the Contact Support row to open `SupportContact.supportFormURL`, describe that it opens the form in a browser, and use this plain footer content:

```swift
VStack(alignment: .leading, spacing: 8) {
    Text("Prefer email? Long-press the address to copy it.")
    Text(SupportContact.supportEmail)
        .textSelection(.enabled)
}
```

Update the current build changelog to describe the form migration.

- [ ] **Step 4: Verify GREEN and build**

Run the focused test again, then:

```bash
xcodebuild test -project Test4-LaserDotDetector.xcodeproj -scheme Test4-LaserDotDetector -destination 'platform=iOS Simulator,name=iPhone 15' -only-testing:Test4-LaserDotDetectorTests
xcodebuild build -project Test4-LaserDotDetector.xcodeproj -scheme "Peregrine Public Test" -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO
git diff --check
```

Expected: tests and build exit 0; `git diff --check` is silent.

---

### Task 3: Commit and Push Both Main Branches

**Files:**
- Commit only the planned website files in `/Users/tylerbeattie/Developer/Peregrine-Deploy`.
- Commit only the planned iOS files in `/Users/tylerbeattie/Developer/Peregrine-iOS`.

**Interfaces:**
- Consumes: verified working trees on `main`.
- Produces: pushed `origin/main` branches for both repositories.

- [ ] **Step 1: Review exact diffs and status**

Run `git diff --check`, `git diff --stat`, `git diff`, and `git status --short --branch` in each repository. Confirm the iOS `CLAUDE.md` edit and untracked audit document are not staged.

- [ ] **Step 2: Commit the website change**

Stage the plan, tests, authoring source, and styles. The generated `public/` output is ignored and is verified through `publish.sh`, not committed. Commit with `Embed Tally support form`.

- [ ] **Step 3: Commit the iOS change**

Stage only the Swift test, `SettingsView.swift`, and build-12 changelog. Commit with `Open Tally bug report form`.

- [ ] **Step 4: Push both main branches**

Run `git push origin main` in each repository and verify each local `main` is aligned with `origin/main` while the unrelated iOS working-tree files remain untouched.
