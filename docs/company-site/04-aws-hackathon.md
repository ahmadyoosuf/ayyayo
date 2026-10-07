# T4. WeMakeDevs x AWS "Environmental Hacks", build day at DTU, Delhi

Saturday 10 October 2026, 8 AM to 8 PM IST. The online hackathon runs 8 to 11 October.

## Eligibility flag (read first)

The published rules limit entry to **university students in India aged 18 or over**. Each entrant needs a WeMakeDevs account and an **AWS Builder Center profile with university enrolment verified** (verification runs through SheerID). Teams of 1 to 4, and **each team member must qualify on their own**.

What this means for ayyayo:
- Unless Ahmad is currently an enrolled university student in India [confirm], he cannot enter or be listed on a competing team. A team of students with Ahmad on it would fail the rule.
- Prizes and the Amazon fast-track interview are for students. Neither is our goal.
- Routes that fit the goal (an introduction to an AWS Partner Development Manager):
  1. Attend the in-person build day as a guest. The event page ("Bharat Builds Delhi: Meet the Amazon Team") lists AWS mentors on the floor, workshops by AWS engineers, and an AWS team flying in from the USA. [Confirm on luma.com/env whether non-student registration is accepted, and register now: seats are first come, first served.]
  2. Volunteer as a judge or mentor. WeMakeDevs posted a public call for judges, with online judging from Sunday 11 October, 8 PM. Judges are named and meet the organisers and AWS staff.
  3. Build the demo below on our own time and AWS credits, as ayyayo's public demo migration, and show it to AWS staff on the floor. It is case-study route 2 from the APN plan whether or not the hackathon accepts it.

Expect the AWS people at a student event to be developer-relations and Builder Center staff (for example Arko Duti Saha, who gives the "Why Builders Win" talk), and few or no Partner Development Managers. The ask to them is a name: "Who is the PDM for new services partners in India?"

Sources: [wemakedevs.org/aws/env](https://www.wemakedevs.org/aws/env), [rules](https://www.wemakedevs.org/aws/env/rules), [luma.com/env](https://luma.com/env), [WeMakeDevs on X](https://x.com/WeMakeDevs/status/2107114262414213246). The environment's network policy blocked direct reads of these pages; facts above come from search excerpts and need a check on the live pages.

## Background: the APN route

MAP funding needs the Migration and Modernization Competency at Advanced or Premier tier. The route:
1. Enrol in the APN Services Path. [Status: enrolled / not yet]
2. Build one verifiable case study: a subcontract under an NCR migration partner, or a public demo migration of an open-source legacy codebase, run on our AWS credits with the four-measure verification protocol.
3. Get the PDM introduction.

The build below is step 2's second option.

## Build idea: SWMM's infiltration engine, rewritten and proven equal

**Theme fit.** Track: Heat and Water. Delhi floods every monsoon. The US EPA's Storm Water Management Model (SWMM 5) is the standard open-source tool for modelling urban runoff and drainage. It is public domain, with a C engine and a Delphi desktop interface: a real legacy codebase in daily use.

**What we build in 12 hours.**
1. Take one self-contained module of the SWMM 5 C engine: the infiltration routines (Horton, Green-Ampt, curve number). [Confirm module and line count from the repo: github.com/usepa/stormwater-management-model.]
2. Run it through [engine name]: Map the module's inputs, outputs and edge cases; Build a rewrite in [Python / TypeScript] with agents; Verify it against the original C.
3. Deploy the rewrite on AWS as a small API ([AWS Lambda + API Gateway], or [Fargate]), and put a one-page map in front of it showing runoff for [one Delhi ward or catchment] under a [50 mm] rainfall event.

**The verification report (the part that matters to AWS).**
- **Test pass rate:** SWMM's bundled example models run through both engines; the share whose infiltration results match within [tolerance].
- **Session replay:** [N] recorded input sequences from the C engine replayed against the rewrite, with every difference listed.
- **Screenshot comparison:** the runoff chart rendered from both engines' outputs and compared pixel by pixel.
- **Cost per 1,000 lines:** our model and AWS compute spend for the rewrite, divided by lines produced.

**Deliverable.** A public GitHub repository with the rewrite, the harness, the report and the AWS deployment, plus a one-page write-up. This is the "public demo migration" case study, and it is honest about its size: one module, one day.

## 30-second spoken intro (about 75 words)

"Hi, I'm Ahmad Yoosuf, founder of ayyayo, a Delaware company. We rewrite legacy code and prove the new code behaves like the old one, with numbers: test pass rate, replayed sessions, screenshot comparisons, and cost per thousand lines. Today we took the US EPA's storm-water model, rewrote its infiltration engine, and ran it on AWS with the full report. We're joining the APN Services Path. Who should I talk to about the Migration and Modernization Competency?"

## 5 questions for AWS staff

1. For a new services partner with no launched opportunities yet, does a public demo migration of an open-source codebase count as one of the customer references the Migration and Modernization Competency requires, or must every reference be a named, paying customer?
2. If we deliver as a subcontractor to an NCR-based migration partner, can that project count toward our own competency as well as theirs, and what evidence does AWS accept from the subcontractor: an ACE opportunity, a customer letter, or the prime partner's confirmation?
3. Our company is a Delaware corporation and we sell to customers in the US, UK, Australia and Western Europe, with delivery from India. Is our PDM assigned by our headquarters country, our delivery country, or our customers' region?
4. Can a partner below Advanced tier take part in MAP-funded work by co-selling with an Advanced partner, and how is the funding split in that case?
5. Will the competency's technical validation accept our own verification report (test pass rate, session replay, screenshot comparison, cost per 1,000 lines) as evidence, or does it expect AWS Transform or another AWS tool to be used in the migration?

## Follow-up message (send within 24 hours)

Subject: Yesterday at DTU: verified modernization, and the PDM introduction

Hi [name],

Thank you for the time at the Bharat Builds build day at DTU on Saturday. [Specific line on what they said, e.g. "Your point on ACE opportunities for subcontracted work was the one we needed."]

As promised, here is the demo: [repo link]. We rewrote the infiltration engine of the US EPA's SWMM 5 and verified it against the original C: [X]% test pass rate, [N] replayed sequences, screenshot comparison, and $[X] per 1,000 lines, all running on AWS.

Would you introduce me to the Partner Development Manager who covers new services partners for [India / our region]? A two-line email is enough, and I will take it from there.

Ahmad Yoosuf
Founder and CEO, ayyayo Inc.
[email] · https://calendly.com/twa8239
