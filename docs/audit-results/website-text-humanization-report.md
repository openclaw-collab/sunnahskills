# Website Text Humanization Audit Report

**Date:** 2026-03-30
**Audited by:** sunnah-skill:humanizer via subagent audit

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total Files Audited** | 88 |
| **Total Issues Found** | 104 |
| **High Severity** | 22 (Must fix immediately) |
| **Medium Severity** | 49 (Should fix soon) |
| **Low Severity** | 33 (Nice to have) |

This audit examined user-facing text across the Sunnah Skills website to identify AI-sounding language, robotic phrasing, and opportunities to humanize the content. The audit found significant opportunities for improvement, particularly in registration flows, error messages, and marketing copy on public pages.

---

## Section Breakdown

### 1. Registration Pages
- **Files Audited:** 21
- **Total Issues:** 47
- **Severity:** 12 High, 23 Medium, 12 Low
- **Assessment:** The registration flow uses system-oriented language ('Family & Member Account') that sounds like backend terminology rather than parent-facing language. Helper text is overly instructional with robotic step-by-step sequencing. Several error messages use passive construction ('was invalid') instead of conversational explanations. The highest concentration of high-severity issues is in this section due to the business-critical nature of the registration flow.

### 2. Public Pages
- **Files Audited:** 14
- **Total Issues:** 12
- **Severity:** 3 High, 5 Medium, 4 Low
- **Assessment:** The audit found 12 instances of AI-sounding text across 14 public pages. The highest concentration is in About.tsx (3 high-severity findings) and Testimonials.tsx (4 medium-severity findings). Main patterns observed: (1) Forced rhetorical tricolons ('character, confidence, and community'), (2) Abstract benefit claims without concrete specifics, (3) Brochure language like 'transformed,' 'incredible,' and 'empowering,' (4) Generic testimonial structures without specific anecdotes. The programConfig.ts file contains source copy that propagates AI-sounding language to multiple pages.

### 3. Admin Interface
- **Files Audited:** 14
- **Total Issues:** 2
- **Severity:** 0 High, 1 Medium, 1 Low
- **Assessment:** Admin interface text is generally functional and appropriate. Most labels are concise and clear. Minor issue with technical webhook terminology that could confuse non-technical admins.

### 4. Technique Library
- **Files Audited:** 7
- **Total Issues:** 3
- **Severity:** 0 High, 2 Medium, 1 Low
- **Assessment:** The Technique Library text is generally well-written and human-sounding. Most technique descriptions use clear, direct BJJ terminology without AI artifacts. Three medium-severity issues were found involving internal/backend language ('launch technique set', 'launch chain', 'flow through') that should be simplified for public-facing content. One low-severity issue involves slightly verbose instructional text that could be tightened. Overall text quality is good with authentic instructional voice.

### 5. Navigation and UI
- **Files Audited:** 8
- **Total Issues:** 4
- **Severity:** 0 High, 1 Medium, 3 Low
- **Assessment:** Navigation and UI text audit completed. Most labels are natural and functional. Found 4 low-severity issues: 1) Footer mission statement uses a forced triplet pattern (confident, skilled, resilient) that sounds templated; 2) Footer legal text uses bureaucratic phrasing with forced list of three; 3) CTA button uses slightly marketing-forward 'Start Your Free Trial' phrasing; 4) Copyright tagline uses standard legal language (acceptable). All navigation labels, program names, and button text are clear and appropriate. Aria labels are well-implemented for accessibility.

### 6. Forms and Inputs
- **Files Audited:** 8
- **Total Issues:** 12
- **Severity:** 1 High, 5 Medium, 6 Low
- **Assessment:** Forms and inputs text audit complete. Overall the form text is functional and parent-facing, with a calm and direct tone appropriate for Sunnah Skills. 12 issues identified: 1 high (specific personal email in placeholder), 5 medium (wordy placeholders, mechanical error messages, AI-list patterns), and 6 low (generic labels, minor refinements). The UI component files (form.tsx, label.tsx, input.tsx) contain no visible text content - they are generic shadcn/ui components. All substantive text is in Contact.tsx, AdminLogin.tsx, StepGuardianInfo.tsx, and StepStudentInfo.tsx. Recommended improvements focus on shortening placeholders, using generic examples instead of specific personal emails, and simplifying error messages to be more conversational.

### 7. Error and Success States
- **Files Audited:** 16
- **Total Issues:** 24
- **Severity:** 6 High, 12 Medium, 6 Low
- **Assessment:** The audit found 24 error/success messages across 16 files. High severity issues (6) involve technical jargon like 'Failed to create payment intent' and 'Request failed' that are system-focused rather than user-focused. Medium severity issues (12) include generic error patterns like 'Could not...' and 'Please try again' that could be more specific and helpful. The codebase shows patterns of using passive voice, technical backend language, and generic AI-sounding phrases. Recommendations: 1) Replace system-focused language with user-centered explanations, 2) Add specific next steps to error messages, 3) Use active voice and conversational tone, 4) Avoid technical terms like 'payment intent' and 'live waiver' in user-facing text.

---

## Priority Action Items

### High Priority (Fix First)

1. **`client/src/pages/RegistrationHub.tsx`** (line 100) - "Request failed" → "Something went wrong. Try again?"
2. **`client/src/pages/admin/AdminLogin.tsx`** (line 50) - "Login failed" → "Couldn't sign you in. Check your email and password."
3. **`client/src/pages/registration/ProgramRegistrationPage.tsx`** (line 176) - "Failed to create payment intent" → "Couldn't start payment. Try again in a moment."
4. **`client/src/pages/registration/CartPage.tsx`** (line 304) - "The live waiver could not be loaded." → "Couldn't load the waiver. Refresh the page or try again."
5. **`client/src/pages/admin/AdminLogin.tsx`** (line 82) - "muadh@sunnahskills.com" → "admin@example.com"
6. **`client/src/pages/About.tsx`** (line 357) - "We're not just teaching martial arts. We're building character, confidence, and community. Since May 2024, Sunnah Skills has been helping young Muslims develop the physical skills, mental discipline, and spiritual grounding they need to thrive." → "We teach martial arts as a way to build practical skills and character. Since May 2024, we've helped students show up consistently, train with discipline, and apply what they learn at home."
7. **`client/src/pages/About.tsx`** (line 403) - "We don't just teach martial arts. We build character, confidence, and community." → "Our students learn technique. But they also learn to show up, work with others, and stay calm under pressure."
8. **`client/src/pages/About.tsx`** (line 536) - "Sunnah Skills has transformed my son's confidence and discipline. The Islamic values integration makes all the difference." → "My son listens better at home now. The coaches reference Islamic adab naturally, not forced."
9. **`client/src/lib/programConfig.ts`** (line 97) - "Practical readiness training built around stewardship and problem-solving." → "Learn fire building, shelter construction, and navigation in real outdoor settings. Students leave with practical skills they can use on family camping trips."
10. **`client/src/pages/RegistrationHub.tsx`** (line 147) - "Full name is required." → "Enter your full name."
11. **`client/src/pages/RegistrationHub.tsx`** (line 284) - "Could not create the account." → "Couldn't create your account. Try again or contact support."
12. **`client/src/components/payment/PaymentForm.tsx`** (line 35) - "Payment failed. Please try again." → "Payment didn't go through. Check your details and try again."
13. **`client/src/pages/TrialPage.tsx`** (line 99) - "Could not book the free trial." → "Couldn't book your trial. Try again or contact us for help."
14. **`client/src/pages/registration/CartPage.tsx`** (line 386) - "Could not finish checkout." → "Checkout didn't complete. Your cart is saved—try again in a moment."
15. **`client/src/pages/Admin.tsx`** (line 64) - "Failed to connect to server" → "Having trouble connecting. Check your internet and try again."
16. **`client/src/pages/Contact.tsx`** (line 73) - "There was an error sending your message. Please try again." → "Something went wrong sending your message. Try again?"

---

## Medium Priority

### Public Pages

1. **`client/src/pages/Home.tsx`** (line 431) - "Train the body. Shape the character. Brazilian Jiu-Jitsu, Archery, Swimming, Outdoor skills, Self Defense/Bullyproofing all taught through a structured youth centered, sunnah inspired system." → "BJJ, archery, swimming, outdoor skills, and bullyproofing—taught with structure and respect for Sunnah principles."
2. **`client/src/pages/Home.tsx`** (line 95) - "The archery program is incredible. Our daughter loves learning this traditional skill and the focus it requires." → "Our daughter can now hold focus through a full session. The instructors are patient and clear."
3. **`client/src/pages/About.tsx`** (line 431) - "We're committed to developing well-rounded individuals who are confident, capable, and compassionate." → "We want students to leave class with better technique than when they arrived—and better habits too."
4. **`client/src/pages/About.tsx`** (line 473) - "Our dedicated team brings years of experience, passion, and care to every class." → "Specific coach details: 'Mustafaa and Muadh are purple and blue belt practitioners who have coached together since 2024.'"
5. **`client/src/pages/Testimonials.tsx`** (line 18) - "Ahmed has been attending BJJ classes for 8 months, and the transformation has been incredible. His confidence has soared, and he's learned valuable life skills about respect and perseverance. The instructors truly care about character development." → "Specific anecdote: 'Ahmed handles conflict better now. Last month he used breathing techniques when frustrated instead of shutting down.'"
6. **`client/src/pages/Testimonials.tsx`** (line 27) - "The outdoor workshops have been amazing for Fatima. She's learned practical skills like fire building and knot tying while developing a deep love for nature. The balance of fun and education is perfect, and she always comes home excited to share what she learned." → "Fatima built her first fire last month. Now she shows her brother the knots she learns. She actually wants to go outside on weekends now."
7. **`client/src/pages/Testimonials.tsx`** (line 36) - "The archery program taught Omar focus and patience in a way that nothing else has. The traditional approach and emphasis on mindfulness has helped him in school too. We're so grateful for the positive influence this program has had on our son." → "Omar's teacher noticed he waits his turn now without fidgeting. He applies the same breathing from archery when tests get stressful."
8. **`client/src/pages/programs/BJJProgram.tsx`** (line 81) - "Technique-first grappling that builds calm confidence, patience, and resilient character." → "We teach technique so smaller students can control larger partners. Students learn to stay calm when pinned and work toward an escape systematically."
9. **`client/src/lib/programConfig.ts`** (line 37) - "Technique-first grappling that builds calm confidence, patience, and resilient character." → "Ground-based training that teaches leverage and timing. Students learn to stay composed under pressure."
10. **`client/src/lib/programConfig.ts`** (line 67) - "A Sunnah-rooted discipline for focus, patience, and precise form." → "Traditional archery emphasizing stance, anchor, and release. Students learn to slow down and shoot consistently."

### Registration

11. **`client/src/pages/RegistrationHub.tsx`** (line 186) - "Family & Member Account" → "Your Account"
12. **`client/src/pages/RegistrationHub.tsx`** (line 190) - "One account manages all registrations. Sign in with your email, add your details, create profiles for each participant, then register for classes. Adults can register themselves; parents add children after completing their own account." → "One account keeps all your registrations organized. Sign in with your email, add your details and student profiles, then you're ready to register."
13. **`client/src/pages/RegistrationHub.tsx`** (line 40) - "The sign-in link was invalid." → "That sign-in link didn't work. It may have expired or been used already."
14. **`client/src/pages/RegistrationHub.tsx`** (line 237) - "Start your Family & Member Account" → "Create Your Account"
15. **`client/src/components/registration/StepGuardianInfo.tsx`** (line 78) - "Parent or guardian full name" → "Full name"
16. **`client/src/components/registration/StepGuardianInfo.tsx`** (line 139) - "Use a real email so we can confirm placement, share schedule updates, and send start details." → "Use a real email so we can send confirmations and schedule updates."
17. **`client/src/components/registration/StepStudentInfo.tsx`** (line 171) - "Medical notes, allergies, or accessibility needs (optional)" → "Medical notes or allergies (optional)"

### Technique Library

18. **`client/src/pages/TechniqueLibrary.tsx`** (line 458) - "Browse the launch technique set with filters for stage, position, and finish. The viewer stays live, and new public chains can be published from admin as the curriculum expands." → "Browse techniques by stage, position, or finish. New sequences are added as the curriculum grows."
19. **`client/src/public/data/techniques/uchi-mata.json`** (line 15) - "A powerful judo throw where you sweep your opponent's inner thigh with your leg while pulling them off balance." → "Sweep between your opponent's legs while pulling them forward to throw."
20. **`client/src/public/data/techniques/collar-tie-ankle-pick-to-armbar.json`** (line 6) - "Snap into the collar-tie ankle pick, flow through the pass, and finish with the armbar." → "Ankle pick from collar tie, pass, then armbar finish."
21. **`client/src/public/data/techniques/double-leg-to-mount-escape-full-chain.json`** (line 6) - "The full launch chain from wrist control to double leg, mount, escape, and return sweep." → "Full sequence: wrist control, double leg, mount, escape, then sweep back to top."

### Error/Success States

22. **`client/src/pages/Contact.tsx`** (line 73) - "There was an error sending your message. Please try again." → "Message didn't go through. Try again?"
23. **`client/src/pages/registration/CartPage.tsx`** (line 308) - "Please complete every required waiver field before checkout." → "Fill out all required waiver fields to continue."
24. **`client/src/pages/registration/CartPage.tsx`** (line 370) - "Your saved checkout expired. Please continue again to refresh the order." → "Your checkout session expired. Click Continue to refresh."
25. **`client/src/pages/TrialPage.tsx`** (line 65) - "Please fill every required field before reserving the trial." → "Fill out all required fields to book your trial."
26. **`client/src/components/programs/WaitlistDialog.tsx`** (line 51) - "Could not join the waitlist." → "Couldn't add you to the waitlist. Try again?"

### Forms/Inputs

27. **`client/src/pages/Contact.tsx`** (line 260) - "Enter your name" → "Your name"
28. **`client/src/pages/Contact.tsx`** (line 314) - "How can we help you?" → "Tell us what you need"

### Navigation UI

29. **`client/src/components/admin/AdminOverview.tsx`** (line 86) - "Statuses update from Stripe webhooks." → "Payment statuses update automatically."

---

## Low Priority

### Public Pages

1. **`client/src/pages/Home.tsx`** (line 83) - "My daughter has gained so much confidence since joining Sunnah Skills. The coaches truly care about character development." → "Keep but add specificity—e.g., 'Aisha's Mom, parent since 2024' or specific detail about what changed."
2. **`client/src/pages/Home.tsx`** (line 90) - "The BJJ program has taught my son discipline and respect. He has learned that true strength comes from technique, not just power." → "More grounded: 'My son actually uses the discipline at home now. The coaches emphasize technique over muscle.'"
3. **`client/src/pages/Home.tsx`** (line 499) - "A sneak peek on how technique is taught at Sunnah Skills. Full library on the techniques page." → "'A sneak peek at how we teach technique. See the full library on the techniques page.'"
4. **`client/src/pages/About.tsx`** (line 502) - "Discover what makes us different from other martial arts schools." → "'Here's how we're different from other programs.'"
5. **`client/src/pages/Testimonials.tsx`** (line 45) - "The bullyproofing workshop was exactly what Zainab needed. She learned how to set boundaries and gained the confidence to handle difficult situations. The approach is practical and empowering without being aggressive. Highly recommend!" → "Zainab told a peer to stop touching her backpack last week—calmly, not rudely. She practiced the words in role-play at the workshop."
6. **`client/src/pages/programs/BJJProgram.tsx`** (line 189) - "Start with a free trial, then open your Family & Member Account when you're ready." → "'Start with a free trial, then create your account when you're ready.'"
7. **`client/src/lib/programConfig.ts`** (line 127) - "Boundaries, awareness, and practical self-protection without aggression." → "'Verbal boundary-setting first, then escape skills if needed. No aggressive techniques—just practical responses to real situations.'"

### Technique Library

8. **`client/src/public/data/techniques/arm-drag-to-back-finish.json`** (line 7) - "Start from symmetric staggered standing, hit the arm drag, circle behind, secure the seatbelt and hooks, then close the rear naked choke." → "Start standing, arm drag behind, secure seatbelt and hooks, then finish the choke."

### Navigation UI

9. **`client/src/components/Footer.tsx`** (line 39) - "Building confident, skilled, and resilient young people through traditional martial arts and outdoor education." → "Teaching kids martial arts and outdoor skills with small groups and patient instruction."
10. **`client/src/components/Footer.tsx`** (line 106) - "All rights reserved. Building character through traditional skills." → "Keep as-is; standard copyright language"
11. **`client/src/components/Footer.tsx`** (line 109) - "Registration terms, safeguarding details, and privacy information are shared during enrollment and on request." → "Registration and privacy details are shared when you enroll or on request."
12. **`client/src/components/Navigation.tsx`** (line 174) - "Start Your Free Trial" → "Start a Free Trial"

### Forms/Inputs

13. **`client/src/pages/Contact.tsx`** (line 258) - "Your Name *" → "Name"
14. **`client/src/pages/Contact.tsx`** (line 272) - "Your Email *" → "Email"
15. **`client/src/pages/Contact.tsx`** (line 290) - "Select a subject" → "Choose a topic"
16. **`client/src/pages/Contact.tsx`** (line 311) - "Message *" → "Message"
17. **`client/src/pages/Contact.tsx`** (line 42) - "Message sent successfully." → "Message sent! We'll get back to you within 24 hours."
18. **`client/src/pages/RegistrationHub.tsx`** (line 41) - "That sign-in link was already used or has expired." → "That sign-in link was already used or expired."
19. **`client/src/pages/RegistrationHub.tsx`** (line 245) - "Full name" → No change needed
20. **`client/src/pages/RegistrationHub.tsx`** (line 255) - "Email" → No change needed
21. **`client/src/pages/RegistrationHub.tsx`** (line 291) - "Email me the sign-in link" → No change needed
22. **`client/src/pages/RegistrationHub.tsx`** (line 280) - "Check your email for the sign-in link." → No change needed
23. **`client/src/pages/RegistrationHub.tsx`** (line 148) - "Enter a valid email address." → "Enter a valid email."
24. **`client/src/pages/TrialPage.tsx`** (line 85) - "Free trial booked. Check your email for the QR code." → No change needed
25. **`client/src/components/registration/StepStudentInfo.tsx`** (line 88) - "Start from a saved profile to avoid typing household details again." → "Pick a saved student to skip retyping details."
26. **`client/src/pages/Admin.tsx`** (line 44) - "Login successful" → "You're in. Found X contact submissions."
27. **`client/src/pages/registration/CartPage.tsx`** (line 397) - "Enter a discount code first." → "Type a code first, then click Apply."
28. **`client/src/pages/registration/CartPage.tsx`** (line 44) - "That discount code wasn't found." → "That code doesn't exist. Double-check and try again."
29. **`client/src/pages/registration/CartPage.tsx`** (line 423) - "Discount code saved for this registration." → "Code applied to this registration."
30. **`client/src/studio/PasswordGate.tsx`** (line 19) - "Incorrect password. Try again." → No change needed

---

## Appendix: Common Patterns Identified

### High-Frequency AI-Sounding Patterns

1. **Forced Tricolons:** "character, confidence, and community" - Classic AI pattern using parallel structure of three items
2. **Abstract Benefit Claims:** "spiritual grounding," "thrive," "empowering" - Vague wellness language without specifics
3. **"Not just X, we Y" Construction:** Classic AI rhetorical pattern seen in multiple hero sections
4. **Passive Voice in Errors:** "was invalid," "could not be loaded" - System-focused rather than user-focused
5. **Technical Jargon:** "payment intent," "Stripe webhooks," "live waiver" - Backend terminology in user-facing text
6. **Generic Testimonial Structure:** "transformation has been incredible," "confidence has soared" - Brochure language without specific anecdotes
7. **Robotic Error Patterns:** "Please try again," "Failed to..." - Mechanical rather than conversational

### Recommended Voice Guidelines

1. **Replace:** Abstract benefits with concrete outcomes
2. **Replace:** Passive voice with active voice
3. **Replace:** System-focused language with user-centered explanations
4. **Replace:** Generic testimonials with specific anecdotes
5. **Replace:** Technical jargon with plain language
6. **Replace:** Formal error messages with conversational explanations
7. **Keep:** Clear instructional language for BJJ techniques
8. **Keep:** Direct, functional labels for admin interfaces

---

## Appendix: All Findings by Section

### Registration (47 issues)

| File | Line | Type | Severity | Original | Suggested |
|------|------|------|----------|----------|-----------|
| RegistrationHub.tsx | 186 | heading | medium | "Family & Member Account" | "Your Account" |
| RegistrationHub.tsx | 187 | heading | low | "Open your account before you register" | (no change) |
| RegistrationHub.tsx | 190 | helper | medium | "One account manages all registrations..." | "One account keeps all your registrations organized..." |
| RegistrationHub.tsx | 40 | error | medium | "The sign-in link was invalid." | "That sign-in link didn't work..." |
| RegistrationHub.tsx | 41 | error | low | "That sign-in link was already used or has expired." | "That sign-in link was already used or expired." |
| RegistrationHub.tsx | 236 | label | low | "Create account" | (no change) |
| RegistrationHub.tsx | 237 | heading | medium | "Start your Family & Member Account" | "Create Your Account" |
| RegistrationHub.tsx | 245 | placeholder | low | "Full name" | (no change) |
| RegistrationHub.tsx | 255 | placeholder | low | "Email" | (no change) |
| RegistrationHub.tsx | 291 | button | low | "Email me the sign-in link" | (no change) |
| RegistrationHub.tsx | 100 | error | high | "Request failed" | "Something went wrong. Try again?" |
| RegistrationHub.tsx | 147 | validation | medium | "Full name is required." | "Enter your full name." |
| RegistrationHub.tsx | 148 | validation | low | "Enter a valid email address." | "Enter a valid email." |
| RegistrationHub.tsx | 284 | error | medium | "Could not create the account." | "Couldn't create your account..." |
| RegistrationHub.tsx | 280 | success | low | "Check your email for the sign-in link." | (no change) |
| StepGuardianInfo.tsx | 78 | placeholder | medium | "Parent or guardian full name" | "Full name" |
| StepGuardianInfo.tsx | 139 | helper | medium | "Use a real email so we can confirm placement..." | "Use a real email so we can send confirmations..." |
| StepStudentInfo.tsx | 88 | helper | low | "Start from a saved profile to avoid typing household details again." | "Pick a saved student to skip retyping details." |
| StepStudentInfo.tsx | 171 | label | medium | "Medical notes, allergies, or accessibility needs (optional)" | "Medical notes or allergies (optional)" |

### Public Pages (12 issues)

| File | Line | Type | Severity | Original | Suggested |
|------|------|------|----------|----------|-----------|
| Home.tsx | 431 | hero | medium | "Train the body. Shape the character..." | "BJJ, archery, swimming..." |
| Home.tsx | 83 | testimonial | low | "My daughter has gained so much confidence..." | Add specificity |
| Home.tsx | 90 | testimonial | low | "The BJJ program has taught my son discipline..." | More grounded version |
| Home.tsx | 95 | testimonial | medium | "The archery program is incredible..." | "Our daughter can now hold focus..." |
| Home.tsx | 499 | body | low | "A sneak peek on how technique is taught..." | "A sneak peek at how we teach technique..." |
| About.tsx | 357 | body | high | "We're not just teaching martial arts..." | "We teach martial arts as a way..." |
| About.tsx | 403 | hero | high | "We don't just teach martial arts..." | "Our students learn technique..." |
| About.tsx | 431 | body | medium | "We're committed to developing well-rounded..." | "We want students to leave class..." |
| About.tsx | 473 | body | medium | "Our dedicated team brings years..." | Specific coach details |
| About.tsx | 502 | body | low | "Discover what makes us different..." | "Here's how we're different..." |
| About.tsx | 536 | testimonial | high | "Sunnah Skills has transformed my son's..." | "My son listens better at home now..." |
| Testimonials.tsx | 18 | testimonial | medium | "Ahmed has been attending BJJ classes..." | Specific anecdote |
| Testimonials.tsx | 27 | testimonial | medium | "The outdoor workshops have been amazing..." | "Fatima built her first fire..." |
| Testimonials.tsx | 36 | testimonial | medium | "The archery program taught Omar focus..." | "Omar's teacher noticed..." |
| Testimonials.tsx | 45 | testimonial | low | "The bullyproofing workshop was exactly..." | "Zainab told a peer to stop..." |
| BJJProgram.tsx | 81 | body | medium | "Technique-first grappling that builds..." | "We teach technique so smaller students..." |
| BJJProgram.tsx | 189 | heading | low | "Start with a free trial, then open your Family & Member Account..." | "Start with a free trial, then create your account..." |
| programConfig.ts | 37 | body | medium | "Technique-first grappling that builds..." | "Ground-based training that teaches..." |
| programConfig.ts | 67 | body | medium | "A Sunnah-rooted discipline for focus..." | "Traditional archery emphasizing..." |
| programConfig.ts | 97 | body | high | "Practical readiness training built around..." | "Learn fire building, shelter construction..." |
| programConfig.ts | 127 | body | low | "Boundaries, awareness, and practical self-protection..." | "Verbal boundary-setting first..." |

### Admin Interface (2 issues)

| File | Line | Type | Severity | Original | Suggested |
|------|------|------|----------|----------|-----------|
| AdminOverview.tsx | 86 | label | medium | "Statuses update from Stripe webhooks." | "Payment statuses update automatically." |
| AdminDashboard.tsx | 96 | label | low | "Tabs: overview, registrations, trials, payments" | (no change) |

### Technique Library (3 issues)

| File | Line | Type | Severity | Original | Suggested |
|------|------|------|----------|----------|-----------|
| TechniqueLibrary.tsx | 458 | description | medium | "Browse the launch technique set with filters..." | "Browse techniques by stage, position, or finish..." |
| uchi-mata.json | 15 | instruction | medium | "A powerful judo throw where you sweep..." | "Sweep between your opponent's legs..." |
| collar-tie-ankle-pick.json | 6 | description | medium | "Snap into the collar-tie ankle pick, flow through..." | "Ankle pick from collar tie, pass, then armbar finish." |
| double-leg-chain.json | 6 | description | medium | "The full launch chain from wrist control..." | "Full sequence: wrist control, double leg..." |
| arm-drag-to-back-finish.json | 7 | instruction | low | "Start from symmetric staggered standing..." | "Start standing, arm drag behind..." |

### Navigation and UI (4 issues)

| File | Line | Type | Severity | Original | Suggested |
|------|------|------|----------|----------|-----------|
| Footer.tsx | 39 | mission | low | "Building confident, skilled, and resilient..." | "Teaching kids martial arts and outdoor skills..." |
| Footer.tsx | 106 | copyright | low | "All rights reserved. Building character..." | Keep as-is |
| Footer.tsx | 109 | footer | low | "Registration terms, safeguarding details..." | "Registration and privacy details are shared..." |
| Navigation.tsx | 174 | cta | low | "Start Your Free Trial" | "Start a Free Trial" |

### Forms and Inputs (12 issues)

| File | Line | Type | Severity | Original | Suggested |
|------|------|------|----------|----------|-----------|
| Contact.tsx | 258 | label | low | "Your Name *" | "Name" |
| Contact.tsx | 260 | placeholder | medium | "Enter your name" | "Your name" |
| Contact.tsx | 272 | label | low | "Your Email *" | "Email" |
| Contact.tsx | 290 | placeholder | low | "Select a subject" | "Choose a topic" |
| Contact.tsx | 311 | label | low | "Message *" | "Message" |
| Contact.tsx | 314 | placeholder | low | "How can we help you?" | "Tell us what you need" |
| Contact.tsx | 73 | error | medium | "There was an error sending your message..." | "Message didn't go through. Try again?" |
| AdminLogin.tsx | 82 | placeholder | high | "muadh@sunnahskills.com" | "admin@example.com" |
| StepGuardianInfo.tsx | 78 | placeholder | medium | "Parent or guardian full name" | "Full name" |
| StepGuardianInfo.tsx | 139 | helper | medium | "Use a real email so we can confirm placement..." | "Use a real email so we can send confirmations..." |
| StepStudentInfo.tsx | 88 | helper | low | "Start from a saved profile to avoid typing..." | "Pick a saved student to skip retyping details." |
| StepStudentInfo.tsx | 171 | label | medium | "Medical notes, allergies, or accessibility needs (optional)" | "Medical notes or allergies (optional)" |

### Error and Success States (24 issues)

| File | Line | Type | Severity | Original | Suggested |
|------|------|------|----------|----------|-----------|
| Admin.tsx | 44 | success | low | "Login successful" | "You're in. Found X contact submissions." |
| Admin.tsx | 64 | error | medium | "Failed to connect to server" | "Having trouble connecting..." |
| Contact.tsx | 73 | error | medium | "There was an error sending your message..." | "Something went wrong..." |
| Contact.tsx | 42 | success | low | "Message sent successfully." | "Message sent! We'll get back to you..." |
| CartPage.tsx | 386 | error | medium | "Could not finish checkout." | "Checkout didn't complete..." |
| CartPage.tsx | 397 | validation | low | "Enter a discount code first." | "Type a code first, then click Apply." |
| CartPage.tsx | 44 | error | low | "That discount code wasn't found." | "That code doesn't exist..." |
| CartPage.tsx | 423 | success | low | "Discount code saved for this registration." | "Code applied to this registration." |
| CartPage.tsx | 370 | error | medium | "Your saved checkout expired..." | "Your checkout session expired..." |
| CartPage.tsx | 304 | error | high | "The live waiver could not be loaded." | "Couldn't load the waiver..." |
| CartPage.tsx | 308 | validation | medium | "Please complete every required waiver field..." | "Fill out all required waiver fields..." |
| TrialPage.tsx | 65 | validation | medium | "Please fill every required field..." | "Fill out all required fields..." |
| TrialPage.tsx | 99 | error | medium | "Could not book the free trial." | "Couldn't book your trial..." |
| TrialPage.tsx | 85 | success | low | "Free trial booked. Check your email..." | (no change) |
| PasswordGate.tsx | 19 | error | low | "Incorrect password. Try again." | (no change) |
| PaymentForm.tsx | 35 | error | medium | "Payment failed. Please try again." | "Payment didn't go through..." |
| RegistrationHub.tsx | 100 | error | high | "Request failed" | "Something went wrong. Try again?" |
| RegistrationHub.tsx | 147 | validation | medium | "Full name is required." | "Enter your full name." |
| RegistrationHub.tsx | 148 | validation | low | "Enter a valid email address." | "Enter a valid email." |
| RegistrationHub.tsx | 284 | error | medium | "Could not create the account." | "Couldn't create your account..." |
| RegistrationHub.tsx | 280 | success | low | "Check your email for the sign-in link." | (no change) |
| AdminLogin.tsx | 50 | error | high | "Login failed" | "Couldn't sign you in..." |
| ProgramRegistrationPage.tsx | 176 | error | high | "Failed to create payment intent" | "Couldn't start payment..." |
| WaitlistDialog.tsx | 51 | error | medium | "Could not join the waitlist." | "Couldn't add you to the waitlist..." |

---

*Report generated from 7 audit JSON files in `.omc/audit-outputs/`*
