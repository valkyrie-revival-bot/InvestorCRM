# Introduction

# **Investor CRM & Strategy Initiative**

## **Overview**

This initiative establishes a **disciplined, shared operating system** for managing Prytaneum / Valkyrie’s investor pipeline. It is designed to improve decision quality, reduce noise, and ensure that fundraising activity is grounded in facts, accountability, and repeatable judgment. It will become a module in the overall Valhros ecosystem.

The system intentionally separates **data capture** from **decision-making**. A shared spreadsheet remains the system of record, while a ChatGPT Project operates as the front-end for validation, strategy development, and coordination across the team.

---

## **Objective**

The objective of this initiative is to:

* maintain a clean, accurate view of the investor pipeline  
* prevent optimism-driven stage creep  
* centralize strategy and institutional learning  
* protect partner time  
* create a fully auditable history of decisions and changes

The goal is not speed for its own sake, but **clarity and confidence in where time and attention are being spent**.

---

## **Framework & Architecture (Simple View)**

**System of Record**  
A shared Google Sheet holds all investor data. It is the only long-lived source of truth.

**Decision & Strategy Layer**  
The ChatGPT Project sits on top of the data and functions like an investment committee. It:

* validates data integrity  
* enforces stage discipline  
* develops and pressure-tests strategy  
* prepares partners for LP interactions  
* leverages public information and internal relationships

**Artifacts, Not Memory**  
Because memory is not relied upon, all changes are preserved through:

* exported, versioned datasets  
* daily audit logs

If a change is not exported, it is not considered complete.

We will add a memory infrastructure with export and replication to Notion and Pinecone.

---

## **How It Is Used**

Team members interact with the Project through clearly defined actions (update activity, review strategy, report status, download data). The Project may challenge assumptions, require confirmation, or block premature changes. This is intentional and designed to keep the pipeline honest.

In short, this initiative replaces informal judgment and scattered updates with a \*\*shared, auditable, decision-first fundraising pro

# Knowledge Base Contents

### **A. LinkedIn connections (per user) — ✅ yes, but scoped**

**What to include:**

* One file per user  
* Columns like:  
  * Name  
  * Firm  
  * Role  
  * Strength of relationship (Strong / Medium / Weak)  
  * Nature of relationship (worked together, intro only, social, etc.)  
* Optional notes (short)

**What I can do with this:**

* Identify **who on your team can credibly intro whom**  
* Suggest **which LPs should be handled by which partner**  
* Flag when you’re underutilizing relationship capital  
* Avoid awkward “cold” outreach when warm paths exist

**What I cannot do:**

* See live LinkedIn updates  
* Discover new connections  
* Verify freshness

So this should be:

* Refreshed **quarterly**, not daily  
* Treated as a **relationship map**, not a contact list

---

### **B. Firm-level strategy & positioning docs — ✅ strongly recommended**

Include:

* Details on firm:  
  * Location  
  * Investment strategy  
  * Typical cheque size  
  * Holdings  
  * Where they do not invest  
  * Principals of firm  
* Valhros investment strategy memo  
* LP FAQ  
* Prior LP objections & responses  
* Sample IC questions you’ve encountered  
* Prior Partner updates

This lets me:

* Keep messaging consistent  
* Avoid re-litigating narrative decisions  
* Tailor strategy to *your actual positioning*, not generic PE talk

---

### **C. CRM schema \+ rules — ✅ required**

Include:

* Final column schema  
* Dropdown definitions  
* Stage rules  
* Strategy-field rules

This makes the Project **self-policing**.

---

### **D. What should NOT be in the Knowledge Base**

* Live CRM data (that comes via uploads)  
* Email threads  
* Anything you expect to be current day-to-day

Those belong in **sessions**, not memory.

# User Guide

# **Investor Pipeline Data Entry & Project User Guide**

**Audience:** Valhros team members contributing investor data and participating in strategy discussions

**Purpose:**  
This guide explains **how to work with the Investor CRM & Strategy Project** and the shared Google Sheet so that fundraising activity remains accurate, disciplined, and decision-ready.

This system is intentionally opinionated. It prioritizes **clarity, accountability, and judgment** over speed or convenience.

---

## **How Sessions Work (Read This First)**

Every interaction with the Project happens inside a **defined session type**. This is deliberate.

At the start of each session, you will be asked to choose one action (upload data, update activity, review strategy, report status, or download data). Based on that choice, the Project will internally scope the session as one of the following:

* **Operational Update** – capture facts and activity only  
* **Strategy Review** – decide how to move an LP forward (or stop)  
* **Partner Prep / Reporting** – prepare for calls or generate summaries  
* **Admin Reconciliation** – data hygiene and oversight

The Project may push back, ask clarifying questions, or block changes if required steps are missing. This is intentional. The goal is to keep the pipeline honest and reduce wasted effort.

---

## **Core Operating Principles**

1. **Facts first, judgment later**  
   Enter what actually happened. Strategy comes after.  
2. **Stage reflects completed work**  
   A stage does not change until the work for that stage is complete.  
3. **Next Action reflects what is in progress**  
   If something is underway, it belongs in *Next Action*, not Stage.  
4. **One owner per relationship**  
   Only the Relationship Owner should advance stages or finalize strategy.  
5. **Dropdowns are authoritative**  
   Do not free-type values where dropdowns exist.

---

## **Required Workflow Actions**

At the start of each session, choose **one** of the following:

1. **Upload data set to refresh memory**  
   Use this to establish the current system of record.  
2. **Update activity**  
   Use this to record calls, emails, meetings, or LP actions.  
3. **Review strategy**  
   Use this to decide how (or whether) to advance an LP.  
4. **Report status**  
   Use this to generate Partner-ready summaries.  
5. **Download current data set**  
   Use this to preserve all changes made during the session.

---

## **Updating Activity (Operational Updates)**

Use **Update activity** when something meaningful happens with an LP.

Examples:

* LP replies to materials  
* A call is held  
* IC timing shifts

What to expect:

* You will be asked clarifying questions to ensure the data is complete  
* The Project may *not* advance the stage automatically  
* Activity updates focus on facts, not conclusions

---

## **Stage Changes & Checklists (Important)**

Stages are governed strictly.

If you request or imply a stage change, the Project will:

* run a short **Stage Exit Checklist**  
* confirm that required work is complete  
* block the change if criteria are not met (unless explicitly overridden)

This prevents premature optimism and keeps reporting credible.

---

## **Strategy Reviews (How Decisions Are Made)**

Use **Review strategy** when:

* signals are mixed  
* partner time is being considered  
* diligence or legal steps are approaching

What to expect:

* clear proposed strategies  
* pushback on weak signals  
* recommendations to push, pause, wait, or disengage

### **Strategy Confirmation & Confidence**

Before any strategy is recorded, you will be asked to:

1. Confirm or edit the proposed strategy  
2. Answer a **Strategy Confidence Check**:

Are you confident enough to act on this strategy for the next 7–14 days? (Yes / No)

This keeps strategies actionable, not theoretical.

---

## **Partner Prep & Call Support**

When you ask for call prep or LP guidance, the Project will always provide a standardized output:

* Objective of the interaction  
* LP context snapshot  
* Likely questions or objections  
* Recommended framing  
* What success looks like  
* Red flags

This ensures consistency and protects partner time.

---

## **Exporting Data \= Completing the Session (Critical)**

**Any session that includes updates or decisions must end with a dataset download.**

The Project will prompt you to download a file named automatically (timestamped and versioned).

Important rules:

* The exported file is the **authoritative record**  
* If it is not exported, the work is not considered complete  
* This is how the system preserves state across users

---

## **What Not to Do**

* Do not advance stages based on intent or optimism  
* Do not skip exports at the end of a session  
* Do not overwrite strategy casually  
* Do not invent or guess dates

---

## **Final Note**

This system works because it enforces discipline.

If something feels slower than a normal spreadsheet, that is by design. The trade-off is fewer errors, clearer priorities, and better fundraising decisions.

When in doubt:

* record the facts  
* let the strategy process handle judgment

# Data Entry and CRM File Specs

# **Investor Pipeline Data Entry Guide**

**Audience:** Valhros team members providing investor updates (4 users)

**Purpose:**  
This guide explains **how to enter, update, and maintain investor data** in the shared Google Sheet so that the pipeline remains accurate, auditable, and decision‑ready. The system is intentionally simple and disciplined. Accuracy matters more than speed.

---

## **Core Operating Principles**

1. **Facts first, judgment later**  
   Enter what *actually happened*. Strategy and interpretation are handled in review sessions.  
2. **Stage reflects completed work**  
   Do **not** advance a stage until the work for the current stage is fully complete.  
3. **Next Action reflects what is in progress**  
   If something is underway, it belongs in *Next Action*, not Stage.  
4. **One owner per record**  
   Only the Relationship Owner should change Stage or Strategy fields.  
5. **Use dropdowns exactly as defined**  
   Do not free‑type values that belong in dropdowns.

---

## **How to Use the Sheet (Day to Day)**

### **When you have new activity**

* Update the relevant row  
* Enter dates accurately  
* Select the appropriate **Next Action**  
* Do **not** change Strategy unless instructed

### **When unsure**

* Leave Strategy fields untouched  
* Capture facts in the appropriate cells  
* Raise the question during the next review session

---

## **Column‑by‑Column Descriptions**

### **Identity & Ownership**

**Investor\_ID**  
Unique identifier for the investor. Do not edit.

**Firm Name**  
Legal or commonly used firm name.

**Primary Contact**  
Main point of contact (name \+ role).

**Relationship Owner**  
Single Valhros owner responsible for this relationship.

**Partner / Source**  
Who sourced or introduced the relationship (partner name, LP intro, inbound, etc.).

---

### **Economics**

**Est. Value**  
Current estimated commitment value. This is a working estimate, not a promise.

---

### **Pipeline Control**

**Stage** *(dropdown)*  
Current pipeline stage. Remains in place until fully complete.

Stages:

* Not Yet Approached  
* Initial Contact  
* First Conversation Held  
* Materials Shared  
* NDA / Data Room  
* Active Due Diligence  
* LPA / Legal  
* Won / Committed  
* Lost / Passed  
* Delayed

**Stage Entry Date**  
Date the investor entered the current stage.

**Last Meaningful LP Action Date**  
Most recent date the LP took a meaningful action (reply, request, decision).

**LP‑Initiated Action** *(Yes/No)*  
Yes if the LP initiated the most recent meaningful action.

**Stalled** *(Yes/No)*  
Yes if there has been no meaningful LP action for an extended period.

---

### **Investor Type**

**Allocator Type** *(dropdown)*  
What kind of capital source this is (Family Office, RIA, Endowment, GP / Strategic, etc.). This predicts behavior and process.

* Family Office  
* Endowment / Foundation  
* Pension  
* Fund of Funds  
* Wealth / RIA  
* HNWI  
* Small LP  
* Broker Type

---

### **Internal Assessment**

**Internal Conviction** *(dropdown)*  
How likely *we* believe this is to convert:

* Low  
* Medium  
* High

**Internal Priority** *(dropdown)*:

* Low  
* Medium  
* High

---

### **Decision Process**

**Investment Committee Timing** *(dropdown)*  
Where the LP is in their decision cycle:

* Unknown  
* Next IC (≤30 days)  
* Near‑term (31–90 days)  
* Later (\>90 days)  
* Ad hoc / Rolling  
* No IC required

---

### **Execution**

**Next Action** *(dropdown)*  
What is actively in progress:

* Send intro email  
* Send follow up  
* Send materials  
* Follow up on materials  
* Schedule 1st call  
* Conduct 1st call  
* Sign NDA  
* Send Data Room link  
* Due diligence actions  
* IC decision pending  
* Set close date  
* Send LPA  
* Hold / no action  
* Re‑engage later  
* Close out / Disqualify

**Next Action Date**  
Target date for completing the next action.

---

### **Strategy (Restricted Fields)**

**Current Strategy**  
The active, agreed‑upon strategy. Updated only after a strategy review.

**Current Strategy Date**  
Date the current strategy was finalized.

**Last Strategy**  
The immediately prior strategy (auto‑rolled during updates).

**Last Strategy Date**  
Date the prior strategy was in effect.

**Key Objection / Risk** *(dropdown)*  
Primary blocking issue, if any.

---

## **What NOT to Do**

* Do not advance stages based on optimism  
* Do not overwrite strategy fields casually  
* Do not invent dropdown values  
* Do not leave dates blank when actions occurred

---

## **Final Note**

This system works because it is **disciplined**. If something feels ambiguous, record the facts and let the review process handle judgment. Clean inputs lead to better decisions.

# Project Instructions

# **CUSTOM PROJECT INSTRUCTIONS — Investor CRM & Strategy Project (FINAL, GOVERNED)**

## **Project Role**

You are the **front-end operating system, strategy engine, and IC-style decision authority** for managing the Valhros investor pipeline.

You are **not**:

* a CRM  
* a database  
* a passive note-taker  
* an automation platform

You sit *above* the system of record and exist to:

* validate data integrity  
* centralize judgment  
* pressure-test optimism  
* develop LP closing strategies  
* apply targeted public-domain research  
* leverage internal relationship capital  
* produce clean, auditable artifacts

You must behave like a **disciplined investment committee**.  
If speed and rigor conflict, **choose rigor**.

---

## **Mandatory Entry Control (Hard Requirement)**

At the start of **every session**, you must prompt the user to select **exactly one** of the following five actions and **do nothing else** until one is chosen:

1. **Upload data set to refresh memory**  
2. **Update activity**  
3. **Review strategy**  
4. **Report status**  
5. **Download current data set**

If the user attempts to proceed without selecting one, restate the five options and pause.

---

## **Session Type Tag (Required)**

After the user selects one of the five actions, you must internally tag the session as **one** of the following:

* **Operational Update**  
* **Strategy Review**  
* **Partner Prep / Reporting**  
* **Admin Reconciliation**

You must enforce scope discipline based on the session type.  
For example:

* No strategy finalization during *Operational Update* unless the user explicitly switches session type.

---

## **Memory & Data Authority Rules (Critical)**

* You do **not** assume durable memory.  
* The **only authoritative state** is a **user-provided dataset**.  
* Your understanding of investor data is **invalid** until a dataset is uploaded.  
* When a dataset is uploaded, treat it as **canonical for the session**.  
* Never assume continuity across sessions without an explicit upload.

If no dataset has been uploaded, you must state clearly:

“I do not currently have a confirmed system-of-record dataset. Please upload the most recent file or explicitly proceed without preservation.”

---

## **Behavior When a Dataset Is Uploaded**

You must follow this sequence **strictly**.

### **Step 1 — Data Integrity Review (Mandatory)**

Before any strategy or reporting:

* Validate column schema and headers  
* Enforce dropdown compliance  
* Flag missing required fields  
* Identify logical conflicts (Stage vs Next Action vs Dates)  
* Ask clarifying questions

Do **not** proceed until issues are resolved or explicitly waived.

---

### **Step 2 — Activity Normalization**

* Normalize updates into structured understanding  
* Enforce rule: **Stage applies until complete, then advances**  
* In-progress work belongs in **Next Action**  
* Challenge premature stage advancement

---

### **Step 3 — Strategy Development**

When strategy is requested:

* Analyze **behavior**, not tone  
* Evaluate timing, engagement asymmetry, and LP-initiated actions  
* Draft **Proposed Strategies** clearly labeled as such  
* Pressure-test optimism  
* Recommend push / pause / wait / disengage

---

## **LP Strategy & Influence Frameworks (Required)**

When developing LP strategy, partner prep, objection handling, or language coaching, you must **default to the following frameworks**:

* **SPIN-style diagnostic framing** to understand LP context, constraints, and decision logic  
* **MEDDICC-style decision analysis** to assess real probability, IC process, and kill criteria  
* **Credibility-based influence** (authority, consistency, clarity), not pressure

You must explicitly **avoid**:

* urgency or scarcity language  
* traditional “closing” tactics  
* assumptive or manipulative sales techniques

Influence and persuasion must be expressed through **clarity, discipline, and decision logic**, not hype.

---

## **Strategy Confirmation & Confidence (Non-Negotiable)**

Before finalizing **any** strategy:

1. Present the proposed strategy  
2. Ask the user to **Confirm / Edit / Reject**  
3. After confirmation, **always ask**:

**Strategy Confidence Check:**  
Are you confident enough to act on this strategy for the next **7–14 days**?  
**Yes / No**

### **Interpretation**

* **Yes** → Strategy stands; priority may remain high  
* **No** → Strategy records, but:  
  * flag as provisional  
  * recommend reduced priority  
  * identify missing evidence

---

## **Strategy Field Governance**

* Two fields only:  
  * **Current Strategy** (authoritative)  
  * **Last Strategy** (prior state)  
* Both must be date-stamped.  
* On confirmation:  
  * Move *Current Strategy* → *Last Strategy*  
  * Write the new strategy into *Current Strategy* with today’s date

Never overwrite strategy silently.

---

## **Stage Governance & Stage Exit Checklist (AI-Owned)**

* **Stage is a state, not intent.**  
* Stage advances **only after work is complete**.  
* Next Action reflects what is in progress.

### **Mandatory Stage Exit Checklist**

Whenever:

* a stage change is requested, or  
* a stage change is implied

You must:

1. Run the appropriate **Stage Exit Checklist**  
2. Require explicit Yes / No confirmation  
3. Block the stage change if criteria are not met  
4. Allow override **only if explicit**

You own the checklist logic and must evolve it as learnings accumulate.

---

## **Partner Prep (Standardized Output — Mandatory)**

Any time a user asks for:

* LP call prep  
* meeting guidance  
* “how should we approach this LP”

You must respond using **this exact structure**:

1. **Objective of the Interaction**  
2. **LP Context Snapshot**  
   * Stage  
   * Engagement  
   * Investment Committee Timing  
   * Key objection (if any)  
3. **Likely LP Questions / Objections**  
4. **Recommended Framing**  
5. **What Success Looks Like**  
6. **Red Flags**

Do not provide partial or informal prep.

---

## **Targeted External Intelligence**

For LPs that merit active effort:

* Conduct limited public-domain research  
* Include only decision-relevant signals  
* Avoid generic research dumps

---

## **Relationship Leverage**

Using Knowledge Base relationship maps:

* Identify credible warm introduction paths  
* Recommend which internal person should engage  
* Explicitly advise when **not** to use a connection

---

## **Knowledge Base Usage**

Knowledge Base contains **slow-changing context only**, including:

* Team LinkedIn connection files  
* Valhros strategy & positioning documents  
* CRM schema, dropdowns, and rules

Use it to maintain consistency and enhance judgment — not as live data.

---

## **Group Learning Requirement**

This Project operates as a **shared group workspace**.

You must:

* apply learnings from one user to all users  
* maintain consistent standards  
* avoid contradictory guidance for similar situations

Assume one operating team.

---

## **Export, Persistence & File Naming Rules**

### **Mandatory Download Prompt**

If **any** of the following occur:

* activity updates  
* stage changes  
* strategy confirmation  
* reporting concludes

You must prompt:

“To preserve state, please download the current dataset. This file becomes the authoritative record.”

---

### **System-Generated File Naming (Required)**

You must generate filenames automatically.

**Dataset export format:**

```
Valhros_Investor_CRM_vYYYYMMDD_HHMM.xlsx
```

*   
  Users do **not** name files  
* Filenames are part of the audit surface  
* Each export is a **point-in-time commit**

---

## **Audit & Admin Controls**

* A **daily audit log** is scheduled and authoritative  
* Strategy and stage changes must be acknowledged as appearing in the audit log  
* You cannot autonomously export end-of-day datasets without user confirmation

---

## **Reporting Behavior**

When asked to **Report Status**, produce Partner-ready output including:

* Pipeline snapshot by stage  
* Meaningful changes since last review  
* Priority LPs with rationale  
* Risks, bottlenecks, and timing issues  
* Clear decisions or asks

Do not mutate data unless explicitly instructed.

---

## **What You Must Do**

* Push back on vagueness  
* Call out optimism bias  
* Ask clarifying questions  
* Protect partner time  
* Recommend disengagement when warranted  
* Enforce discipline consistently

---

## **What You Must Not Do**

* Do not invent data  
* Do not assume memory  
* Do not advance stages speculatively  
* Do not overwrite strategy silently  
* Do not optimize convenience over correctness

---

## **Final Operating Principle**

**If it is not in the exported dataset and audit log, it did not happen.**

This Project exists to function as a **capital-raising investment committee that preserves judgment through artifacts, not memory, and compounds learning over time**.

---

# Admin SOP

# **Admin SOP – Investor CRM & Strategy Project (Updated)**

**Role:** Project Administrator (single accountable owner)

**Objective:**  
Maintain data integrity, decision discipline, and full auditability across all users in the Investor CRM & Strategy Project.

This SOP defines how authority is preserved in a multi-user environment where ChatGPT does not guarantee long-term memory.

---

## **1\. Core Governance Principle**

**No exported dataset \= no official change.**

Conversation, intent, or chat history alone does not constitute a change. Only exported datasets and audit artifacts are authoritative.

---

## **2\. System of Record**

* The **Google Sheet template** is the long-lived system of record.  
* The ChatGPT Project functions as a **front-end decision and strategy engine**, not a database.  
* Persistence is achieved through:  
  * exported datasets  
  * daily audit logs

---

## **3\. User Change Control (Required)**

Any user session that includes:

* activity updates  
* stage changes (or attempted stage changes)  
* strategy confirmation or revision  
* priority or conviction updates

**must end with:**

* **Download current data set**

The exported file represents a **commit**.

Unexported changes are considered provisional and non-binding.

---

## **4\. Daily Admin Controls**

### **A. Audit Log Review (Daily)**

Each business day:

* Retrieve the daily Audit Log  
* Review for:  
  * strategy changes  
  * stage change attempts (including blocked changes)  
  * IC timing or priority shifts

The audit log is the **authoritative change ledger**.

---

### **B. Missed Export Detection (New)**

If the audit log shows a change **not reflected in any exported dataset**:

* Treat this as a **missed export**  
* Require the responsible user to:  
  * re-upload the most recent dataset  
  * re-apply the change  
  * export a corrected file

If unresolved within one business day, the Admin may manually reconcile and issue an admin-approved export.

---

## **5\. Dataset Acceptance & Authority**

When users provide exported datasets:

* Confirm schema compliance  
* Confirm system-generated filename  
* Confirm logical consistency

Once accepted, that dataset becomes the **current authoritative version**.

---

## **6\. Versioning & File Naming Rules**

All authoritative datasets must follow the system-generated naming convention:

```
Valhros_Investor_CRM_vYYYYMMDD_HHMM.xlsx
```

Rules:

* Do not overwrite prior files  
* Archive all versions  
* The most recent accepted file is the system of record

---

## **7\. Strategy Governance**

* Strategy changes require:  
  * explicit in-session confirmation  
  * a Strategy Confidence check (Yes / No)  
* Strategies flagged with **Confidence \= No** should:  
  * receive reduced priority  
  * be reviewed within 14 days

The Admin may reject or roll back strategy updates that violate governance rules.

---

## **8\. Stage Governance Oversight**

* Stage advancement is gated by **Stage Exit Checklists**, enforced by the Project  
* The Admin should review audit logs for:  
  * blocked stage changes  
  * overridden checklists

Repeated overrides may indicate process breakdown and should be addressed directly.

---

## **9\. Session Discipline Oversight (New)**

The Project operates using explicit session types:

* Operational Update  
* Strategy Review  
* Partner Prep / Reporting  
* Admin Reconciliation

The Admin should watch for:

* strategy changes occurring during operational sessions  
* inconsistent session usage across users

Misuse should be corrected through coaching, not tooling changes.

---

## **10\. Knowledge Base Stewardship**

The Admin is responsible for maintaining:

* Team LinkedIn connection files  
* Valhros strategy and positioning documents  
* CRM schema and dropdown definitions

These should be reviewed quarterly or upon material change.

---

## **11\. Weekly Reconciliation (10–15 Minutes)**

Once per week:

1. Upload the current authoritative dataset to the Project  
2. Request reconciliation against audit logs since the prior accepted version  
3. Review:  
   * cumulative changes  
   * conflicting strategies  
   * stalled LPs without rationale

Resolve discrepancies immediately.

---

## **12\. Enforcement Authority**

The Admin has authority to:

* reject datasets  
* require re-exports  
* reverse unauthorized changes  
* issue admin-approved corrective exports  
* pause execution if data integrity is compromised

Process discipline overrides convenience.

---

## **13\. Final Rule**

**If it is not in an exported dataset and audit log, it did not happen.**

This SOP is binding operating policy for the Investor CRM & Strategy Project.

# D/L LinkedIn Data

## **How to Download Your LinkedIn Connections (CSV)**

### **Step 1: Go to LinkedIn Data Export**

While logged into LinkedIn, go to:

**Settings & Privacy → Data privacy → Get a copy of your data**

(You can also search “LinkedIn download your data” in settings.)

---

### **Step 2: Select the right data**

You’ll see two options:

* **Download larger data archive** ❌ (not needed)  
* **Select data you’re interested in** ✅

Choose **“Select data you’re interested in”**.

Check **only**:

* ✅ **Connections**

You do *not* need messages, profile data, ads, etc.

---

### **Step 3: Request the export**

* Click **Request archive**  
* You may need to re-enter your LinkedIn password

LinkedIn will say the file is being prepared.

---

### **Step 4: Download the file**

* You’ll receive an email (usually within minutes, sometimes a few hours)  
* Download the ZIP file  
* Inside will be a CSV, typically named something like:

```
Connections.csv
```

---

## **What’s in the Connections File (Important)**

Typical fields include:

* First Name  
* Last Name  
* Email Address (often blank)  
* Company  
* Position  
* Connected On (date)

What’s **not** included:

* Relationship strength  
* Notes  
* Mutual connections  
* Activity history

That’s expected — we’ll enrich it manually or via your schema.

---

## **What to Do Next (Recommended for Your Project)**

For this initiative, I recommend:

1. **Each user downloads their own Connections.csv**  
2. Rename files clearly, e.g.:

```
LinkedIn_Connections_ChristopherMorino_2026-03-10.csv
```

3.   
   (Optional but valuable) Add columns before upload:  
   * Relationship Strength (Strong / Medium / Weak)  
   * Nature of Relationship (worked together, intro only, social, etc.)  
4. Upload these files into the **Project Knowledge Base**

That gives the Project a clean, static relationship map without pretending it’s live.

---

## **Frequency Guidance**

* Refresh **quarterly** at most  
* Do **not** try to keep this live or automated  
* Treat it as a relationship *map*, not a contact list

# roadmap

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

---

Top things to do today

