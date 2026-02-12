## Functions to Contemplate if we were to build a Valhros CRM

Email integration

Calendar integration

GDrive integration

Security (EU/GDPR/AI Regs)

Mobile app to connect in (apple / android)

Mobile visualization / UI

Research on target

Insights on LP’s / targets / PE firms / Institutional investors (current news feed)

Ability to auto send key docs:

- NDA  
- Sanitized Fund intro doc based on geography

Key individuals (if firm)

Investments they have placed elsewhere

---

### Renewal Data:  1\. Contract Identity & Structure (Baseline Control)

These prevent ambiguity and renewal leakage.

* Contract ID (internal, immutable)  
* Legal Entity (Customer – full legal name)  
* Contracting Entity (your OpCo / Portfolio Company)  
* Product / SKU(s) covered  
* Master Agreement ID (if governed by MSA)  
* Order Form / SOW ID(s)  
* Contract Version / Amendment Count  
* Jurisdiction / Governing Law  
* Executed Date  
* Effective Date

2\. Term, Renewal & Notice Mechanics (Non-Negotiable)

These are the **highest-value fields** operationally.

* Initial Term Length (months)  
* Current Term Type  
  * Fixed  
  * Auto-renewing  
  * Evergreen  
* Renewal Length (months)  
* Auto-Renewal (Yes / No)  
* Renewal Cap / Price Increase Cap (%)  
* Non-Renewal Notice Period (days)  
* Non-Renewal Deadline (calculated date)  
* Termination for Convenience (Yes / No)  
* Termination for Cause (Yes / No)  
* Early Termination Penalty / Liquidated Damages  
* Survival Clauses Flag (Yes / No)

### 3\. Commercial & Cash Fields (What Actually Matters)

These fields power **forecast accuracy and renewal prioritization**.

* Contracted ARR  
* Billing Frequency (Monthly / Quarterly / Annual / Upfront)  
* Billing Method (Invoice / Auto-pay / Net terms)  
* Payment Terms (Net 15 / 30 / 45 / 60\)  
* Annual Price Escalator (%)  
* Discount Expiry Date  
* Minimum Commit (if usage-based)  
* True-Up Frequency  
* Currency  
* FX Exposure Flag

### 4\. Customer Dependency & Leverage Signals

These predict **renewal outcome before the conversation happens**.

* Product Criticality Score (1–5)  
* Workflow Embeddedness (Low / Medium / High)  
* Switching Cost Assessment (Low / Medium / High)  
* Customer Usage Trend (Up / Flat / Down)  
* License Utilization %  
* Support Ticket Volume (rolling 90 days)  
* Executive Sponsor Identified (Yes / No)  
* Economic Buyer Identified (Yes / No)

5\. Renewal Risk & Probability Scoring (Operational Edge)

This is where most CRMs fail—and where margin is won.

* Renewal Probability (%)  
* Renewal Risk Category  
  * Low  
  * Medium  
  * High  
  * Critical  
* Primary Renewal Risk Driver  
  * Price  
  * Usage  
  * Performance  
  * Budget  
  * Champion Loss  
  * Competitive Threat  
* Competitive Incumbent / Threat Identified  
* Last Renewal Outcome (Uplift / Flat / Concession)  
* Historical Renewal Behavior (On-time / Late / Escalated)

### 6\. Operational Ownership & Accountability

Ensures renewals don’t die in handoffs.

* Account Owner  
* Renewal Owner (may differ)  
* Legal Owner  
* Finance Owner  
* Renewal Playbook Assigned (Yes / No)  
* Renewal Strategy  
  * Defend  
  * Expand  
  * Concede  
  * Exit  
* Escalation Required Flag  
* Exec Touch Required (Yes / No)

### 7\. Renewal Timeline & Engagement Tracking

This enforces **discipline months before renewal**.

* Renewal Target Date  
* Internal Renewal Review Date (e.g., T-120)  
* Customer Renewal Discussion Date  
* Proposal Sent Date  
* Customer Decision Date  
* Final Signature Date  
* Renewal Outcome  
  * Renewed  
  * Expanded  
  * Down-sell  
  * Churned

### 8\. Legal & Risk Constraints (Avoid Silent Margin Killers)

These stop bad renewals from compounding.

* Most Favored Nation (MFN) Clause (Yes / No)  
* Audit Rights (Yes / No)  
* SLA Credits Exposure (%)  
* Liability Cap (x Fees)  
* Data Residency / Regulatory Constraints  
* Assignment Restrictions (Yes / No)  
* Change of Control Restrictions (Yes / No)

9\. AI-Ready Derived Fields (Do Not Store Manually)

These should be **computed**, not entered.

* Days to Non-Renewal Deadline  
* Renewal Risk Delta (90-day change)  
* Revenue at Risk (Next 12 months)  
* Cash Certainty Score  
* Renewal Priority Rank  
* Predicted Renewal Outcome (model)

### 10\. Minimum Viable Renewal Dataset (If You’re Enforcing Discipline)

If you had to enforce a hard floor across Portfolio Companies:

* Contracted ARR  
* Renewal Date  
* Non-Renewal Deadline  
* Auto-Renewal Flag  
* Renewal Probability  
* Product Criticality  
* Renewal Owner  
* Revenue at Risk

\*\* ‘Top things to do today’ system..

---

\- Portfolio Intelligence  
\- Relationship Monopoly  
\- Automated Decision Infrastructure

---

11\. Portfolio-Wide Pattern Detection \+ Playbook Engine

The CRM acts as a real-time **cross-portfolio brain**. It continuously scans renewal, contract, usage, pricing, and customer behavior across *all* OpCos and constantly answers the question of “What’s happening across all our companies that we should act on *before* it becomes obvious?”. It surfaces things like:

* “This renewal risk pattern looks identical to the churn event we saw at Org ‘X’ last year.”  
* “Price concessions are clustering in healthcare accounts across 3 portfolio companies.”  
* “This customer is quietly downgrading across multiple vendors.”

Then as opposed to just presenting the data, it actions it:

* Auto-assigns the right renewal playbook  
* Triggers escalation workflows  
* Recommends specific negotiation levers based on historical wins

Now we get **portfolio-level learning loops \+ action** instead of siloed account management.

---

# 12\. Relationship \+ Influence Graph Across LPs, Targets, Execs, Buyers

Instead of static contact lists, we build a **living network map**, so we can always answer and leverage "Who actually knows who, and where do we have unfair access?” The graph/network map connects:

* LPs → fund commitments → board seats  
* Target CEOs → past exits → shared advisors  
* Customers → procurement buyers → competitor incumbents  
* Portfolio execs → shared vendors → cross-sell paths

Then additionally to knowing this information, the living map/network generates:

* Warm intro paths automatically suggested  
* “Hidden champions” flagged (strong internal sponsor leaving)  
* Board-level relationship strength scoring  
* Institutional memory preserved when partners change

Deal origination \+ renewal defense \+ fundraising all become graph-driven. Salesforce can’t do this but our PE-native CRM absolutely could

---

13\. Live Quality of Revenue (QoR) Engine

Instead of QoR being done **at a moment in time** (eg: upon an acquisition) that usually sits in a spreadsheet we could always have a real-time answer to the question “What portion of our revenue is actually durable?”

This is done by the CRM continuously computing a **Live QoR Score** at:

* customer level  
* product level  
* OpCo level  
* portfolio level

### It computes the score by ingesting:

* Renewal mechanics (auto-renew vs opt-in)  
* Customer dependency scores  
* Price escalators & discount decay  
* MFNs / audit rights / termination clauses  
* Usage volatility  
* Renewal concession history

### With this it could then generate:

* QoR trend over time  
* Revenue fragility map  
* “Hidden concentration risk” alerts  
* IC-ready QoR narrative (not just a score)

---

# 14\. Executive Intervention Radar

As we grow and get to the pointy end of our acquisition volume over the course of Fund 1, something that will become increasingly important is figuring out when and where leadership needs to either get involved or step in *before* revenue is lost?” It’s easy to show up too late when we could have a chance to influence and this would fix that. We don’t want to rely on AM’s raising these opportunities.

### Exec intervention radar would track signals like:

* Champion attrition (LinkedIn \+ email inactivity)  
* Usage drop among top-tier accounts  
* Escalating support tickets  
* Procurement involvement spike  
* Renewal sentiment decay

Then as opposed to just tracking the signals, it then actions it:

* Flags accounts needing exec touch  
* Suggests *which* exec is best positioned  
* Generates tailored outreach context  
* Tracks impact of intervention

Exec time then becomes targeted leverage, not random check-ins, and/or only brought up upon someone asking for it (which lets be honest most AM folks won’t want to do, even when they probably should).

---

