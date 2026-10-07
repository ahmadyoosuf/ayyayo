> **Draft. Requires review by counsel before publishing.**
>
> **Rule for this page:** publish a line only if it is true on the day of publishing. Each line marked [confirm] is a practice ayyayo must confirm it follows today. Delete any line that is not yet true rather than softening it.

# Security

Last updated: [date]

## 1. Certifications

**ayyayo holds no security certifications as of [date].** We hold no SOC 2 report, no ISO 27001 certificate and no PCI DSS attestation. We will answer your security questionnaire in writing, and we will tell you what we can and cannot show.

## 2. Your code and data

- **You own what we build.** The source code, the verification harness and the runbook are delivered to your repository and belong to you once the balance is paid, as set out in the written agreement.
- **Your systems, where you need it.** When your data has to stay in-house, the software and any models run on your own infrastructure.
- **Signed data terms.** Before we touch personal data, we sign a data processing agreement with you. [confirm]
- **Least data.** We work from masked or sample data wherever the task allows, and ask for production data only for the final migration. [confirm]
- **Deletion.** At the end of an engagement, we delete your data from our systems within [30] days and confirm the deletion in writing. [confirm]

## 3. Access

- Access to client systems uses named accounts, one per person, with access removed at the end of the engagement. [confirm]
- Multi-factor authentication is required on our email, code hosting and cloud accounts. [confirm]
- Client credentials are stored in [password manager / secrets manager], never in code or chat. [confirm]

## 4. How we build

- Every change, including every change written by an agent, is reviewed by a named ayyayo engineer before it reaches you.
- Your named owner signs the acceptance before anything goes live.
- Every delivery includes a verification report, and the harness lets you rerun the checks yourself.
- Dependencies are scanned for known vulnerabilities before each release. [confirm, and name the tool]

## 5. AI models

- We list in the written scope which model providers will process your data. [confirm]
- We use model providers under terms that bar them from training on data we send. [confirm per provider: [providers]]
- Where you require it, models run on your own infrastructure and your data goes to no third-party model provider.

## 6. Our own systems

- Our work devices use full-disk encryption and automatic screen lock. [confirm]
- Our Site and client-facing tools are served over HTTPS only. [confirm]
- Our service providers: [hosting provider], [code hosting], [email], [password manager]. [confirm]

## 7. Incidents

If we learn of a security incident affecting your data, we will tell you within [72 hours] of confirming it, with what we know, what we have done, and what you should do. [confirm against client agreements]

## 8. Reporting a vulnerability

Email [security email] with a description and steps to reproduce. We will acknowledge your report within [3 business days]. Please give us reasonable time to fix the issue before disclosing it, and do not access or change data that is not yours while testing. We do not run a paid bug bounty. [confirm]
