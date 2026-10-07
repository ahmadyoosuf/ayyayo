# T2. Site map and full copy

Final copy, block by block. A *Pattern:* line after each block names the reference pattern it uses. `[Brackets]` are facts only Ahmad can supply; T6 lists them all as questions.

Two conventions used throughout:
- **The one "not" sentence** is the Home block of that name. All other copy states limits as positive facts ("we turn down", "you keep the balance"). Exceptions: section labels the brief itself specified ("What this is and isn't") and legal text.
- **Headers** each carry a number, a date or a negation. A short label above the header (eyebrow) is navigation, not a header.

---

## Site map

```
/                     Home
/services             Services
/how-we-work          How we work
/see-it-work          See it work on your system   (linked from Home hero, Services, How we work)
/partners             Partners                     (linked from Services and Contact)
/about                About
/insights             Insights   (post 1: the thesis, 01-thesis.md)
/careers              Careers
/contact              Contact
/privacy-notice       Privacy Notice
/terms-of-use         Terms of Use
/cookie-policy        Cookie Policy
/security             Security
Products              [product URL], opens in a new tab
```

### Navigation

`Services · How we work · Products ↗ · About · Insights · Careers · Contact`

The Products item opens a menu with one card:

> **[product name]**
> Kids say what they want out loud, watch the app build on screen, and publish it to a link they keep.
> Opens in a new tab ↗

Markup: `<a href="[product URL]" target="_blank" rel="noopener">`. Screen-reader label: "[product name] (opens in a new tab)".

*Pattern:* Mechanical Orchard's flat top nav; the product card follows the user brief exactly.

---

## Home

### Hero

**Your [tool] rebuilt and your data moved in 21 days, at a fixed price.**

You pay 50% to start and the balance when you accept the software. If we miss day 21, you keep the balance.

[Get a fixed price in 48 hours] → https://calendly.com/twa8239
[See it work on your system] → /see-it-work

*Pattern:* Lab0's time-compression headline plus Perfectly's pay-on-outcome term, leading with risk removal.

### Ratio block

**21 days and a fixed $10,000, against [X] months and $[Y] billed by the hour**

ayyayo rebuilds the tool you rent as software you own. Compared with [named incumbent, e.g. "a time-and-materials build quoted by [agency type]" or "renewing [tool]"]:

| | [Named incumbent] | ayyayo |
|---|---|---|
| Time to live | [X] months [source] | 21 days |
| Price | $[Y], estimated, billed hourly [source] | From $10,000, fixed in writing |
| Paid before you accept | Every monthly invoice | 50% |
| Monthly cost after go-live | 100% of the [tool] subscription | 30 to 50% of that subscription |

Our first delivered document reader runs at about one tenth of the cost of Azure's equivalent service.

*Pattern:* Perfectly's results-as-ratios, set against a named incumbent with the source shown.

### The "not" sentence

**ayyayo does not bill by the hour: each engagement has one price, written down within 48 hours, and that price holds until delivery.**

*Pattern:* Distyl careers' contrast form, reduced to one checkable claim.

### The three offers

**3 offers, in the order we sell them**

**1. Internal tools + data migration**
From $10,000 · 21 days
We replace a SaaS tool you pay heavily for, or a process that runs on spreadsheets, with software your company owns. We move your data over and count every row before and after.
[See the details] → /services#internal-tools

**2. Code modernization**
$50,000 to $500,000 · fixed date in the written scope
We rewrite a legacy codebase and prove the new code behaves like the old: test pass rate, session replay, screenshot comparison, and cost per 1,000 lines, all in one report you can rerun.
[See the details] → /services#modernization

**3. AI integration**
Sold only inside offers 1 and 2
Agents and model features added to the system we build or modernize. When your data has to stay in-house, the models run on your own infrastructure.
[See the details] → /services#ai

We turn down standalone websites, consumer mobile apps and AI projects sold on their own.

*Pattern:* Mechanical Orchard's narrow offer list; Lab0's one-line-per-phase format applied to offers.

### Human/agent split

**2 signatures before anything ships**

**Agents** read your current tool, data and code. They write the new code, the tests and the data migration scripts, run every check after every change, and fix what fails.

**ayyayo engineers** agree the scope with you, decide what the software must do, read every change the agents make, plan the data move and run the switch-over.

**Your team** names one owner, answers our questions within [1 business day], tests the software in week 3, and signs the acceptance.

**Sign-off:** a named ayyayo engineer approves each release, and your named owner signs before anything goes live. Go-live needs both signatures.

*Pattern:* Foaster's one-paragraph agents-do / people-review statement, plus a named sign-off.

### Proof

**2 delivered systems, with their numbers**

**Document reader, US fintech.** Reads [document types] and returns [structured fields] for [client name, or "a US fintech" if unnamed]. It runs at about one tenth of the cost of Azure's equivalent service ([Azure service name]), at [N] documents a [month] and [accuracy figure].

**Tamil speech-to-speech voice system.** Ran a pilot of 10,000+ calls with Indian election officials in [state or district], [month and year]. [Outcome measured in the pilot.]

Neither project is an internal tool rebuild or a modernization. Both were delivered the way we deliver everything: a written scope, and a result measured in numbers.

*Pattern:* Perfectly's metrics-first proof, limited to the two projects we can show.

### Demo videos

**3 recordings, [length] each, unedited**

Layout: three columns on desktop, stacked on mobile. Each tile has a poster frame, a one-line caption, and the running time. Placed directly below Proof.

1. [Video 1: an internal tool rebuild, day 1 to day 21, screen recording with captions]
2. [Video 2: a verification report run end to end: pass rate, session replay, screenshot comparison]
3. [Video 3: the Tamil voice system on a recorded call, shared with consent]

*Pattern:* Mechanical Orchard's "see it work on code" emphasis, shown as recordings before any form.

### Call to action

**A written fixed price within 48 hours of a [30]-minute call**

You leave the call with a list of what we would rebuild, which data moves and how, the date it would go live, and the name of the ayyayo engineer who would sign it off. The written scope and price arrive within 48 hours.

[Book the call] → https://calendly.com/twa8239

*Pattern:* Mechanical Orchard's single closing CTA, with the visitor's takeaway stated as items.

---

## Services

### Page header

**3 offers. Each has a fixed price, a fixed date and a named owner.**

The same terms apply to all three:

- Written scope and fixed price within 48 hours of the first call.
- 50% advance. The balance is due on delivery, when your owner signs the acceptance.
- After delivery, an optional retainer: an annual contract with a 60-day notice period.

Want to resell or refer this work? See [Partners] → /partners

*Pattern:* Perfectly's terms-up-front launch format.

### 1. Internal tools + data migration {#internal-tools}

**Your [tool] replaced and your data moved in 21 days, from $10,000**

**Who it is for.** Mid-sized companies that pay [$X a year or more] for a SaaS tool, or run a core process on spreadsheets, and want to own the software instead.

**What we deliver.**
- The new application, deployed to [your cloud account / our managed hosting].
- Your data moved, with row counts and checksums for every table, before and after.
- The source code, in your repository.
- The verification harness and its final report, so you can rerun every check.
- A runbook for your team, plus [N] hours of handover training.

**Timeline.** 21 days, counted from the day the advance clears and we have access to your current tool.

**Price.** From $10,000, fixed in the written scope.

**After delivery.** A retainer of 30 to 50% of the monthly subscription you cancelled, billed monthly. It covers [hosting, fixes, and up to [N] small changes a month]. Annual contract, 60-day notice.

**What you provide.**
- Admin access to the current tool, or a full data export.
- A list of users, roles and the integrations the tool connects to.
- One named owner, available [2] hours a week.
- [3 to 5] staff to test the software in week 3.

If we miss day 21, you keep the balance.

*Pattern:* Lab0's phase-by-phase delivery list with Perfectly's outcome-tied payment.

### 2. Code modernization {#modernization}

**Legacy code rewritten and checked against 4 measures, $50,000 to $500,000**

**Who it is for.** Companies running a business system on [legacy stacks we support, e.g. COBOL, VB6, classic ASP, older Java or .NET] that their own team can no longer change safely.

**What we deliver.**
- The rewritten codebase in [target stack], in your repository.
- A verification report on four measures: the test pass rate against the old system's behaviour, session replays of real user flows, screenshot comparisons of every screen, and the cost per 1,000 lines.
- The harness that produced the report, so your team can rerun it.
- A switch-over plan with a parallel-run period of [N weeks].

**Timeline.** A fixed date, set in the written scope. [Typical range: N to N weeks.]

**Price.** $50,000 to $500,000, fixed per scope.

**After delivery.** A retainer of 10 to 15% of the project price per year, billed monthly. It includes a 5-business-day fix guarantee: any defect against the verified behaviour is fixed within 5 business days of your report. Annual contract, 60-day notice.

**What you provide.**
- Read access to the source code and the build.
- A test environment of the old system, or recorded sessions and sample data with sensitive fields masked.
- The existing test suite, if one exists.
- One named owner and one engineer who knows the current system.

**Where we are.** As of [date], we have completed [N] modernizations for clients. What we can show you today is the method, run in public on [name of open-source demo codebase], with its full report.

*Pattern:* Mechanical Orchard's verified-equivalence method, stated with our own four measures and our real volume.

### 3. AI integration {#ai}

**AI added inside offers 1 and 2, with 0 standalone AI projects**

**Who it is for.** Clients already in an internal tool or modernization engagement with us.

**What we deliver.**
- Agents for named tasks in the new system, for example [reading incoming documents, sorting requests].
- Model features inside the screens your team uses.
- Models running on your own infrastructure when your data has to stay there.
- A test set and a score for each feature, so you can see how often it is right.

**Timeline.** Inside the parent project's date, or [N] days added and written into the scope.

**Price.** Added to the parent project's fixed price. [Floor, if any.]

**After delivery.** AI operations retainer: model cost plus [X]% margin, billed monthly. Annual contract, 60-day notice.

**What you provide.**
- The documents or data the feature works on.
- [50] examples of correct outputs, so we can score the feature.
- Infrastructure access, if the models run on your systems.
- Your data-handling policy.

*Pattern:* Distyl's "people plus platform own the outcome", narrowed to an upsell with a measured score.

---

## How we work

### Page header

**4 stages, run on every engagement since [first engagement date]**

[Engine name] is our internal delivery system. Every engagement runs through it, and every engagement adds to it. We use it on client work only; it is never for sale.

*Pattern:* Mechanical Orchard's platform page; Distyl's Distillery as the internal system.

### The stages

**1. Map.** [Engine name] reads your current tool's data, screens and rules, or your codebase and its tests. Output: a written list of every screen, field, rule and integration. That list becomes the scope you approve.

**2. Build.** Agents write the new application, the data migration scripts and the tests against the approved list. Each change arrives as a separate, readable change for an ayyayo engineer to review.

**3. Verify.** The harness runs every check after every change: tests, session replays, screenshot comparisons, and row counts and checksums for migrated data. Anything that fails goes back to Build.

**4. Hand over.** We deploy, move the live data, and give you the code, the harness, its last report and a runbook. Your owner signs the acceptance.

[Confirm each stage describes what [engine name] does today. Remove any step it does by hand.]

*Pattern:* Mechanical Orchard's named-module structure, one input and one output per stage.

### Verification

**4 numbers in every verification report**

- **Test pass rate.** The share of the old system's tests, and of the tests we write from its recorded behaviour, that the new code passes.
- **Session replay.** Real user sessions recorded on the old system, replayed on the new one, with every difference listed.
- **Screenshot comparison.** Every screen captured on both systems and compared pixel by pixel, with differences highlighted.
- **Cost per 1,000 lines.** What the rewrite cost us in model and compute spend, per 1,000 lines of new code.

For data migrations, the report adds row counts and checksums per table, before and after the move.

You receive the harness with the code. Your team can rerun every check after we leave.

*Pattern:* Mechanical Orchard's "verify, then trust" loop, expressed as four named measures.

### The old way and ours

**Same software, 2 ways to buy it**

| | Typical time-and-materials project | ayyayo |
|---|---|---|
| Price | An estimate, billed by the hour, with change orders | One fixed price, in writing within 48 hours |
| Date | A range, revised as the work runs | 21 days for internal tools; a fixed date in the scope for modernization |
| Payment | Monthly invoices from week 1 | 50% to start, 50% on acceptance |
| Proof it works | Manual testing, signed off on a spreadsheet | A harness report you can rerun |
| Who pays for an overrun | You | ayyayo |
| What you own at the end | The code, sometimes | The code, the data, the harness and the runbook |

*Pattern:* Lab0 and Ontora's before-and-after contrast with the incumbent, set as a table.

### What each engagement adds

**[N] checks in [engine name] as of [date]**

Every engagement leaves new checks behind: a data format we had to handle, a screen layout we had to match, a migration edge case. They go into [engine name], so the next engagement starts with them.

*Pattern:* Distyl's Distillery idea of capturing what each engagement teaches.

---

## See it work on your system

### Page header

**1 workflow from your system, rebuilt and verified free in [10] business days**

Pick one workflow from the tool or codebase you want replaced. We run it through [engine name] and show you the result, the verification report, and a written price for the whole job.

*Pattern:* Mechanical Orchard's free PoC, scoped to a first replica plus a roadmap.

### What you get

**3 things at the end of [10] business days**

- A working version of one workflow, from screen to database, running in a test environment.
- The verification report for that workflow: tests, replays, screenshot comparisons and, if data moved, row counts.
- A written scope, fixed price and date for the full rebuild or modernization.

### What you bring

**2 calls of [30] minutes and 1 data sample**

- The one workflow you want to see working.
- A data export or sample, with sensitive fields masked. We sign your NDA first if you need one.
- For code: read access to the module that runs the workflow.
- Two [30]-minute calls with the person who runs that workflow today.

### What this is and isn't

**1 workflow, in a test environment, deleted after [30] days**

It is: a working slice built with the same method and checks as a paid engagement, and a fixed price you can hold us to.

It isn't: a full migration, a production deployment, or a consulting report.

Your data stays in [the test environment] and is deleted [30] days after we present the result, unless you sign the full engagement.

### Request form

**Request your free workflow: [9] fields, 2 minutes**

| Field | Type | Required |
|---|---|---|
| Full name | Text | Yes |
| Work email | Email | Yes |
| Company | Text | Yes |
| Country | Select: United States, United Kingdom, Australia, Western Europe, Other | Yes |
| What you want to replace | Select: A SaaS tool / A spreadsheet process / A legacy codebase | Yes |
| The tool or system, by name | Text | Yes |
| The one workflow to see working | Text area, 500 characters | Yes |
| Does the sample contain personal data? | Select: Yes / No / Unsure | Yes |
| Do you need an NDA first? | Yes / No | No |
| Annual cost of the current tool | Text | No |
| Consent | Checkbox: "ayyayo may use these details to reply to this request, as described in the [Privacy Notice]." | Yes |

Button: **Request the free workflow**
After submit: "Thank you. We reply within [1 business day] with a time for the first call."

*Pattern:* Mechanical Orchard's PoC request form, kept short.

---

## Partners

### Page header

**2 ways to work with us: white-label delivery, or [terms] per referral**

*Pattern:* Perfectly's terms-first offer format.

### For agencies

**Your client, your brand, our 21-day delivery**

When you have more client work than your team can take, we deliver it under your brand. You keep the client relationship and set your own price to the client. We work to the same fixed price, fixed date and verification report as our own engagements, and every deliverable carries your name.

- We sign your NDA and a [12]-month non-solicitation clause for your clients.
- You pay us 50% when your client's work starts and the balance on your client's acceptance.
- Our engineers join your client calls as your team, or stay out of them. You choose.

### For referrers

**[Terms] for each client you refer, paid the day their advance clears**

Accountants, consultants and software resellers who know a company that pays heavily for a SaaS tool, or runs on spreadsheets, can refer it to us. When the client signs and their 50% advance clears, we pay you [terms]. [Cap, if any.]

A referral counts when you register it with us before our first call with that company.

### Register a partner or referral

**[7] fields**

Your name · Your company · Your email · Partner type (Agency / Referrer) · Client company name (referrers) · What the client wants replaced or modernized · Consent checkbox linking the [Privacy Notice]

Button: **Register**

*Pattern:* Lab0's agency-delivery framing, with Perfectly's pay-when-it-lands timing.

---

## About

### Mission

**1 aim: software bought for a fixed price, on a fixed date**

ayyayo exists so that a mid-sized company can buy software the way it buys any fixed-price contract: one price, one date, and the balance paid when the work is accepted.

*Pattern:* Mechanical Orchard's single-sentence mission at the top of about-us.

### How the company is built

**Every engagement since [first engagement date] has run through [engine name]**

ayyayo is a small team of engineers working with agents. Agents write and check the code. Our engineers scope the work, review every change and sign off each release. What we learn on one engagement becomes a check or a step in [engine name], so the next client starts with it. As revenue grows, the extra work goes to [engine name], and the team stays small.

We sell remotely, in English, to companies in the United States, the United Kingdom, Australia and Western Europe.

*Pattern:* Distyl's people-plus-platform description, with the growth model stated plainly.

### Leadership

**1 leadership card**

> [Photo]
> **Ahmad Yoosuf**
> Founder and CEO
> Scopes every engagement and approves every release before it reaches a client.
> [LinkedIn]

*Pattern:* Mechanical Orchard's team cards: photo, name, title, one line of role.

### Entity and location

ayyayo Inc. is a Delaware corporation.
[Registered address, and operating location if different]

*Pattern:* Mechanical Orchard's footer-level entity statement.

---

## Careers

### Page header

**Interviews on real problems, with AI allowed at every stage**

We are a small team that delivers fixed-price software on fixed dates, with agents doing the writing and people doing the judging. We hire people who are good at the judging.

*Pattern:* Distyl careers' opening claim about how the company works.

### Who thrives here

**5 traits we hire for**

- You check AI output before you trust it, and you can say how you checked.
- You would rather own a date than estimate hours.
- You read other people's code, and agents' code, carefully and quickly.
- You write plainly to clients, including when the news is bad.
- You follow a client's data-handling rules on every task, including the dull ones.

### Who will find it hard here

**4 kinds of work we turn down**

- Leading a large team. Our teams stay small by design.
- Long research with no delivery date.
- Specialising in one layer while others handle the rest.
- Billing by the hour.

### How we interview

**[4] steps, about [2] weeks**

1. **A [30]-minute call** about the work you have shipped and how you checked it.
2. **A work sample** on a real, anonymised problem from our engagements. Use any AI tools you like. We judge how you check the output, how you steer the agent, and what you would ship. [Paid at $[X] / unpaid.]
3. **A review session** where you walk us through your sample and we change one requirement.
4. **A conversation with Ahmad Yoosuf**, Founder and CEO, about the role and its terms.

We set real problems, never puzzles.

### Open roles

**[N] open roles as of [date]**

- [Role title] · [Remote / location] · [Full-time / contract]
- [Role title] · [Remote / location] · [Full-time / contract]

Write to [careers@ayyayo.ai] with the role in the subject line and a link to work you have shipped.

*Pattern:* Distyl careers: traits, contrasts, AI-allowed real-problem interviews, a role list.

---

## Contact

### Page header

**A reply within [1 business day]**

**Book a [30]-minute call.** You leave with what we would rebuild, how your data moves, and a go-live date. The written price follows within 48 hours.
[Book the call] → https://calendly.com/twa8239

**Email.** [email]

### Short form

| Field | Type | Required |
|---|---|---|
| Full name | Text | Yes |
| Work email | Email | Yes |
| Company | Text | Yes |
| What you want to replace or modernize | Text | Yes |
| Message | Text area | No |
| Consent | Checkbox linking the [Privacy Notice] | Yes |

Button: **Send**

Agencies and referrers: see [Partners] → /partners

*Pattern:* Mechanical Orchard's contact pattern: calendar first, short form second.

---

## Footer

**Company:** Services · How we work · Products ↗ · About · Insights · Careers · Contact
**Legal:** Privacy Notice · Terms of Use · Cookie Policy · Security

Products ↗ opens [product URL] in a new tab (`target="_blank" rel="noopener"`).

©️ 2026 ayyayo Inc. All rights reserved.

*Pattern:* Mechanical Orchard's footer: nav repeated, legal links grouped, entity copyright line.

[Partners and See it work are absent from the footer as specified in the brief; they are reached from Services, Contact and the Home hero. Confirm, or add them to the footer.]
