# T1. Thesis

Insights post #1. Every page on the site follows from this.

---

## In 2026, writing the code is the inexpensive step. Proving it works sets the price.

A services company has always sold time. A client paid for people, and the company grew by hiring more of them. Revenue and headcount rose together because the work was writing code, and only people could write it.

In 2026 that link has broken. A model can produce a working first draft of most business software in hours, and the price of that draft falls every few months. [Our own generation cost today: $[X] per 1,000 lines.] A services company that starts this year and hires the way an agency hired in 2015 pays salaries for work a model now does, and passes that cost to the client as hours. We expect that company to lose to one that hires nobody for the writing.

The step that stayed expensive is knowing the new code is right. A model writes a thousand lines in minutes. Someone still has to show that those lines do what the old system did, handle the same edge cases, and move every record without loss. That checking is now the slow, costly part of delivery. Most firms still do it by hand, with testers clicking through screens and signing spreadsheets, so their timelines depend on how many testers they can staff.

We built ayyayo around that step. Every engagement runs through [engine name], our internal delivery system. It records what the existing system does, generates the replacement, and checks the replacement against the record: the tests the old system passes, replays of real user sessions, screenshot comparisons of every screen, and the cost of the work per 1,000 lines. When a check fails, the agents fix the code and run the checks again. When every check passes, a person reviews the result and decides whether it ships. [Engine name] keeps the checks from each engagement, so the next one starts with more of them.

This is why we can fix the price and the date. A time-and-materials quote exists because the vendor cannot say how long the work will take, and the client carries that uncertainty. Our uncertainty sits mostly in one question: does the new system match the old one? A harness that runs in hours answers that question, where a test team needs weeks, so we can size it before we start. We write the scope and the price within 48 hours of the first call, take 50% up front, and take the balance only when the client accepts delivery. For an internal tool and its data, delivery is 21 days. If we miss the date, the client keeps the balance. The risk that used to sit with the client now sits with us, and we accept it because we can measure it.

Quality without a large team rests on two rules. First, every claim we make about a delivery is a number the client can check: the pass rate, the replay results, the screenshot differences. The client receives the harness with the code and can run it on their own machines. Second, a named ayyayo engineer reviews every change before the client sees it, and the client's own named owner signs off before anything goes live. Agents do the writing and the repeated checking. People decide what the system must do, read what the agents produced, and answer for the result. A small team can carry that load because reviewing verified code takes a fraction of the time it takes to write it.

We refuse four kinds of work. We refuse hourly billing and day rates. We turn down standalone websites, consumer mobile apps, and general "AI solutions" projects. We sell AI only inside a rebuild or a modernization, and when a client's data has to stay in-house, the models run on the client's own infrastructure. And we claim no knowledge of a client's industry; we learn the process from the client's own data and the people who run it.

The last refusal is about ourselves. We keep the team the same size as revenue grows. When an engagement teaches us something, the lesson goes into [engine name] as a new check or a new step, and the next client gets it on day one. A firm that hires to grow sells its staff's time, and its margin shrinks as it scales. A firm that puts what it learns into its delivery system gets faster with each project at the same size. ayyayo started in 2026 to be the second kind.

---

## Three positioning lines

1. **Ratio:** Your [tool] rebuilt in 21 days for the price of [N] months of its subscription.
2. **Ratio:** A fixed price in 48 hours, delivery in 21 days, and 50% of the money held until you accept it.
3. **Negation:** No hourly rates, no change orders, and no balance due until the software passes your sign-off.

Recommendation: line 1 for the Home hero once [N] is confirmed from a real quote; line 3 for ads and outreach, where the reader is comparing vendors.
