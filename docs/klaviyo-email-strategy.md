# Klaviyo Email Marketing Strategy
## Posture Guy Mike — postureguymike.com

**Prepared:** March 2026
**Platform:** Klaviyo (migrating from Drip)
**Products:** UScreen Membership (primary) + Video Programs (one-time) + Physical Products
**Funnel:** Social → postureguymike.com → Posture Score Quiz → Klaviyo → UScreen

---

## Table of Contents

1. [Email Capture Strategy & Quiz Segmentation](#1-email-capture-strategy--quiz-segmentation)
2. [Quiz Structure — The Posture Score Assessment](#2-quiz-structure--the-posture-score-assessment)
3. [Klaviyo Segments & Buckets](#3-klaviyo-segments--buckets)
4. [Email Flows](#4-email-flows)
5. [Anti-Churn Strategy for App Members](#5-anti-churn-strategy-for-app-members)
6. [Klaviyo Technical Setup](#6-klaviyo-technical-setup)
7. [UScreen Integration via Zapier](#7-uscreen-integration-via-zapier)
8. [Implementation Priority Order](#8-implementation-priority-order)

---

## 1. Email Capture Strategy & Quiz Segmentation

### Core Philosophy

Every email subscriber enters through the **Posture Score Quiz**. The quiz does three things simultaneously:

1. **Captures the email** (gated behind results — user submits email to see their score)
2. **Segments the subscriber** into a pain/posture bucket for personalized follow-up
3. **Warms the prospect** by making them feel understood before they ever receive an email

The quiz is hosted on postureguymike.com (Shopify) — NOT on UScreen — so the email is captured and owned in Klaviyo regardless of whether the user ever converts to a member.

### Email Gate Placement

The quiz follows this flow:

```
Question 1 → 2 → 3 → 4 → 5 → 6 → 7
→ "Enter your email to see your Posture Score and personalized plan"
→ [Email submit]
→ Results page with score, bucket label, and CTA to free trial
```

The email gate is placed AFTER all questions are answered, before results are shown. This is the highest-converting placement because the user has already invested time and is curious about their result.

### Traffic Sources to Route Through Quiz

| Source | Entry Point |
|---|---|
| Instagram bio link | postureguymike.com → quiz popup or quiz page |
| TikTok link in bio | Same |
| Facebook ads | Quiz landing page (dedicated URL: /pages/posture-quiz) |
| YouTube description | Same |
| Homepage hero CTA | "Take the Free Posture Quiz" button |
| Blog posts | Inline quiz CTA banners |

---

## 2. Quiz Structure — The Posture Score Assessment

### Quiz Title
**"What's Your Posture Score? (Free 60-Second Assessment)"**

Subtitle: *Answer 7 quick questions and Mike will send you a personalized posture correction plan.*

---

### Question 1 — Primary Pain Area

**"Where do you feel it most?"**

> This is your most important question. It determines the primary segment bucket.

- A) Neck and shoulders / upper back
- B) Lower back
- C) Hips and pelvis
- D) Knees and feet
- E) I don't have pain — I just want to stand taller and feel better

**Maps to:** `pain_area` property

---

### Question 2 — Severity / Urgency

**"How often does this bother you?"**

- A) Every single day — it's affecting my quality of life
- B) A few times a week — it flares up and goes away
- C) Occasionally — mostly after sitting or working out
- D) Rarely — I'm more focused on prevention

**Maps to:** `pain_severity` property (values: `daily`, `frequent`, `occasional`, `prevention`)
**Used for:** Urgency scoring — `daily` and `frequent` go into high-urgency email sequences

---

### Question 3 — Primary Cause / Lifestyle

**"What do you think is causing it?"**

- A) I sit at a desk or computer most of the day
- B) I'm on my feet all day (standing job, retail, healthcare)
- C) An old injury or surgery
- D) I'm very active / I work out a lot but still have issues
- E) Age — things just aren't what they used to be
- F) I'm not sure

**Maps to:** `lifestyle_type` property (values: `desk_worker`, `standing_worker`, `injury_history`, `athlete`, `senior`, `unknown`)

---

### Question 4 — Age Range

**"How old are you?"**

- A) Under 30
- B) 30–44
- C) 45–59
- D) 60 and over

**Maps to:** `age_range` property
**Used for:** Senior-specific sequences for 60+; copy tone adjustments

---

### Question 5 — Previous Attempts

**"Have you tried to fix this before?"**

- A) Yes — physical therapy, but it came back
- B) Yes — stretching or YouTube videos, but nothing stuck
- C) Yes — a chiropractor, but it's temporary relief
- D) No — I haven't really tried anything yet
- E) I've tried everything. Nothing works.

**Maps to:** `previous_attempts` property
**Used for:** Overcoming specific objections in email copy (PT patients get different copy than first-timers)

---

### Question 6 — Goal

**"What matters most to you right now?"**

- A) Stop the pain — I just want relief
- B) Stand taller and feel more confident
- C) Move better for sports / working out
- D) Stay healthy and mobile as I get older
- E) Help my child or family member

**Maps to:** `primary_goal` property (values: `pain_relief`, `confidence`, `athletic_performance`, `healthy_aging`, `family`)
**Used for:** Email subject line and body copy personalization

---

### Question 7 — Commitment Level

**"How much time can you realistically dedicate to this?"**

- A) 10 minutes or less per day
- B) 15–20 minutes per day
- C) 30+ minutes — I'm fully committed
- D) I'm not sure yet

**Maps to:** `commitment_level` property
**Used for:** Setting realistic expectations in onboarding; "10-min routine" angle for low-commitment subscribers

---

### Results Page Logic

After email is submitted, the user sees a results page with:

1. **A posture score** (65–95 out of 100 — calculated from Q2 severity + Q5 attempts, never lower than 65 to avoid discouraging)
2. **Their bucket label** (see Section 3)
3. **Mike's personal message** (short video clip, ~20 seconds, matching their issue)
4. **Primary CTA:** "Start Your Free 3-Day Trial — Get Your Personalized Plan" → UScreen trial URL
5. **Secondary CTA:** "See the Programs" → program page

---

## 3. Klaviyo Segments & Buckets

### Primary Buckets (based on Q1 + Q3 combination)

| Bucket ID | Label | Q1 Answer | Q3 Answer |
|---|---|---|---|
| `desk_neck` | Desk Worker — Neck & Shoulders | A (neck/shoulders) | A (desk job) |
| `desk_back` | Desk Worker — Lower Back | B (lower back) | A (desk job) |
| `senior_general` | Seniors — General Posture | Any | E (age) |
| `athlete_performance` | Athlete / Active Person | Any | D (athlete) |
| `injury_recovery` | Post-Injury / Post-Surgery | Any | C (injury) |
| `lower_back_general` | Lower Back Pain | B | Any not A/D |
| `neck_shoulders_general` | Neck & Shoulder Pain | A | Any not A |
| `standing_worker` | Standing Worker | Any | B (standing job) |
| `prevention_no_pain` | Prevention / Posture Confidence | E (no pain) | Any |
| `family_helper` | Helping Family Member | Any | Any (Q6=E) |

**Bucket assignment logic:** Run in priority order. First matching rule wins. If no specific rule matches, fall back to Q1-only bucket.

### Secondary Segments (cross-cutting, used for campaign targeting)

| Segment Name | Condition |
|---|---|
| `High Urgency` | `pain_severity` = `daily` OR `frequent` |
| `PT Dropout` | `previous_attempts` contains `pt` |
| `Skeptics` | `previous_attempts` = `tried_everything` |
| `First Timers` | `previous_attempts` = `nothing_yet` |
| `Seniors 60+` | `age_range` = `60_plus` |
| `Athletes` | `lifestyle_type` = `athlete` |
| `Low Commitment` | `commitment_level` = `10min` |
| `Active Trial` | `uscreen_status` = `trial` |
| `Paid Member` | `uscreen_status` = `paid` |
| `Churned Member` | `uscreen_status` = `cancelled` |
| `Program Purchaser` | `uscreen_status` = `program_only` |
| `Never Converted` | `uscreen_status` = `none` AND signed up 14+ days ago |

---

## 4. Email Flows

### Flow 1 — Welcome + Quiz Results Flow
**Trigger:** Quiz form submitted (Klaviyo JS API event: `Quiz Completed`)
**Segmentation:** Split by `posture_bucket` property
**Goal:** Deliver results, build trust, drive free trial signup

---

**Email 1.1 — Immediate (0 min after submission)**
Subject options by bucket:
- Desk Worker: *"Here's your Posture Score — and why your neck is always tight"*
- Lower Back: *"Your Posture Score is [score] — here's what your lower back is telling you"*
- Senior: *"Your Posture Score — and why it's never too late to stand tall again"*
- Athlete: *"Your Posture Score — why your workouts might be making it worse"*
- Prevention: *"Your Posture Score — you're already ahead of 80% of people"*

Content:
- Show their score prominently
- 3–4 sentences from Mike explaining what their result means
- What they'll likely experience if they don't address it (pain point amplification)
- CTA: "Start Free Trial — Get Your Personalized Plan"
- Secondary: link to free YouTube video relevant to their issue

---

**Email 1.2 — Day 1 (24 hours later)**
Subject: *"The #1 mistake [bucket label] people make"*

Content:
- Specific to their bucket (e.g., desk workers: "tilting your chin toward your screen")
- Short tip they can try right now (builds trust fast)
- Mention that the full system is in the app
- CTA: "Try the App Free for 3 Days"

---

**Email 1.3 — Day 3**
Subject: *"[First name], I made this for you"*

Content:
- Mike introduces himself more personally (his own posture story, how he got into this)
- Social proof: 2.5M followers, testimonial specific to their bucket
- CTA: "Join the free trial — cancel anytime"

---

**Email 1.4 — Day 5**
Subject: *"What's happening inside your body right now (it's fixable)"*

Content:
- Educational — explain the root cause of their specific issue (not symptoms)
- Short anatomical explanation in plain language (Mike's coaching voice)
- Introduce the programs as an alternative if they prefer a one-time purchase
- Dual CTA: "Start Membership Trial" | "Shop Programs"

---

**Email 1.5 — Day 7**
Subject: *"Last one from me for a while — but read this first"*

Content:
- Acknowledge they haven't started yet (no pressure tone)
- "Here's what members say after just one week" — 2 testimonials
- Urgency without being pushy: "The free trial is always open, no credit card required"
- Hard CTA with button: "Claim Your Free Trial"

---

### Flow 2 — Free Trial Onboarding (Days 1–7)
**Trigger:** Zapier webhook from UScreen when user starts trial → Klaviyo event `Trial Started`
**Goal:** Get the user to complete their first workout within 48 hours. Activation = retention.

---

**Email 2.1 — Immediate (trial start)**
Subject: *"Your free trial is live — start here (takes 10 min)"*

Content:
- Welcome, celebrate the decision
- Clear next step: Go to the app, find the "Start Here" section
- Link directly to the recommended first workout based on their `posture_bucket`
- Quick reminder: trial ends in 3 days, cancel anytime

---

**Email 2.2 — Day 1 (24 hours)**
Subject: *"Did you get a chance to try it yet?"*

Content:
- Soft check-in
- Recommend their bucket-specific beginner routine
- "It takes less time than scrolling Instagram" (Mike's casual voice)
- CTA: "Watch Your First Routine" → deep link into UScreen

---

**Email 2.3 — Day 2 (48 hours)**
Subject: *"Most people feel this after their first session"*

Content:
- What to expect: initial relief, looseness, possibly soreness
- Normalize that it takes a few sessions to build a habit
- Remind them: trial ends tomorrow
- Soft conversion CTA: "Keep access for $[price]/month — cancel anytime"

---

**Email 2.4 — Day 3 — Trial Expiry Warning (morning of last day)**
Subject: *"Your trial ends today — here's how to keep going"*

Content:
- Simple, direct, no fluff
- What they'll lose access to if they don't convert
- Price and billing details clearly stated
- Testimonial from someone with same bucket
- CTA: "Keep My Membership"

---

**Email 2.5 — Day 5 (if converted to paid)**
Subject: *"You're officially a member — here's what to do this week"*

Content:
- Welcome to the community
- Recommended Week 1 routine (bucket-specific)
- When new content drops (monthly cadence)
- How to use the app (features overview)

---

**Email 2.6 — Day 7 (if still free/no conversion)**
Subject: *"Your trial expired — but you can still get started"*

Content:
- No shame, just an open door
- "Pick up where you left off" framing
- CTA back to UScreen checkout

---

### Flow 3 — Trial to Paid Conversion (Urgency Sequence)
**Trigger:** Klaviyo metric `Trial Started` + time delay + condition: `uscreen_status` != `paid`
**Goal:** Convert trial users before or immediately after expiry

This flow runs in parallel with Flow 2 but specifically targets conversion with urgency and objection handling.

---

**Email 3.1 — Day 2 of trial (urgency start)**
Subject: *"Your trial is halfway over — quick question"*

Content:
- "Have you tried a routine yet?" — if yes, great; if not, here's a 10-minute one
- Remind them what they get as a paid member (content library, live classes, new routines monthly)
- Price anchor: less than one chiropractic co-pay per month
- CTA: "Upgrade Now"

---

**Email 3.2 — Day 3 morning — Final Urgency**
Subject: *"Last chance — your free access ends at midnight"*

Content:
- Simple, clean, conversion-focused
- 3 bullet points: what you get, what it costs, how to cancel
- FAQ: "Will I be charged automatically?" / "Can I cancel?" — answer both
- Big CTA button: "Keep My Access — $[price]/month"

---

**Email 3.3 — Day 4 (1 day after trial expires, no conversion)**
Subject: *"You left something behind"*

Content:
- Casual, non-pushy
- "I noticed you tried the app but didn't continue — totally fine"
- Offer: "Here's a free YouTube routine to hold you over" + link
- CTA to restart trial or purchase directly: "Ready when you are"

---

### Flow 4 — Paid Member Retention (Anti-Churn)
**Trigger:** `uscreen_status` becomes `paid`
**Goal:** Reduce monthly churn, build habitual usage, create community feeling

See full detail in **Section 5**.

---

### Flow 5 — Win-Back (Cancelled Members)
**Trigger:** Zapier webhook from UScreen → Klaviyo event `Membership Cancelled` → sets `uscreen_status` = `cancelled`
**Goal:** Re-engage and re-convert cancelled members within 60 days

---

**Email 5.1 — Day 1 after cancellation**
Subject: *"We'll miss you — and here's something before you go"*

Content:
- Acknowledge cancellation without being dramatic
- Ask why they cancelled (link to a simple 1-click survey: price / too busy / not seeing results / technical issues)
- Offer: 2 free YouTube resources based on their bucket
- No hard sell

---

**Email 5.2 — Day 7**
Subject: *"How's your [pain area] been this week?"*

Content:
- Gentle check-in using their `pain_area` property
- Share a new tip or exercise for their specific issue
- Soft re-engagement: "If you want to get back to the full system, we're here"
- CTA: "Rejoin — Special Rate" (if you want to offer a discount here, this is the moment)

---

**Email 5.3 — Day 21**
Subject: *"Something new just dropped in the app"*

Content:
- Announce new content added since they cancelled (monthly content update)
- "Thought of you — this one's for [their bucket]"
- CTA: "Rejoin and Access It Now"

---

**Email 5.4 — Day 45**
Subject: *"One year from now..."*

Content:
- Vision-based copy: where they could be in 12 months with consistent practice vs. without
- Success story from someone with their bucket type
- Final CTA: "Come Back — Start Free Again" (offer another 3-day trial for cancelled members — UScreen allows this)

---

**Email 5.5 — Day 60 (final win-back)**
Subject: *"Closing out your file — but leaving the door open"*

Content:
- "I'm going to stop reaching out after this" (creates urgency through scarcity of attention)
- Best testimonial you have
- Clear offer to rejoin
- Move to low-frequency newsletter list if no conversion

---

### Flow 6 — Program Purchaser → Membership Upsell
**Trigger:** Zapier webhook from UScreen when user purchases a one-time program → Klaviyo event `Program Purchased`
**Goal:** Upsell to membership within 30 days of program purchase

---

**Email 6.1 — Day 1 after purchase**
Subject: *"Your program is ready — plus a quick heads up"*

Content:
- Confirm program access, link to UScreen login
- Tease the membership: "When you're ready for more, the app has 200+ routines and new content every month"
- No hard sell yet — let them experience the program first

---

**Email 6.2 — Day 7**
Subject: *"How's Day 7 going?"*

Content:
- Check in on their progress
- Reinforce that they made a great choice
- Introduce the membership: "Most people who finish this program want to keep going — here's how"
- CTA: "Explore the Membership App"

---

**Email 6.3 — Day 14**
Subject: *"What's next after your program?"*

Content:
- "You're halfway through — here's what members do after they finish"
- Show the breadth of the membership (not just more of the same — live classes, community, new routines)
- Price: "Less than $X/month — your program purchase doesn't apply toward membership, but..."
- CTA: "Start a Free Trial"

---

**Email 6.4 — Day 21**
Subject: *"You've invested in your posture — don't let it slip"*

Content:
- Science of habit maintenance: gains disappear without maintenance
- Membership framed as the maintenance plan
- Testimonial: "I did the program and then joined the app — best decision I made"
- CTA: "Protect Your Progress — Try the App Free"

---

**Email 6.5 — Day 30**
Subject: *"Last push — here's a membership deal just for program members"*

Content:
- If offering a discount or bonus: state it clearly here (or just re-state the value)
- Clear before/after framing: where they were Day 1 vs. now
- CTA: "Join the App — Free Trial"

---

### Flow 7 — Newsletter / Weekly Engagement
**Trigger:** Recurring broadcast to all non-suppressed subscribers
**Frequency:** Weekly (every Tuesday recommended — highest open rates for health/wellness)
**Goal:** Keep the brand top of mind, provide value, drive traffic to content and offers

**Weekly Newsletter Structure:**

```
Subject: "[Quick tip] + [curiosity hook]"
Example: "Why your pillow is making your neck worse (do this instead)"

Body:
1. Short intro from Mike (2–3 sentences, casual voice)
2. Main tip or exercise (practical, specific to a common issue)
3. One content piece (YouTube video, blog post, or TikTok)
4. One offer mention (soft CTA — trial, program, or product)
5. Footer: social links, unsubscribe
```

**Monthly newsletter themes (rotate):**
- Week 1: Pain relief tip (high engagement — speaks to pain buckets)
- Week 2: Education (anatomy, why posture matters, misconceptions)
- Week 3: New content announcement (what dropped in the app this month)
- Week 4: Community / success story (testimonial + encouragement)

---

## 5. Anti-Churn Strategy for App Members

Members churn when they stop feeling progress or stop using the app. The goal is to build a usage habit in the first 30 days, because members who complete 3+ sessions in week 1 have dramatically lower churn.

### Paid Member Retention Sequence

**Email R.1 — Member Day 7 Check-In**
Subject: *"One week in — how are you feeling?"*

Content:
- Celebrate the first week
- "If you've done even one routine, you're already ahead of most people"
- Recommend their Week 2 routine (bucket-specific)
- Introduce one feature they may not have used (e.g., live class schedule, progress tracker)

---

**Email R.2 — Member Day 14 — Engagement Check**
Trigger: Klaviyo sends this email ONLY if engagement metric is low (i.e., no UScreen activity event received via Zapier in past 7 days)

Subject: *"Haven't seen you in a bit — everything okay?"*

Content:
- Soft check-in, no guilt
- "Life gets busy — here's a 7-minute routine you can do right now"
- Direct link to shortest routine in their bucket category
- "Reply to this email if you're having trouble finding something that works"

---

**Email R.3 — Monthly New Content Drop**
Trigger: Monthly, sent to all `uscreen_status = paid` subscribers
Subject: *"New this month in the app — [specific routine or series name]"*

Content:
- What's new: describe the new routine series, focus area, instructor notes from Mike
- Why it's relevant to them (use `posture_bucket` to customize the lead paragraph)
- Direct link to new content in UScreen
- "Live class this [day] — here's how to join"

---

**Email R.4 — Weekly Live Class Reminder**
Trigger: Recurring every week, 24 hours before live class
Subject: *"Live class tomorrow — [class topic] with Mike"*

Content:
- Class details: date, time, topic, what to wear/have ready
- "Even if you can't make it live, the replay will be in the app"
- CTA: "Add to Calendar" + "Join Live" link

---

**Email R.5 — Day 30 Milestone**
Subject: *"You've been a member for 30 days — here's what's changed"*

Content:
- Celebrate the milestone
- Reinforce sunk cost (positive framing): "You've put in the work — this is where it compounds"
- Share what long-term members experience at 60, 90, 180 days
- Ask for a testimonial or review (high-trust moment)
- Introduce annual plan if on monthly: "Lock in a lower rate — save X% with annual"

---

**Email R.6 — Monthly Billing Reminder (day before renewal)**
Subject: *"Your membership renews tomorrow"*

Content:
- Simple, transparent billing reminder (reduces chargebacks and angry cancellations)
- Quick value reminder: "Here's what you have access to"
- Link to manage subscription
- "Questions? Reply to this email"

---

**Email R.7 — Re-Engagement at Day 60 (no activity)**
Trigger: Sent ONLY if no UScreen activity event in past 30 days AND still `uscreen_status = paid`

Subject: *"We need to talk, [first name]"*

Content:
- Direct, warm subject line hooks the open
- "I noticed you haven't been in the app lately — I'm not here to guilt you"
- Short explanation of why consistency matters for their specific issue
- Offer: "Book a free 15-minute posture check-in call with Emily" (if you want to add this as a high-value retention touch) OR just offer a restart routine
- "If the app isn't working for you, just reply and tell me why"

---

### Usage Milestone Emails (triggered by UScreen events via Zapier)

| Milestone | Subject Line |
|---|---|
| First session completed | *"You did it — here's what to do next"* |
| 5th session | *"5 sessions done — your body is already adapting"* |
| 10th session | *"10 sessions! Seriously, this is huge"* |
| 30-day streak | *"30 days. Mike wants to say something"* (personal video) |

---

## 6. Klaviyo Technical Setup

### Lists to Create

| List Name | ID (set in Klaviyo) | Purpose |
|---|---|---|
| `Quiz Leads` | `LIST_QUIZ` | All quiz completions (main acquisition list) |
| `Trial Members` | `LIST_TRIAL` | Active trial users |
| `Paid Members` | `LIST_PAID` | Active paying members |
| `Program Purchasers` | `LIST_PROGRAMS` | One-time program buyers |
| `Cancelled Members` | `LIST_CANCELLED` | Churned members |
| `Newsletter` | `LIST_NEWSLETTER` | General newsletter (everyone not suppressed) |

### Custom Profile Properties

These are set on the Klaviyo profile via the JS API at quiz submission, and updated via Zapier when UScreen status changes.

| Property Name | Type | Values |
|---|---|---|
| `posture_bucket` | string | `desk_neck`, `desk_back`, `senior_general`, `athlete_performance`, `injury_recovery`, `lower_back_general`, `neck_shoulders_general`, `standing_worker`, `prevention_no_pain`, `family_helper` |
| `pain_area` | string | `neck_shoulders`, `lower_back`, `hips_pelvis`, `knees_feet`, `none` |
| `pain_severity` | string | `daily`, `frequent`, `occasional`, `prevention` |
| `lifestyle_type` | string | `desk_worker`, `standing_worker`, `injury_history`, `athlete`, `senior`, `unknown` |
| `age_range` | string | `under_30`, `30_44`, `45_59`, `60_plus` |
| `previous_attempts` | string | `pt`, `stretching_youtube`, `chiro`, `nothing_yet`, `tried_everything` |
| `primary_goal` | string | `pain_relief`, `confidence`, `athletic_performance`, `healthy_aging`, `family` |
| `commitment_level` | string | `10min`, `15_20min`, `30plus`, `unsure` |
| `posture_score` | number | 65–95 |
| `uscreen_status` | string | `none`, `trial`, `paid`, `program_only`, `cancelled` |
| `uscreen_user_id` | string | UScreen user ID (set via Zapier) |
| `source` | string | `quiz`, `direct`, `social_ig`, `social_tiktok`, `social_yt`, `social_fb` |
| `quiz_completed_at` | datetime | ISO timestamp of quiz completion |
| `trial_started_at` | datetime | Set by Zapier when trial starts |
| `paid_since` | datetime | Set by Zapier when first payment succeeds |
| `cancelled_at` | datetime | Set by Zapier when cancelled |
| `last_session_at` | datetime | Updated by Zapier when UScreen session completed |

### Segment Conditions Reference

```
Segment: "Active Paid Members"
  - Property "uscreen_status" equals "paid"

Segment: "Active Trial Users"
  - Property "uscreen_status" equals "trial"

Segment: "High Urgency Leads"
  - Property "pain_severity" equals "daily" OR "frequent"
  - AND Property "uscreen_status" equals "none"

Segment: "Desk Worker — Neck & Shoulders"
  - Property "posture_bucket" equals "desk_neck"

Segment: "At-Risk Members (No Activity 14+ Days)"
  - Property "uscreen_status" equals "paid"
  - AND Property "last_session_at" is before X days ago (14)

Segment: "Program Purchasers — Not Yet Members"
  - Property "uscreen_status" equals "program_only"

Segment: "Seniors 60+"
  - Property "age_range" equals "60_plus"
```

### Klaviyo JS API — Quiz Submission Snippet

Place this in the Shopify theme or quiz page. Fires when the user submits their email on the quiz results step.

```javascript
/**
 * Posture Guy Mike — Klaviyo Quiz Submission
 * Fires on quiz email gate submit.
 * Requires: Klaviyo JS snippet already loaded on page (via Klaviyo app in Shopify)
 */

function submitQuizToKlaviyo(quizData) {
  // quizData is built as user answers questions — structure below

  // Determine posture bucket from answers
  const bucket = determinePostureBucket(quizData);
  const postureScore = calculatePostureScore(quizData);

  // Klaviyo identify call — creates/updates profile
  var _learnq = window._learnq || [];

  _learnq.push(['identify', {
    '$email': quizData.email,
    '$first_name': quizData.firstName || '',  // optional — add a name field if desired
    'posture_bucket': bucket,
    'pain_area': quizData.q1,           // e.g. "neck_shoulders"
    'pain_severity': quizData.q2,       // e.g. "daily"
    'lifestyle_type': quizData.q3,      // e.g. "desk_worker"
    'age_range': quizData.q4,           // e.g. "30_44"
    'previous_attempts': quizData.q5,   // e.g. "pt"
    'primary_goal': quizData.q6,        // e.g. "pain_relief"
    'commitment_level': quizData.q7,    // e.g. "10min"
    'posture_score': postureScore,
    'uscreen_status': 'none',
    'source': getQuizSource(),
    'quiz_completed_at': new Date().toISOString()
  }]);

  // Track custom event — used as flow trigger
  _learnq.push(['track', 'Quiz Completed', {
    'posture_bucket': bucket,
    'posture_score': postureScore,
    'pain_area': quizData.q1,
    'primary_goal': quizData.q6
  }]);

  // Subscribe to the Quiz Leads list
  // Replace LIST_ID with your actual Klaviyo list ID
  fetch('https://a.klaviyo.com/client/subscriptions/?company_id=YOUR_PUBLIC_API_KEY', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'revision': '2023-12-15'
    },
    body: JSON.stringify({
      data: {
        type: 'subscription',
        attributes: {
          list_id: 'YOUR_QUIZ_LIST_ID',
          email: quizData.email,
          custom_source: 'Posture Score Quiz'
        }
      }
    })
  });
}

/**
 * Bucket determination logic
 * Priority order: specific combinations first, then fallbacks
 */
function determinePostureBucket(data) {
  const pain = data.q1;
  const lifestyle = data.q3;
  const goal = data.q6;

  // Priority 1: Family helper (Q6)
  if (goal === 'family') return 'family_helper';

  // Priority 2: Senior (Q3)
  if (lifestyle === 'senior') return 'senior_general';

  // Priority 3: Specific combinations
  if (pain === 'neck_shoulders' && lifestyle === 'desk_worker') return 'desk_neck';
  if (pain === 'lower_back' && lifestyle === 'desk_worker') return 'desk_back';
  if (lifestyle === 'athlete') return 'athlete_performance';
  if (lifestyle === 'injury_history') return 'injury_recovery';
  if (lifestyle === 'standing_worker') return 'standing_worker';

  // Priority 4: Pain area fallbacks
  if (pain === 'none') return 'prevention_no_pain';
  if (pain === 'neck_shoulders') return 'neck_shoulders_general';
  if (pain === 'lower_back') return 'lower_back_general';

  // Default fallback
  return 'lower_back_general';
}

/**
 * Posture score calculation
 * Score range: 65–95 (never show below 65 — keep it encouraging)
 */
function calculatePostureScore(data) {
  let score = 90;

  // Severity deductions
  if (data.q2 === 'daily') score -= 15;
  else if (data.q2 === 'frequent') score -= 10;
  else if (data.q2 === 'occasional') score -= 5;
  // prevention = no deduction

  // Previous attempts (having tried and failed = more severe)
  if (data.q5 === 'tried_everything') score -= 10;
  else if (data.q5 === 'pt' || data.q5 === 'chiro') score -= 5;

  // Floor at 65
  return Math.max(score, 65);
}

/**
 * Detect traffic source from UTM params or referrer
 */
function getQuizSource() {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get('utm_source');
  if (utm) return utm;

  const ref = document.referrer;
  if (ref.includes('instagram')) return 'social_ig';
  if (ref.includes('tiktok')) return 'social_tiktok';
  if (ref.includes('youtube')) return 'social_yt';
  if (ref.includes('facebook')) return 'social_fb';

  return 'quiz';
}
```

### Klaviyo Flow Triggers Summary

| Flow | Trigger Type | Metric / Event |
|---|---|---|
| Welcome + Quiz Results | Metric | `Quiz Completed` |
| Trial Onboarding | Metric | `Trial Started` (from Zapier) |
| Trial → Paid Conversion | Metric + time filter | `Trial Started` + 2 days |
| Paid Member Retention | List trigger | Added to `LIST_PAID` |
| Win-Back | Metric | `Membership Cancelled` (from Zapier) |
| Program → Membership Upsell | Metric | `Program Purchased` (from Zapier) |
| Newsletter | Segment | Recurring broadcast to `LIST_NEWSLETTER` |

---

## 7. UScreen Integration via Zapier

Since UScreen is not natively integrated with Klaviyo, use Zapier to sync member lifecycle events.

### Zapier Zaps to Build

**Zap 1: Trial Started**
- Trigger: UScreen — New Trial Subscription
- Action: Klaviyo — Track Event "Trial Started"
- Also: Klaviyo — Update Profile Property `uscreen_status` = `trial`, `trial_started_at` = timestamp
- Also: Klaviyo — Add to List `LIST_TRIAL`

**Zap 2: Trial Converted to Paid**
- Trigger: UScreen — Subscription Activated (first payment)
- Action: Klaviyo — Track Event "Membership Activated"
- Also: Update `uscreen_status` = `paid`, `paid_since` = timestamp
- Also: Add to `LIST_PAID`, Remove from `LIST_TRIAL`

**Zap 3: Membership Cancelled**
- Trigger: UScreen — Subscription Cancelled
- Action: Klaviyo — Track Event "Membership Cancelled"
- Also: Update `uscreen_status` = `cancelled`, `cancelled_at` = timestamp
- Also: Add to `LIST_CANCELLED`, Remove from `LIST_PAID`

**Zap 4: Program Purchased**
- Trigger: UScreen — New One-Time Purchase
- Action: Klaviyo — Track Event "Program Purchased"
- Also: Update `uscreen_status` = `program_only` (only if not already `paid`)
- Also: Add to `LIST_PROGRAMS`

**Zap 5: Session Completed (engagement tracking)**
- Trigger: UScreen — Video Watched / Session Completed
- Action: Klaviyo — Update Profile Property `last_session_at` = timestamp
- This enables the "no activity in 14 days" re-engagement trigger

**Zap 6: UScreen User Created (email match)**
- Trigger: UScreen — New User
- Action: Klaviyo — Update Profile by email, set `uscreen_user_id` property

---

## 8. Implementation Priority Order

Build in this order to capture revenue fastest:

### Phase 1 — Foundation (Week 1–2)
- [ ] Install Klaviyo on Shopify (Klaviyo app from Shopify App Store)
- [ ] Create all 6 Lists in Klaviyo
- [ ] Add quiz JS snippet to Shopify theme
- [ ] Build quiz on Shopify (/pages/posture-quiz) with logic
- [ ] Test Quiz Completed event firing to Klaviyo correctly
- [ ] Build Flow 1 (Welcome + Quiz Results) — generic version first, then bucket-specific

### Phase 2 — Trial Conversion (Week 3–4)
- [ ] Set up Zapier account and connect to UScreen + Klaviyo
- [ ] Build Zaps 1–4
- [ ] Build Flow 2 (Trial Onboarding, Days 1–7)
- [ ] Build Flow 3 (Trial → Paid Conversion urgency)
- [ ] Test full funnel: quiz → email → trial → conversion emails

### Phase 3 — Retention & Upsell (Week 5–6)
- [ ] Build Flow 4 (Paid Member Retention — all R.1 through R.7)
- [ ] Build Zap 5 (session activity tracking)
- [ ] Build Flow 6 (Program → Membership upsell)
- [ ] Set up weekly newsletter template

### Phase 4 — Win-Back & Optimization (Week 7–8)
- [ ] Build Flow 5 (Win-Back, all 5 emails)
- [ ] Set up A/B tests on top emails (subject lines for Flow 1.1, 2.1, 3.2)
- [ ] Add bucket-specific content variants to key emails
- [ ] Set up Klaviyo reporting dashboard: open rate, click rate, trial conversion rate, churn save rate

---

## Email Copy Voice Guidelines

These apply across all flows. Maintain consistency with the Mike + Emily brand.

- **Tone:** Warm, encouraging, educational. Never alarmist or fear-based.
- **Length:** Short emails outperform long ones for this audience. Aim for 150–250 words per email. Save longer content for educational newsletters.
- **Mike's voice:** Conversational, like texting a knowledgeable friend. Uses phrases like "here's the thing," "I'm not going to sugarcoat it," "you've got this."
- **Always provide value first.** Every email should contain at least one actionable tip before any CTA.
- **CTA buttons:** Action-oriented, specific. "Start My Free Trial" not "Click Here." "Watch the Routine" not "Learn More."
- **Subject lines:** Use personalization (`{first_name}`) where natural. Avoid spam triggers (all caps, excessive punctuation). Best performers for this niche: curiosity gaps, specific body parts, "mistake" framing, before/after.
- **Preview text:** Always set it — it's the second subject line. Use it to extend the hook from the subject, not repeat it.

---

*Document version: 1.0 — March 2026*
*Next review: When Klaviyo is live and first 30 days of data are available*
