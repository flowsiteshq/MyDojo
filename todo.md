# MyDojo Website TODO

## IN PROGRESS

- [x] Fix Kai chatbot TypeScript errors in TrialChatbot, CurriculumViewer, InstructorFeedbackPanel, QRScanner (0 TS errors now)


- [x] Lead magnet pop-up system for email capture ("5 Self-Defense Moves Every Parent Should Teach Their Child")
  - [x] Database table created for lead magnet captures
  - [x] tRPC mutation for saving email captures with duplicate detection
  - [x] Resend email delivery with branded HTML guide
  - [x] Pop-up UI component with 15s timed trigger + exit-intent trigger
  - [x] Cookie/localStorage to prevent showing again to same user
  - [x] Success state with CTA to book free trial
  - [x] Owner notification on new signup
  - [x] Integrated into Layout component
  - [x] Vitest unit tests passing


- [x] Redesign Top Ninjas leaderboard section to match TOP WARRIORS design with white card background, medal icons, profile photos, and large red class count numbers

- [x] Integrate camera-based QR code scanner using html5-qrcode library
  - [x] Install html5-qrcode library
  - [x] Add QR scanner component with camera activation
  - [x] Implement QR code detection and student lookup logic

- [x] Make kiosk interface scrollable for different screen sizes

- [x] Fix text overlap - READY TO TRAIN covering logo at top of kiosk screen

- [x] Fix text overlap on kiosk idle screen
- [x] Add MyDojo logo to kiosk check-in page
- [x] Implement functional QR code scanner

- [x] Add real-time class display to kiosk idle screen showing upcoming class name and start time

- [x] Fix overlapping text on kiosk idle screen - MYDOJO logo overlaps with READY TO TRAIN headline

- [x] Implement Kiosk 3.0 with dynamic energy and intelligence layer
  - [x] Refine layout: smaller headline, better spacing, prominent energy ring, glow effects
  - [x] Add animated scanner line inside QR box
  - [x] Structure right sidebar into 3 clear cards with shadows and rounded corners
  - [x] Add student confirmation screen with photo/name/belt/streak/XP
  - [x] Add full-screen success animation with confetti and auto-return to idle

- [x] Redesign kiosk with new 70/30 split layout - white left side with logo, energy ring, button, QR scanner; black right sidebar with birthday banner, Top Ninjas leaderboard, rotating streak stats

- [x] Add personalized welcome message to kiosk success screen with student name and conditional messaging

- [x] Redesign kiosk check-in interface to match professional quality from reference image

- [x] Build /admin/classes page with full CRUD (create, edit, delete, toggle active) for class schedule management

- [ ] Redesign student dashboard to match modern design - blue gradient header with navigation tabs, left sidebar with profile and actions, current lesson card with hero image, progress widgets (circular chart, upcoming class, achievements badges), announcements section, latest messages with avatars, training resources cards

- [x] Automatically cancel Stripe subscription when admin approves a cancellation request - integrate Stripe API to cancel subscription and update enrollment status

- [x] Implement membership pause/cancel request system - members can request to pause or cancel, admin must approve before action is taken (UI complete, backend procedures working, tests need Drizzle ORM refactor)

- [x] Add My Account link to mobile hamburger menu for smartphone users

- [x] Add Sign Out button to member dashboard for secure logout

- [x] Add prominent "My Account" link to header navigation for logged-in members

- [x] Add "Student Login" navigation link to footer at bottom of page

- [x] Build secure member dashboard - display subscription status, upcoming class schedules, payment history from Stripe, account management options

- [x] Make payment breakdown tooltip mobile-friendly with touch interaction support

- [x] Add payment breakdown tooltip to membership plan cards - show first payment calculation (monthly price + $99 down payment)

- [x] Add $99 down payment to all three membership plans (Foundation, Black Belt, Leadership) - update Stripe products with setup fee, modify checkout flow to display down payment

- [x] Switch Stripe from test mode to live mode - create products/prices in live Stripe account, update database with live price IDs

- [x] Implement Stripe checkout integration for membership enrollment - create checkout session, generate URL, display button, handle webhook (COMPLETE - Stripe products and prices created successfully)

## CRITICAL BUGS

- [x] Explore Membership Plans button on dashboard not working - Fixed by redirecting to homepage with enroll parameter that auto-opens IntakeChatbot

- [x] Student Login link in footer not working when clicked - Fixed by adding onClick handler that checks auth status and redirects to dashboard or login page

- [x] Stripe checkout still failing after database update - Fixed by updating server code to use STRIPE_LIVE_SECRET_KEY instead of STRIPE_SECRET_KEY

- [x] Stripe checkout link creation failing - "Sorry, there was an issue creating your enrollment checkout" error - Fixed by creating live Stripe products and updating database with correct price IDs

- [x] Fix TypeError in tooltip: plan.monthlyPrice is string, needs Number() conversion before .toFixed()

- [x] Fix NAME step to reject non-name inputs (e.g., "I'd like to enroll my son" should not be accepted as a name)
- [x] SLOTS step not displaying available schedules - says "Let me show you available trial slots" but shows nothing
- [x] Missing enrollment vs trial question - need to ask if client wants to enroll (membership) or book trial class
- [x] Enrollment selection creates infinite loop - says "coming soon" but doesn't show membership plans or route to enrollment flow
- [x] INTENT step accepts any text input (e.g., "14") instead of only accepting "trial" or "enroll" keywords (WORKING AS INTENDED - re-prompts correctly)
- [x] PLAN_SELECTION handler shows wrong error message "Missing required information (name, phone, or program)" when plan is selected (FIXED - added intent check to route enrollment vs trial)

## State Machine POC - Full Intake & Booking Flow (PRIORITY)

### Scope Expansion
- Full flow: name → phone → email → classFor → child age → program → intro bookings (2x for kids) → confirmation
- New simplified IntakeChatbot component (separate from legacy TrialChatbot)
- Full-screen mobile (100vh/100dvh), not popup
- Dev debug ribbon showing: nextStep | classFor | childAge | segment | introBookedCount | emailSkipped

### Backend - Simplified State Machine
- [x] Create intake-specific state machine (name → phone → email → confirmation)
- [x] Expand to full flow (classFor, child age, program, intro bookings)
- [x] Implement state persistence in conversation_states table
- [x] Add input validation with re-prompt logic (1 retry, then help)
- [x] Support messy input formats: phone (multiple formats), name (extra words/emojis), email (trailing punctuation)
- [x] Implement "skip email" detection and handling
- [x] Prevent repeated questions once field is validated and captured

### Backend - tRPC Procedure
- [x] Create chat.intakeStep(message, sessionId) procedure
- [x] Return: assistantMessage, state, collectedFields, nextExpectedField, availableSlots, quickReplies
- [x] Persist state server-side on every interaction
- [x] Add intake_complete flag when flow finishes
- [x] Create or update conversation state in DB
- [x] Support full flow with intro slot booking

### Frontend - Chat UI Integration
- [x] Create new IntakeChatbot component (separate from TrialChatbot)
- [x] Full-screen mobile UI (100dvh)
- [x] Call chat.intakeStep tRPC procedure
- [x] Display quick reply buttons for classFor
- [x] Display slot cards for intro class booking
- [x] Add dev debug ribbon (nextStep, classFor, childAge, segment, introBookedCount, emailSkipped)
- [x] Ensure Enter-to-send works for multi-message conversation
- [x] Handle state updates from backend
- [x] Wire main CTA buttons to launch IntakeChatbot
- [x] Keep TrialChatbot as legacy fallback (?bot=legacy)

### Testing
- [ ] Unit tests for state transitions (name → phone → email → confirmation)
- [ ] Unit tests for input validation (phone formats, name parsing, email skip)
- [ ] Unit test: never asks same question twice
- [ ] Unit test: invalid input triggers re-prompt once, then help
- [ ] Manual test script: verify no loops in conversation
- [ ] Manual test: skip email and continue without loop
- [ ] Manual test: messy inputs are handled correctly

### Feature Flag
- [ ] Add USE_STATE_MACHINE_INTAKE environment variable
- [ ] Gate new intake flow behind feature flag
- [ ] Keep existing chatbot as fallback

## Acceptance Criteria
- [ ] Never asks the same question twice if value is captured and validated
- [ ] Invalid input → corrected re-prompt once → offers help/example format
- [ ] "Skip email" works and continues without looping
- [ ] Handles phone formats: 281-818-9288, (281) 818 9288, 2818189288, +1 281...
- [ ] Handles name with extra words ("my name is...", emojis, etc.)
- [ ] Handles email with trailing punctuation
- [ ] State persisted server-side (survives page refresh)
- [ ] Collected fields panel shows current state
- [ ] All unit tests pass

---

## Previous Features (Completed)

### Add Digital Signature Form to Waiver Page
- [x] Create waiver_signatures database table with fields: name, phone, email, ipAddress, signedAt, waiverVersion
- [x] Add tRPC procedure for submitting waiver signature
- [x] Update waiver page with signature form (name, phone, email inputs)
- [x] Add checkbox for "I have read and agree to the terms above"
- [x] Add submit button to save waiver signature to database
- [x] Show confirmation message after successful submission
- [x] Add validation to ensure all fields are filled before submission

### Add QR Code to Waiver Confirmation Page
- [x] Install QR code generation library (qrcode.react)
- [x] Update waiver submission to return unique waiver ID
- [x] Generate QR code containing waiver ID and signature details
- [x] Display QR code on confirmation screen after successful submission
- [x] Add instructions for showing QR code at front desk
- [x] Test QR code generation and display

## Fix Booking Reliability Issues (PRIORITY)

### Server-Side Preflight Validation
- [x] Verify leadId exists before booking
- [x] Verify selectedSlotId exists and is still available
- [x] Verify required fields for flow are present (name, phone, program, etc.)
- [x] Verify introBookedCount rules (kids 3-12 need 2 intros)
- [x] Return validation errors with clear recovery path

### Idempotent Booking
- [x] Generate bookingRequestId (UUID) on client when user taps Confirm
- [x] Pass bookingRequestId to booking tRPC procedure
- [x] Server stores/locks bookingRequestId in database
- [x] Return same appointment if bookingRequestId is repeated (prevent double-booking)
- [x] Add bookingRequestId field to trial_signups table

### Graceful Slot Conflict Handling
- [ ] Check if slot is still available before creating appointment
- [ ] If slot taken, don't throw generic error
- [ ] Return friendly message: "That time just got booked. Here are the next best times."
- [ ] Generate and return new slot cards immediately
- [ ] Allow user to select alternative slot without restarting flow

### Robust Error Handling
- [x] Wrap booking procedure in try/catch
- [x] Log errors with: conversationId, leadId, selectedSlotId, nextStep, bookingRequestId, error stack
- [x] If appointment created but confirmation failed, return appointment details from DB
- [x] Always render confirmation card if appointment exists
- [x] Return friendly recovery response: "Quick hiccup — want me to try that again or pick a different time?"
- [x] Provide retry button + alternative slots

### UI Improvements
- [x] Disable Confirm button after first tap (via isProcessing state)
- [x] Show spinner/loading state during booking
- [x] Don't allow second tap until success/fail response returns
- [x] Show clear confirmation or error state

### Acceptance Tests
- [ ] Test: Tap Confirm twice quickly → only one appointment created
- [ ] Test: Slot unavailable → user sees alternative slots, no generic error
- [ ] Test: Backend throws error → user sees retry + alternative slots, flow continues
- [ ] Test: Partial success (appointment created but confirmation failed) → still shows confirmation


## Implement Atomic, Transaction-Safe Booking (CRITICAL)

### Atomic Booking with DB Transactions
- [x] Wrap entire booking logic in database transaction
- [x] Step 1: Validate slot availability with SELECT FOR UPDATE lock
- [x] Step 2: Create appointment record in trial_signups
- [x] Step 3: Update introBookedCount if intro flow
- [x] Step 4: Commit transaction
- [x] If any step fails, rollback cleanly and return structured error

### Enhanced Idempotency
- [x] Ensure bookingRequestId is generated client-side on Confirm click
- [x] Server checks if bookingRequestId already processed before transaction
- [x] If processed, return existing appointment (no duplicate booking)
- [x] Prevent double-bookings from rapid double-clicks

### Structured Error Responses
- [x] Never throw raw errors to UI
- [x] Return structured response: { success, reason, alternatives?, appointment? }
- [x] Reason codes: "slot_unavailable" | "validation_error" | "server_error"
- [x] Include alternative slots when slot_unavailable

### Slot Conflict Handling
- [ ] Check slot availability before creating appointment
- [ ] If slot unavailable, immediately return alternative available slots
- [ ] Do NOT break flow - allow user to select alternative
- [ ] Generate next 6 available slots as alternatives

### Appointment Recovery Logic
- [x] If appointment created but confirmation message failed, query DB
- [x] Check for existing appointment by bookingRequestId
- [x] If exists, return success with confirmation card
- [x] Prevent "partial success" confusion

### UI Loading States
- [x] Disable Confirm button on first click (via isProcessing state)
- [x] Show spinner during booking process
- [x] Do not allow second submit until response received
- [x] Clear loading state on success or error

### Acceptance Tests
- [ ] Test: Rapid double-click Confirm → only one appointment created
- [ ] Test: Slot conflict → user sees alternative times, no crash
- [ ] Test: Server error → friendly retry message, flow continues
- [ ] Test: Partial failure → appointment still confirmed if created


## Fix Drizzle INSERT Error in Atomic Booking (CRITICAL)

- [x] Remove undefined/default fields from booking insert data
- [x] Ensure only explicitly set fields are included in INSERT
- [x] Fix program name mapping (Core Kids → Dragon Kids)
- [x] Implement direct MySQL query bypass for booking insert
- [x] Add segment value mapping (KIDS_6_12 → Kids 6-12)
- [x] Test end-to-end booking flow
- [x] Verify booking creates appointment successfully

## Add After School and Summer Camp Programs to IntakeChatbot

- [x] Update state machine to include After School program option
- [x] Update state machine to include Summer Camp program option
- [x] Add program selection step after classFor for adults (Karate/Kickboxing/After School)
- [x] Add program selection for children (include After School and Summer Camp as options)
- [x] Update segment mapping to handle After School and Summer Camp
- [ ] Test full flow with After School selection
- [ ] Test full flow with Summer Camp selection

## Integrate Stripe Payment for Membership Enrollments (PRIORITY)

### Enable Stripe Feature
- [x] Stripe SDK installed and configured
- [x] Stripe API keys configured (test and live modes)
- [x] Stripe webhook endpoint configured at /api/stripe/webhook

### Create Membership Packages Database Schema
- [x] Created membershipPackages table with: id, name, monthlyPrice, registrationFee, description, benefits (JSON)
- [x] Created enrollments table with: id, leadId, packageId, stripeSubscriptionId, stripeCustomerId, status, createdAt
- [x] Seeded database with three packages: Foundation ($149/mo), Black Belt ($199/mo), Leadership ($249/mo)
- [x] Updated to month-to-month billing with 60-day cancellation notice

### Build Stripe Checkout Flow
- [x] Create Stripe products and prices for membership packages (Foundation, Black Belt, Leadership)
- [x] Implement enrollment.createCheckoutSession(packageId, leadId) procedure
- [x] Generate Stripe Checkout Session with recurring subscription line items
- [x] Handle success URL: /enrollment/success?session_id={CHECKOUT_SESSION_ID}
- [x] Handle cancel URL: /enrollment/cancel
- [x] Create enrollment.getCheckoutSession(sessionId) to retrieve session details
- [x] Store Stripe customer ID and subscription ID in enrollments table

### Update IntakeChatbot State Machine
- [x] Add ENROLLMENT_OFFER step after trial booking confirmation
- [x] Present three membership packages with pricing cards (Foundation, Black Belt, Leadership)
- [x] Add quick reply buttons for package selection
- [x] Add ENROLLMENT_PACKAGE step: handle package selection and offer checkout
- [ ] Implement checkout link generation in chat router
- [ ] Handle enrollment flow: offer → package selection → checkout → confirmation

### Webhook Handling for Subscription Events
- [x] Implement webhook handler for checkout.session.completed (create enrollment record)
- [x] Implement webhook handler for customer.subscription.created (activate subscription)
- [x] Implement webhook handler for customer.subscription.updated (update status)
- [x] Implement webhook handler for customer.subscription.deleted (cancel subscription)
- [x] Implement webhook handler for invoice.payment_failed (handle failed payments)
- [x] Update enrollment status based on subscription lifecycle (active, past_due, canceled)
- [x] Verify webhook signature for security

### Testing
- [ ] Test Foundation package enrollment flow end-to-end
- [ ] Test Black Belt package enrollment flow end-to-end
- [ ] Test Leadership package enrollment flow end-to-end
- [ ] Test Stripe webhook events update enrollment status correctly
- [ ] Test subscription cancellation handling
- [ ] Verify enrollment records are created after successful checkout

## Update Membership to Month-to-Month with 60-Day Cancellation

- [x] Update membershipPackages pricing: $150→$149, $200→$199, $250→$249, $99→$98, $295→$294
- [x] Change membership structure from fixed-term to month-to-month recurring
- [x] Add 60-day cancellation notice requirement to terms
- [ ] Update enrollment flow to use Stripe recurring subscriptions instead of one-time payments
- [ ] Remove "duration months" concept - all memberships are ongoing until cancelled
- [ ] Update pricing display to show monthly rates with cancellation policy

## Add Proper Error Logging to Booking Procedure (CRITICAL)

- [x] Wrap booking logic in try/catch block
- [x] Log exact MySQL error message to console with full stack trace
- [x] Return structured error response with debugMessage field containing raw error
- [x] Stop retry loops - return error immediately on first failure
- [x] Update intakeStep procedure to handle and display error responses
- [ ] Test error logging by triggering a booking failure

## Fix Segment Data Truncation Error (CRITICAL)

- [x] Check database schema for correct segment enum values
- [x] Fix segment mapping in atomicBooking.ts to match database enum format
- [x] Verify KIDS_6_12 maps to correct database value ('Kids 6-12')
- [ ] Test booking flow with Dragon Kids program (age 8)
- [ ] Verify booking creates appointment successfully without truncation error

## Build Complete In-Chat Enrollment Flow (PRIORITY)

### Database Schema Updates
- [ ] Create students table with: id, leadId, name, dateOfBirth, age, address, city, state, zip, emergencyContactName, emergencyContactPhone, program, status, createdAt
- [ ] Create guardians table with: id, studentId, name, phone, email, relationship, isPrimary, createdAt
- [ ] Create enrollment_intents table with: id, studentId, planId, amount, stripePaymentIntentId, status, createdAt
- [ ] Create waiver_signatures_v2 table with: id, studentId, guardianId, waiverVersion, signedAt, ipAddress, acceptedLiability, acceptedPhotoConsent
- [ ] Update trial_signups to link to studentId for tracking

### Enrollment State Machine
- [ ] Create enrollmentStateMachine.ts with steps: NAME → PHONE → EMAIL → CLASS_FOR → CHILD_AGE → STUDENT_INFO → GUARDIAN_INFO → PLAN_SELECTION → PAYMENT → WAIVER → SCHEDULING → CONFIRMATION
- [ ] Implement name + phone (required), email (optional with skip)
- [ ] Implement classFor (self/child/other) with quick replies
- [ ] Implement childAge with auto program recommendation (3-5 Little Ninjas, 6-12 Core Kids, 13-17 Teens)
- [ ] Implement studentInfo collection: studentName, DOB/age, address, zip, emergency contact
- [ ] Implement guardianInfo collection for minors: guardianName, guardianPhone, guardianEmail
- [ ] Implement plan selection with 2-3 membership options (highlight "Most Popular")
- [ ] Implement payment step with Stripe checkout link generation
- [ ] Implement waiver e-sign with acceptance confirmation
- [ ] Implement scheduling: kids book TWO intro classes Mon-Thu 5:30, others book trial slot
- [ ] Implement confirmation card with program, plan, amount paid, schedule, calendar link, directions, what to bring

### Backend Procedures
- [x] Create enrollment.upsertLead(name, phone, email, source) procedure
- [x] Create enrollment.upsertStudent(leadId, name, dob, age, address, zip, emergencyContact, program) procedure
- [x] Create enrollment.upsertGuardian(studentId, name, phone, email, relationship) procedure
- [x] Create enrollment.fetchPlans(location, program) procedure
- [x] Create enrollment.createEnrollmentIntent(planId, studentId, amount) procedure
- [x] Create enrollment.createPaymentLink(intentId, studentId, customerEmail) procedure
- [x] Create enrollment.createWaiverLink(studentId, guardianId) procedure
- [x] Create enrollment.recordWaiverSignature(studentId, waiverVersion, timestamp, ip) procedure
- [x] Create enrollment.bookClass(slotId, studentId, type) procedure with idempotency
- [x] Create enrollment.sendConfirmation(studentId, enrollmentId) procedure

### Payment Integration
- [ ] Generate Stripe checkout session for enrollment payment (deposit or full)
- [ ] Handle payment success webhook to activate enrollment
- [ ] Handle payment failure with staff follow-up offer
- [ ] Store payment intent ID for idempotency

### Waiver Integration
- [ ] Generate unique waiver link for student/guardian
- [ ] Record waiver signature with timestamp and IP
- [ ] Verify waiver completion before scheduling classes
- [ ] Handle waiver skip with staff follow-up

### Scheduling Integration
- [ ] Book TWO intro classes for kids (3-12) Mon-Thu 5:30 PM
- [ ] Book single trial slot for teens/adults
- [ ] Handle slot conflicts with alternative times
- [ ] Use bookingRequestId for idempotency

### UX Requirements
- [ ] Never repeat completed steps
- [ ] No filler phrases ("let me help with that" banned)
- [ ] Every assistant turn ends with question/buttons/slots/confirmation
- [ ] If payment/booking fails: save lead/student and offer staff follow-up + alternate times
- [ ] Show progress indicator during enrollment flow

### Testing
- [ ] Test full enrollment flow: name → phone → email → child age 8 → student info → guardian info → plan selection → payment → waiver → 2 intro bookings → confirmation
- [ ] Test adult enrollment flow (no guardian, no intro classes)
- [ ] Test payment failure handling
- [ ] Test waiver signature recording
- [ ] Test booking idempotency
- [ ] Verify all student/guardian records created correctly

## Build Enrollment Chat Router (PRIORITY)

### Core Router Implementation
- [x] Create enrollmentChatRouter.ts with processEnrollmentMessage procedure
- [x] Load/save enrollment state from conversationStates table
- [x] Integrate enrollmentStateMachine.ts for step transitions
- [x] Handle state persistence across chat sessions
- [x] Return assistant message, quick replies, and next expected field

### Multi-Field Student Info Collection
- [x] Create sub-state for STUDENT_INFO step with fields: studentName, DOB, address, city, state, zip, emergencyContactName, emergencyContactPhone
- [x] Implement field-by-field collection with validation
- [x] Handle "skip" for optional fields (address details)
- [x] Auto-advance to next field after successful validation
- [x] Call enrollment.upsertStudent after all fields collected
- [x] Store studentId in enrollment state

### Multi-Field Guardian Info Collection
- [x] Create sub-state for GUARDIAN_INFO step with fields: guardianName, guardianPhone, guardianEmail, guardianRelationship
- [x] Only trigger for minors (age < 18)
- [x] Implement field-by-field collection with validation
- [x] Handle email skip with "skip" keyword
- [x] Call enrollment.upsertGuardian after all fields collected
- [x] Store guardianId in enrollment state

### Plan Selection Integration
- [x] Fetch membership plans with enrollment.fetchPlans
- [x] Format plans with pricing, benefits, and "Most Popular" badge
- [x] Present as formatted message with quick reply buttons
- [x] Parse user selection (Foundation/Black Belt/Leadership)
- [x] Call enrollment.createEnrollmentIntent with selected plan
- [x] Store planId and intentId in enrollment state

### Payment Link Generation
- [x] Call enrollment.createPaymentLink with intentId, studentId, customerEmail
- [x] Present checkout URL as clickable link
- [x] Explain: "Click to complete payment (registration fee + first month)"
- [x] Store checkoutUrl in enrollment state
- [x] Advance to WAIVER step after user confirms "payment completed"

### Waiver Signing Flow
- [x] Call enrollment.createWaiverLink with studentId, guardianId
- [x] Present waiver URL as clickable link
- [x] Explain liability and photo consent terms
- [x] Wait for user confirmation "I've signed the waiver"
- [x] Call enrollment.recordWaiverSignature with timestamp and IP
- [x] Advance to SCHEDULING step

### Class Scheduling Flow
- [x] Check if introRequired (kids 3-12) or trial (teens/adults)
- [x] For kids: fetch 2 intro slots Mon-Thu 5:30 PM from getIntroSlots()
- [x] Present slots as quick reply buttons with date/time
- [x] Book first intro slot with enrollment.bookClass(slotId, studentId, "intro")
- [x] Book second intro slot (different date) with enrollment.bookClass
- [ ] For teens/adults: fetch trial slots and book single slot (placeholder)
- [x] Handle booking conflicts with alternative times
- [x] Advance to CONFIRMATION step

### Confirmation Card
- [x] Format confirmation message with all enrollment details
- [x] Include: student name, program, plan name, amount paid, schedule (intro #1 and #2 or trial)
- [x] Add calendar link for scheduled classes
- [x] Add directions to location
- [x] Add "What to bring" checklist
- [ ] Call enrollment.sendConfirmation (placeholder)
- [x] Mark enrollment as COMPLETE

### Error Handling
- [ ] Handle payment failure: save progress, offer staff follow-up
- [ ] Handle waiver skip: save progress, offer staff follow-up
- [ ] Handle booking conflicts: show alternative times
- [ ] Handle database errors: retry with exponential backoff
- [ ] Never lose collected data - always save to conversationStates

### UX Requirements
- [x] Never repeat completed steps
- [x] No filler phrases ("let me help with that" banned)
- [x] Every assistant turn ends with question/buttons/slots/confirmation
- [x] Show progress indicator: "Step 3 of 9: Student Information"
- [x] Clear, concise messages (max 3 sentences per turn)

## Fix Checkout Link Generation (URGENT)

- [x] Update enrollmentChatRouter.ts handlePayment() to call enrollment.createPaymentLink procedure
- [x] Pass intentId, studentId, customerEmail from enrollment state
- [x] Store returned checkoutUrl in state.checkoutUrl
- [x] Present actual Stripe checkout link to user instead of placeholder
- [ ] Test end-to-end: select plan → generate link → verify Stripe checkout opens

## Add Debug Logging to Enrollment Flow (URGENT)

- [x] Log full conversation state object at each step transition
- [x] Log nextStep, leadId, studentId, selectedPlanId, paymentIntentId before payment link generation
- [x] Log exact SQL errors with query and parameters
- [x] Log exact Stripe API errors with request/response details
- [x] Return structured debug info in dev mode instead of generic error messages
- [x] Remove "Quick hiccup" and other error-masking phrases

## Add Intent Detection for Intelligent Flow Switching (PRIORITY)

### Intent Detection Layer
- [x] Create detectIntent() function that analyzes user message for high-level intent
- [x] Use LLM to classify intent into: enroll_now, pricing_question, schedule_only, general_question, intake_continue
- [x] Call detectIntent() before resolveNextStep() in enrollmentChatRouter
- [x] Log detected intent for debugging

### Flow Mode State Management
- [x] Add flowMode field to EnrollmentState: "trial" | "enrollment"
- [x] Default flowMode to "trial" for new conversations
- [x] Switch flowMode to "enrollment" when intent = enroll_now detected
- [x] Store flowMode in conversationStates.enrollmentState JSON

### Enrollment Fast Path Implementation
- [ ] When intent = enroll_now, override nextStep to jump to enrollment flow
- [ ] Skip trial booking steps (location selection, slot booking)
- [ ] Reuse already-collected fields (name, phone, email) without re-asking
- [ ] Begin enrollment-specific data collection: studentName, DOB, address, emergency contact
- [ ] For minors: collect guardian info immediately after student info
- [ ] Present membership plans after all enrollment data collected
- [ ] Proceed to payment → waiver → intro scheduling → confirmation

### resolveNextStep() Flow Mode Logic
- [ ] Update resolveNextStep() to check state.flowMode
- [ ] If flowMode = "trial": follow trial booking flow (location → program → slot → confirmation)
- [ ] If flowMode = "enrollment": follow enrollment flow (student info → guardian info → plans → payment → waiver → scheduling → confirmation)
- [ ] Never ask redundant questions - check if field already exists in state before asking

### Intent-Based Overrides
- [ ] If intent = pricing_question: present membership plans immediately, then ask if they want to enroll
- [ ] If intent = schedule_only: jump to scheduling step (trial or intro classes based on program)
- [ ] If intent = general_question: answer question, then continue current flow
- [ ] If intent = intake_continue: proceed with normal resolveNextStep() logic

### Testing
- [ ] Test: User says "I want to enroll my child" → should jump to enrollment flow
- [ ] Test: User says "How much does it cost?" → should show pricing, then offer enrollment
- [ ] Test: User says "I want to book a trial" → should follow trial flow
- [ ] Test: Enrollment flow should NOT re-ask name/phone if already collected
- [ ] Test: flowMode persists across conversation sessions

## Enhance Intent Detection with Immediate Response Handlers (URGENT)

### Update Intent Types
- [x] Add "trial" intent type to intentDetection.ts (user wants to book trial class)
- [x] Add "staff_handoff" intent type (user requests human assistance)
- [x] Update intent detection prompt to classify all 7 intents: enroll_now, pricing, schedule_only, trial, general_question, staff_handoff, intake_continue

### Immediate Response Handlers
- [ ] When intent = "pricing": fetch membership plans, format as message with pricing, return immediately without advancing step
- [ ] When intent = "schedule_only": fetch available slots, format as quick reply buttons, return immediately without advancing step
- [ ] When intent = "trial": set flowMode="trial", continue with trial booking flow (location → program → slot)
- [ ] When intent = "general_question": call LLM to answer question, append "Let's continue..." + current step question
- [ ] When intent = "staff_handoff": show "A team member will contact you soon" + save lead with "needs_staff_contact" flag

### Intent Detection Placement
- [ ] Move detectIntent() call BEFORE any step processing in enrollmentChatRouter
- [ ] If intent requires immediate response (pricing/schedule/general_question), return response WITHOUT calling processEnrollmentStep
- [ ] If intent requires flow switch (enroll_now/trial), update state.flowMode THEN continue with processEnrollmentStep
- [ ] If intent = "intake_continue", proceed normally with processEnrollmentStep

### Testing
- [ ] Test: "How much does it cost?" → shows plans immediately, doesn't ask next question
- [ ] Test: "When are classes?" → shows slots immediately, doesn't ask next question
- [ ] Test: "What programs do you offer?" → answers question, then continues with current step
- [ ] Test: "I want to enroll" → switches to enrollment flow
- [ ] Test: "I want a trial class" → switches to trial flow
- [ ] Test: "Can I talk to someone?" → triggers staff handoff

## RELIABILITY KERNEL (URGENT - STOP ALL FEATURE WORK)

### PHASE 1: Observability (1 hour)
- [x] Create dev-only debug panel component in IntakeChatbot.tsx
- [x] Display in debug panel: nextStep, flowMode, completedSteps, askedKeys, leadId, selectedSlotId
- [x] Add comprehensive logging on every message: conversationId, inputText, prevStep, newStep, stateDiff
- [x] Surface real errors in dev mode: show error.code + error.message instead of "quick hiccup"
- [ ] Add error boundary to catch and display React errors in dev mode

### PHASE 2: Deterministic State Engine (core)
- [ ] Create resolveNextStep(state, flowMode) as single source of truth for step transitions
- [ ] Add completedSteps Set to EnrollmentState to track finished steps
- [ ] Add askedKeys Set to EnrollmentState to track prompted fields
- [ ] Implement monotonic progression: check completedSteps before asking any question
- [ ] Implement askedKeys check: never re-prompt for same field unless "Change" UI triggered
- [ ] Normalize all inputs (phone/age/skip) BEFORE committing to state
- [ ] Commit state changes BEFORE generating response message
- [ ] Add "Change [field]" UI buttons in confirmation step

### PHASE 3: Tool Loop Guarantee (no stalls)
- [ ] Ensure every user message returns one of: question, buttons, slot cards, confirmation, or recoverable error
- [ ] Add 5-second timeout fallback: "Still with you — one sec" then retry once
- [ ] Implement retry logic with exponential backoff for LLM/API calls
- [ ] Add fallback responses for all error scenarios
- [ ] Never show "try again" without specific next action

### PHASE 4: Booking Hardening (must not fail silently)
- [ ] Add bookingRequestId UUID to booking requests for idempotency
- [ ] Store bookingRequestId in enrollmentState to prevent duplicate bookings
- [ ] Implement idempotent booking: check if bookingRequestId already processed
- [ ] On booking failure: save lead anyway to database
- [ ] On booking failure: show alternate slots OR staff follow-up option
- [ ] Never loop "try again" endlessly - max 2 retry attempts
- [ ] Add booking failure recovery flow with clear next steps

### Acceptance Test Checklist
- [ ] A) Skip email works and never repeats email prompt
- [ ] B) classFor asked once only, never repeated
- [ ] C) Child age correctly routes to program (3-5 Little Ninjas, 6-12 Dragon Kids, 13-17 Teens)
- [ ] D) Kids intro flow books 2 intro classes without regression or repeated prompts
- [ ] E) Booking failure shows alternatives and captures lead successfully
- [ ] F) No stalls, no repeated prompts, no infinite retry loops

## REVERT TO MINIMAL BOOKING FLOW (URGENT - STOP ALL FEATURE WORK)

### Goal
Build deterministic 7-step booking-only flow with 100% reliability. No enrollment, no intent detection, no flowMode switching, no dynamic branching.

### Remove Complex Features
- [x] Remove enrollmentChatRouter.ts and all enrollment procedures
- [x] Remove enrollmentStateMachine.ts
- [x] Remove intentDetection.ts
- [x] Remove enrollmentProcedures.ts
- [x] Remove enrollment routes from routers.ts
- [ ] Remove flowMode field from conversationStates schema
- [ ] Remove enrollmentState JSON field from conversationStates schema
- [ ] Remove students, guardians, enrollmentIntents, waiverSignaturesV2 tables (keep for future)
- [ ] Remove membershipPackages table references from booking flow

### Simplify IntakeStateMachine to 7 Steps
- [x] Step 1: NAME - collect name only
- [x] Step 2: PHONE - collect phone only
- [x] Step 3: EMAIL - collect email (allow "skip")
- [x] Step 4: CLASS_FOR - ask "Is this class for you, your child, or someone else?" (self/child/other)
- [x] Step 5: AGE - if child, ask age to determine program (3-5 Little Ninjas, 6-12 Dragon Kids, 13-17 Teens)
- [x] Step 6: SLOTS - show available trial slots for selected program
- [x] Step 7: BOOK - book selected slot + create trial signup + confirm

### Deterministic State Rules
- [x] No branching based on intent
- [x] No flowMode switching
- [x] No enrollment offers
- [x] No pricing questions mid-flow
- [x] No retry loops - max 1 retry per step
- [x] completedSteps prevents repeating any step
- [x] askedKeys prevents re-asking same field

### Database Cleanup
- [ ] Keep trialSignups table as primary booking record
- [ ] Keep conversationStates for state persistence
- [ ] Remove enrollmentState JSON field
- [ ] Remove flowMode field
- [ ] Add completedSteps array field to conversationStates
- [ ] Add askedKeys array field to conversationStates

### Testing Checklist
- [ ] Test: name → phone → email → classFor=self → slots → book → confirm
- [ ] Test: name → phone → skip email → classFor=child → age=7 → slots → book → confirm
- [ ] Test: email skip works and never repeats
- [ ] Test: classFor asked once only
- [ ] Test: child age routes to correct program (3-5/6-12/13-17)
- [ ] Test: booking creates trialSignup record correctly
- [ ] Test: no stalls, no repeated prompts, no infinite loops
- [ ] Test: booking failure shows alternatives and captures lead

### Success Criteria
- [ ] 100% of test flows complete without errors
- [ ] No repeated questions
- [ ] No stalls or infinite loops
- [ ] All bookings create trialSignup records
- [ ] Debug panel shows correct state transitions
- [ ] Server logs show clean state progression


---

## PHASE 1: Stabilize Minimal Booking Flow + Intent Router Skeleton (CURRENT)

### Fix TypeScript Errors
- [x] Remove introRequired and introBookedCount references from bookingValidation.ts
- [x] Update bookingValidation.ts to work with simplified IntakeState
- [x] Fix all remaining TypeScript errors in server files (legacy TrialChatbot errors remain but unused)
- [x] Verify dev server starts without errors

### Implement Intent Router Skeleton
- [ ] Create intentRouter.ts with detectIntent() function using LLM
- [ ] Detect intents: general_q, pricing, enroll_now, schedule_only, trial
- [ ] For general_q: answer question briefly with LLM, then return to nextStep
- [ ] For schedule_only: show available slots immediately
- [ ] For trial: continue normal booking flow
- [ ] For pricing/enroll_now: respond "I can enroll you next. First, let me lock in your spot." (temporary stub)
- [ ] Integrate intentRouter into intakeStep procedure BEFORE resolveNextStep()
- [ ] Log detected intent for debugging

### Ensure No Repeats (Reliability Kernel)
- [ ] Verify completedSteps prevents re-asking completed fields
- [ ] Test: complete NAME step, try to go back - should skip
- [ ] Test: skip email, verify never asked again
- [ ] Test: complete PHONE, verify never re-prompted

### Ensure No Stalls (Tool Loop Guarantee)
- [ ] Every assistant turn must return: question OR buttons OR slots OR confirmation
- [ ] Add fallback: if no response generated, return "Let me help you with that. [repeat last question]"
- [ ] Test: send gibberish at each step - should get helpful error + retry (max 1 retry)

### Idempotent Booking
- [ ] Add bookingRequestId UUID generation when entering BOOK step
- [ ] Store bookingRequestId in IntakeState
- [ ] Check for existing booking with same bookingRequestId before creating new one
- [ ] If booking exists, return existing confirmation instead of creating duplicate

### Booking Failure Handling
- [ ] Wrap booking logic in try-catch
- [ ] On booking failure: save lead to database anyway
- [ ] Create staff callback task in database (staffCallbacks table)
- [ ] Return message: "I've saved your info. Our team will call you at [phone] within 24 hours to complete your booking."
- [ ] No "try again" loop - max 1 retry, then staff handoff

### Confirmation Card
- [ ] Show student name, program, booked slot date/time
- [ ] Add "Add to Calendar" link
- [ ] Add directions to location
- [ ] Add "What to bring" checklist
- [ ] Send confirmation SMS if phone provided
- [ ] Send confirmation email if email provided

### Testing Checklist
- [ ] Test: complete full booking flow without errors
- [ ] Test: skip email works and never repeats
- [ ] Test: classFor asked once only
- [ ] Test: child age routes to correct program (3-5 Little Ninjas, 6-12 Dragon Kids, 13-17 Teens)
- [ ] Test: ask "How much does it cost?" mid-flow - Kai answers, then continues booking
- [ ] Test: ask "What should I wear?" mid-flow - Kai answers, then continues booking
- [ ] Test: booking failure creates staff callback task
- [ ] Test: no infinite retry loops
- [ ] Test: no stalls (every turn has response)

### Demo Deliverable
- [ ] Record demo video: user asks random question mid-flow, Kai answers without losing state
- [ ] Save checkpoint after all tests pass


---

## PHASE 1: Stabilize Minimal Booking Flow (CURRENT - NO ENROLLMENT/PRICING/PIVOTS)

### Remove Intent Detection Complexity
- [x] Remove intent detection calls from routers.ts
- [x] Remove getPromptForStep and getQuickRepliesForStep helper functions
- [x] Keep intentRouter.ts file but don't use it yet (Phase 2)
- [x] Simplify intakeStep procedure to only call processIntakeMessage

### Fix TypeScript Errors
- [x] Fix all remaining TypeScript errors in server files (legacy TrialChatbot errors remain but unused)
- [x] Ensure processIntakeMessage return type matches usage in routers.ts
- [x] Verify no type mismatches in IntakeState fields

### Ensure Zero Repeated Questions
- [x] Verify completedSteps array prevents re-asking completed fields
- [x] Add completedSteps check in resolveNextStep before every step
- [x] Verify each step handler updates completedSteps before advancing
- [ ] Test: complete NAME, try to trigger NAME again - should skip
- [ ] Test: complete PHONE, verify never prompted again
- [ ] Test: skip EMAIL, verify never asked again

### Clean Email Skip
- [x] Verify "skip" keyword advances from EMAIL to CLASS_FOR
- [x] Verify emailSkipped flag is set correctly
- [x] Verify completedSteps.push(IntakeStep.EMAIL) on skip
- [ ] Test: type "skip" at EMAIL step - should advance to CLASS_FOR
- [ ] Test: after skipping, verify email is never asked again

### Auto Program Selection from Child Age
- [x] Implement age-to-program mapping in intakeStateMachine.ts
- [x] 3-5 years → "Little Ninjas"
- [x] 6-12 years → "Dragon Kids"  
- [x] 13-17 years → "Teens"
- [x] 18+ years → "Adult Karate" (default)
- [ ] Test: enter age 4 - should auto-select "Little Ninjas"
- [ ] Test: enter age 10 - should auto-select "Dragon Kids"
- [ ] Test: enter age 15 - should auto-select "Teens"

### No Retry Loops on Booking Failure
- [ ] Remove any automatic retry logic in atomicBooking.ts
- [ ] Max 1 booking attempt per user confirmation
- [ ] On booking failure: save lead to database
- [ ] On booking failure: create staff callback task
- [ ] Return message: "I've saved your info. Our team will call you at [phone] within 24 hours."
- [ ] Test: simulate booking failure - should NOT retry automatically

### Staff Callback on Booking Failure
- [ ] Create staffCallbacks table if not exists (id, leadId, phone, reason, status, createdAt)
- [ ] On booking failure, insert staff callback record
- [ ] Include failure reason in staff callback record
- [ ] Log staff callback creation for debugging

### Debug Output on Every Response
- [ ] Include nextStep in every response object
- [ ] Include completedSteps in every response object
- [ ] Include askedKeys in every response object
- [ ] Verify debug panel shows these fields in IntakeChatbot.tsx

### Testing Checklist (20 Successful Bookings)
- [ ] Test 1-5: Complete full flow without skipping email
- [ ] Test 6-10: Skip email, complete rest of flow
- [ ] Test 11-15: Book for child (ages 3-5, 6-12, 13-17)
- [ ] Test 16-20: Book for self (adult)
- [ ] Verify: zero repeated questions across all 20 tests
- [ ] Verify: no infinite loops across all 20 tests
- [ ] Verify: booking failures create staff callbacks

### Deliverable
- [ ] Save checkpoint after all tests pass
- [ ] Document any edge cases discovered during testing

## Belt-Based Curriculum System (COMPLETED)

- [x] Add beltRank and beltAchievedDate fields to enrollments table
- [x] Create curriculumContent table for storing belt-specific curriculum
- [x] Create studentProgress table for tracking completion
- [x] Seed curriculum data from instructor manual (91 items across 14 belt ranks)
- [x] Create backend API procedures (getAccessibleContent, getMyProgress, markCompleted)
- [x] Build CurriculumViewer component with progress tracking
- [x] Add Curriculum tab to member dashboard navigation
- [x] Implement belt-based access control (only show content up to current belt)
- [x] Create test enrollment with Orange Belt rank for testing
- [x] Display locked content preview for future belts

## Instructor Feedback System for Curriculum (COMPLETED)

- [x] Add instructorFeedback field to studentProgress table
- [x] Add instructorId and feedbackDate fields to track who gave feedback and when
- [x] Create backend API procedure for instructors to add/update feedback
- [x] Create backend API procedure to fetch feedback for students
- [x] Build instructor feedback UI in CurriculumViewer component
- [x] Add instructor role check to ensure only instructors can leave feedback
- [x] Display instructor feedback to students in their curriculum view
- [x] Add timestamp and instructor name to feedback display
- [x] Create InstructorDashboardPanel component for instructors
- [x] Create InstructorDashboard page at /instructor route
- [x] Add getAllEnrollments API for instructors to view all students

## Chatbot Name Extraction Fix

- [x] Update chatbot to extract names from initial user messages
- [x] Improve natural language processing to recognize "My name is X" patterns
- [x] Avoid asking for name again if already provided
- [x] Test with various name formats (e.g., "I'm Vincent", "My name is Vincent", "Vincent here")

## Chatbot Name Extraction - Logic Order Fix

- [x] Reorder parseName function to check name extraction patterns BEFORE rejection keywords
- [x] Ensure "I'm Vincent but I want to enroll" extracts "Vincent" successfully
- [x] Test with complex messages containing both name and intent

## Chatbot Conversational Acknowledgment

- [x] Update NAME step response to acknowledge customer's stated intent
- [x] Detect mentions of "son", "daughter", "child" in initial message
- [x] Create more natural response that acknowledges intent before asking next question
- [x] Fix capitalization issue in response ("im vincent" → "Vincent")

## Automatic Age Detection and Program Suggestion

- [x] Add regex pattern to extract child's age from user messages
- [x] Map age to appropriate program (Little Ninjas 3-5, Dragon Kids 6-12, Teens 13+)
- [x] Update NAME step response to suggest program based on detected age
- [x] Handle edge cases (age 5 goes to Little Ninjas, age 6+ to Dragon Kids)
- [x] Test with various age mention formats ("5 year old", "5-year-old", "age 5", "he's 5")

## Multi-Child Enrollment Detection

- [x] Add regex patterns to detect multiple children mentions ("two sons", "3 kids", "both my children")
- [x] Extract number of children from user message
- [x] Update NAME step response to acknowledge multiple children enrollment
- [x] Add children array to IntakeState to store multiple child records
- [x] Add currentChildIndex to track which child we're collecting info for
- [x] Modify conversation flow to loop through each child for age collection
- [x] Update CHILD_AGE step to handle multiple children
- [x] Update INTENT step to ask for first child's age
- [ ] Update SLOTS step to collect slots for each child (requires backend support)
- [ ] Create separate trial class bookings for each child in BOOK step (requires backend support)
- [ ] Test with various multi-child mention formats

## Fix parseName for Intent Keywords

- [x] Update parseName to extract names even when message contains "enroll", "book", "register"
- [x] Ensure "I'm Vincent I just want to enroll" successfully extracts "Vincent"
- [x] Added regex pattern to handle "I'm [Name] I just want..." format
- [x] Test with various combinations of name + intent in same message

## Conversation Memory for Kai

- [x] Add messageHistory array to IntakeState to store last 5 messages
- [x] Store both user messages and assistant responses with timestamps
- [x] Update state initialization to include messageHistory field
- [x] Add helper function to append messages to history with max limit
- [x] Update conversation logic to track all messages automatically
- [x] Wrap all return statements to track assistant responses
- [ ] Update conversation logic to reference previous messages for context (future enhancement)
- [ ] Test memory recall with multi-turn conversations

## Auto-Detect classFor from Initial Message

- [x] Update NAME step to detect child enrollment intent from user message
- [x] Automatically set classFor to "child" when user mentions "my son", "my daughter", "my child"
- [x] Mark CLASS_FOR step as completed when auto-detected
- [x] Skip CLASS_FOR question when already determined from context
- [x] Test with various child mention formats

## Child Name Collection for Personalization

- [x] Add CHILD_NAME step to IntakeStep enum
- [x] Add childName field to IntakeState interface
- [x] Update resolveNextStep to include CHILD_NAME step after CLASS_FOR
- [x] Create CHILD_NAME case in processIntakeMessage
- [x] Add parseChildName function to inputNormalization.ts
- [x] Update conversation responses to use child's name (INTENT and CHILD_AGE steps)
- [x] Test personalization with child name throughout flow

## Update Initial Greeting and Add Program Options

- [x] Change initial greeting to ask about intent first (trial, enrollment, summer camp, after school)
- [x] Add "Summer Camp" and "After School" as program options
- [x] Update INTENT step to handle summer camp and after school selections
- [x] Modify conversation flow to ask for name AFTER intent is determined
- [x] Update quick reply buttons to include all program options
- [x] Update database schema to support new intent types
- [x] Test new greeting flow with all program types

## Location Selection and Schedule Filtering

- [x] Add LOCATION step to IntakeStep enum
- [x] Add selectedLocation field to IntakeState interface
- [x] Update resolveNextStep to include LOCATION step after INTENT
- [x] Create LOCATION case in processIntakeMessage
- [x] Add location quick reply buttons (Tomball HQ, Spring, Cypress)
- [x] Update SLOTS step to filter schedules by selected location
- [x] Test location-based schedule filtering

## Booking Confirmation Summary Card

- [x] Add CONFIRM step to IntakeStep enum between SLOTS and BOOK
- [x] Update resolveNextStep to include CONFIRM step after slot selection
- [x] Create CONFIRM case in processIntakeMessage
- [x] Generate summary message with all collected details (parent, child, program, location, time)
- [x] Add "Confirm Booking" and "Edit Details" quick reply buttons
- [x] Handle confirmation logic to proceed to booking
- [x] Frontend automatically renders markdown summary with emojis
- [x] Test confirmation flow

## NEW BUGS

- [x] Kai enrollment flow doesn't generate Stripe checkout link - after selecting membership plan (Foundation/Black Belt/Leadership), Kai says "I'll generate a checkout link for you" but never displays the actual link, conversation just ends with "Your trial class is booked!" - FIXED by collecting name/phone before completing enrollment

- [x] Enrollment success page missing - after completing Stripe checkout, users are redirected to /enrollment/success but get 404 error instead of confirmation page

- [x] Create admin enrollment dashboard - view all student enrollments with payment status, Stripe subscription details, customer info, and management actions (cancel subscription, view details)

- [x] Student dashboard showing old design instead of new modern redesigned version - FIXED by updating App.tsx to use MemberDashboard2 component for /dashboard route

- [x] Create student check-in system - allow students to check in for classes with attendance tracking, check-in history, QR code scanning option, and admin attendance management dashboard

- [x] Implement QR code scanning for check-in - generate unique QR codes for each class, create camera-based scanner interface, and enable automatic check-in upon successful scan

- [x] Recreate check-in page as 71" portrait kiosk interface - arcade-style attract mode with animated red energy ring, large touch-friendly buttons, QR scanner, phone/name search, student confirmation with photo/belt/streak, success screen with confetti/XP animation, birthday celebration mode, live leaderboard sidebar, 15-minute check-in window logic, and admin lock feature

- [x] Integrate sound effects into kiosk check-in system - add belt snap sound on successful check-in, XP counter chime, error sounds, button tap feedback, and birthday celebration audio to enhance arcade-style user experience

- [x] Replace old check-in page with new kiosk interface - update /check-in route to use KioskCheckIn component instead of old CheckIn component

- [ ] Implement kiosk admin lock feature - add hidden admin panel accessible by pressing and holding top-right corner for 5 seconds, with login authentication, kiosk settings (volume control, reset), check-in logs viewer, and system controls

- [x] Fix kiosk CLASS CHECK-IN section to pull real class schedule data from website database instead of placeholder times

- [x] Add intro lesson appointments section to kiosk
  - [x] Investigate database schema for intro appointments or bookings table
  - [x] Create or update database schema to store intro lesson appointments (student name, phone, email, appointment time, program interest, status)
  - [x] Add backend procedures to fetch today's intro appointments and handle intro check-ins
  - [x] Update kiosk UI to display welcome banner for new students
  - [x] Add intro appointments list with special "NEW STUDENT" badges
  - [x] Implement separate check-in flow for intro students that creates trial attendance records
  - [x] Test intro appointment display and check-in functionality

- [ ] Create comprehensive admin dashboard with login authentication
  - [x] Design admin dashboard structure and navigation layout (sidebar with modules)
  - [x] Create admin login page with email/password authentication
  - [x] Build intro appointments management interface
    - [x] Add new intro appointment form (name, phone, email, program, date/time, location)
    - [x] View all appointments table with filters (upcoming, completed, cancelled)
    - [x] Edit appointment functionality
    - [x] Delete/cancel appointment functionality
    - [x] Search and filter by name, phone, date, status
  - [ ] Build class schedule management interface
    - [ ] Add/edit/delete class times and programs
    - [ ] Assign instructors to classes
    - [ ] Set class capacity limits
    - [ ] Manage multiple locations
  - [ ] Build student/member management interface
    - [ ] View all enrolled students table
    - [ ] Edit student profiles (belt rank, contact info, photos)
    - [ ] View attendance history and streaks
    - [ ] Manage membership status
  - [ ] Add attendance logs and reporting features
    - [ ] View all check-ins (regular + intro students)
    - [ ] Export attendance reports
    - [ ] Track attendance trends
  - [ ] Add kiosk configuration settings
  - [ ] Test admin dashboard functionality

- [x] Clean up test/fake data from production database
  - [x] Delete all test entries from trialSignups table (Test User, Vincent test entries, etc.)
  - [x] Keep only real intro appointments from actual leads (Gianna Gozzo, Adrienne Kerns, Holly McIntosh, etc.)
  - [x] Verify kiosk displays only real appointments after cleanup

- [x] Add kiosk check-in button to website footer for easy access

- [x] Redesign kiosk for portrait/mobile displays - move sidebar content below main check-in area
  - [x] Change layout from side-by-side to stacked vertical layout
  - [x] Main area at top: logo, intro banner, next class, check-in button
  - [x] Sidebar cards stacked below in single column (portrait) or 2-column grid (landscape)
  - [x] Make entire page scrollable so users can access all content

- [x] Change spinning energy ring background on kiosk to red color to match MyDojo branding

- [x] Change spinning energy ring background on kiosk to red color to match MyDojo branding

- [x] Complete premium kiosk redesign (Apple Fitness meets Tesla UI)
  - [x] Dark matte black background (#0B0B0B) with radial red glow effect
  - [x] Centered hero section: MYDOJO logo, "READY TO TRAIN 👊" headline, red sun flare behind text
  - [x] Premium glassmorphism check-in card with red glow borders
  - [x] Large red gradient "TAP TO CHECK IN" button with glow animation
  - [x] QR scanner panel with animated scanning line
  - [x] LEFT: "TOP WARRIORS" class list with modern elevated cards
  - [x] RIGHT: Gamification cards (Longest Streak, Weekly Challenge, Belt Progress) with smooth animations
  - [x] Micro-animations and hover effects throughout
  - [x] Optimized for 27" kiosk display

- [x] Refine kiosk design to exactly match reference image
  - [ ] Update background with dramatic red nebula/lava texture and particle effects
  - [x] Fix welcome banner with red-to-purple gradient
  - [ ] Enhance check-in button with stronger neon glow and red outline
  - [x] Redesign QR scanner panel with white background and red scanning line
  - [x] Add detailed class cards with instructor photos, time ranges (e.g., "9:00 PM - 10:00 AM"), countdown badges with clock icons, and right arrows
  - [x] Update gamification cards with darker backgrounds and red-to-orange-to-yellow gradient progress bars

- [x] Create breathtaking kiosk design with WOW factor
  - [x] Generate dramatic red nebula/lava background texture using nano banana
  - [x] Implement intense neon glow effects on all panels (stronger red/orange glowing borders)
  - [x] Darken side panels (TOP WARRIORS and gamification cards) for dramatic contrast
  - [x] Add particle effects and floating embers to background
  - [x] Enhance typography and spacing for better visual hierarchy
  - [x] Make center check-in area dominate the screen

- [x] Replace kiosk logo with new circular martial arts logo (Untitleddesign(3).png)
  - [x] Copy new logo to public/images directory
  - [x] Update kiosk to display larger, more prominent circular logo above READY TO TRAIN

- [x] Update instructor assignments for all programs
  - [x] Little Ninjas → Coach Kleila Mari
  - [x] Dragon Kids → Sensei Kamil Ahmed
  - [x] Teens & Adult Karate → Master Vincent Holmes
  - [x] Fitness Kickboxing → Coach Kleila Mari
  - [x] Update kiosk class display logic to show correct instructor per program

- [x] Replace instructor initial circles with program-specific images on kiosk
  - [x] Generate Little Ninjas program image (young kids martial arts)
  - [x] Generate Dragon Kids program image (kids martial arts)
  - [x] Generate Teens program image (teenage martial arts)
  - [x] Generate Adult Karate program image (adult martial arts)
  - [x] Generate Kickboxing program image (fitness kickboxing)
  - [x] Update kiosk class cards to display program images instead of instructor initials

- [x] Add real action photography as full background images on kiosk class cards
  - [x] Generate Little Ninjas action photo (young kids training in dojo)
  - [x] Generate Dragon Kids action photo (kids performing martial arts techniques)
  - [x] Generate Teens action photo (teenage martial artists in dynamic poses)
  - [x] Generate Adult Karate action photo (adult black belts training)
  - [x] Generate Kickboxing action photo (intense fitness kickboxing workout)
  - [x] Update kiosk class card styling to use background images with dark overlay
  - [x] Ensure text remains readable over background photos

- [x] Update database class schedule to match official weekly class grid
  - [x] Clear existing incorrect schedule data from database
  - [x] Insert all classes from official schedule grid (Monday-Saturday)
  - [x] Verify kiosk displays updated schedule correctly
  - [x] Update website location page to pull from same database

- [ ] Replace individual student stats on kiosk with dojo-wide achievement cards
  - [ ] Remove personal stats (longest streak, weekly challenge, belt progress) from public kiosk
  - [ ] Add "Perfect Attendance Streak" leaderboard showing top students with consecutive attendance
  - [ ] Add "Runner Up for Next Belt" card showing students who reached 15+ classes at current belt
  - [ ] Create database queries to fetch perfect attendance and belt promotion data
  - [ ] Update kiosk UI to display dojo-wide achievements instead of personal stats

- [x] Replace individual student stats on kiosk with dojo-wide achievement cards
  - [x] Remove personal stats (longest streak, weekly challenge, belt progress)
  - [x] Add Perfect Attendance leaderboard card (top 3 students with consecutive streaks)
  - [x] Add Runner Up for Next Belt card (students with 15+ classes at current belt)
  - [x] Create attendance table in database as source of truth
  - [x] Implement database queries for perfect attendance and belt progression
  - [x] Update kiosk to display real data from database queries

- [x] Connect TAP TO CHECK IN button to recordCheckIn() function
  - [x] Create tRPC procedure kiosk.checkIn that calls recordCheckIn() from db.ts
  - [x] Update kiosk UI to call checkIn mutation when student taps button
  - [x] Handle success state: show confirmation, update leaderboards, award XP
  - [x] Handle error states: display friendly error messages
  - [x] Test end-to-end check-in flow with real student data
  - [x] Verify Perfect Attendance and Runner Up cards update in real-time

- [x] Update kiosk identification screen to match main check-in page design
  - [x] Replace dark blue/gray background with red nebula background image
  - [x] Add intense red/orange glow effects to all buttons and cards
  - [x] Apply floating particle animations to identification screen
  - [x] Ensure text remains readable with proper contrast
  - [x] Match button styling (shimmer animation, multi-layer glow)
  - [x] Test all three identification methods (QR, Phone, Name) with new design

- [x] Build animated celebration screen with confetti for successful check-in
  - [x] Create confetti particle animation with random colors, sizes, and trajectories
  - [x] Display student name, photo/avatar, and program
  - [x] Show current streak and milestone achievements
  - [x] Add special birthday celebration message if applicable
  - [x] Display XP earned from check-in
  - [x] Auto-return to home screen after 5 seconds
  - [x] Match red nebula background theme for consistency

- [x] Fix Kai chatbot conversation loop bug
  - [x] Investigate Kai implementation to find where conversation state is tracked
  - [x] Identify why Kai asks for name again after acknowledging "I already have your name"
  - [x] Fix conversation logic to properly track collected information (name, age, program)
  - [x] Ensure Kai doesn't repeat questions once information is collected
  - [x] Test full conversation flow from start to trial signup completion

### Kai Chatbot - Fix Enrollment Loop Bug (COMPLETED)
  - [x] Investigate why Kai repeats "trial vs membership" question after collecting user info
  - [x] Fix conversation state to track that user already selected "Enroll for Membership"
  - [x] Ensure flow proceeds to child's info collection after parent info is collected
  - [x] Update CLASS_FOR step to use resolveNextStep() instead of hardcoding INTENT transition
  - [x] Add proper handling for all next steps (CHILD_NAME, LOCATION, CHILD_AGE, etc.)
  - [x] Write unit tests to verify no loop in enrollment flow
  - [x] Test complete enrollment flow from start to child name collection

### Kai Redesign - Trial-First Strategy (MASS Training Implementation)
  - [ ] Design new conversation flow structure (Trial-First with hidden enrollment path)
  - [ ] Remove visible "Trial or Membership" choice from INTENT step
  - [ ] Add EMOTIONAL_DISCOVERY step (What would you like to see improve? If they developed that, what would be different?)
  - [ ] Update TRIAL_TRANSITION step with urgency framing ("classes filling quickly")
  - [ ] Change slot selection to offer 2 specific time options (not full calendar)
  - [ ] Add SECONDARY_DECISION_MAKER step ("Is there anyone else who needs to be involved?")
  - [ ] Add PAYMENT_POSITIONING step with reassuring language
  - [ ] Add ENROLLMENT_PREFRAME step after trial payment ("After first lesson, I'll show you membership options")
  - [ ] Implement hidden direct enrollment path triggered by:
    - [ ] User explicitly requests membership/enrollment
    - [ ] User says they don't need a trial
    - [ ] Returning student scenario
  - [ ] Update all Kai messages to be concise, confident, instructor-like (not chatbot-like)
  - [ ] Remove long paragraphs, use short enthusiastic responses
  - [ ] Add conversation control tactics (guide forward, don't let lead control)
  - [ ] Update LLM system prompt with MASS Training behavioral script
  - [ ] Write comprehensive tests for trial-first flow
  - [ ] Write tests for hidden enrollment path triggers
  - [ ] Test complete flow from greeting to trial payment

### Kai Simplification - One Step = One User Turn
- [ ] Remove all recursive processIntakeMessage calls from handlers
- [ ] Update CHILD_NAME handler to ask CHILD_AGE question directly
- [ ] Update CHILD_AGE handler to ask EMOTIONAL_DISCOVERY question directly
- [ ] Update RAPID_RAPPORT_ADULT handler to ask EMOTIONAL_DISCOVERY question directly
- [ ] Update EMOTIONAL_DISCOVERY handler to ask follow-up or TRIAL_TRANSITION question directly
- [ ] Update TRIAL_TRANSITION to combine with FAST_FIRST_LESSON slot offering (already done)
- [ ] Update FAST_FIRST_LESSON handler to ask SECONDARY_DECISION_MAKER question after slot selection
- [ ] Update SECONDARY_DECISION_MAKER handler to ask NAME question directly
- [ ] Update NAME/PHONE handlers to ask next question directly
- [ ] Update EMAIL handler to ask PAYMENT_POSITIONING question directly
- [ ] Update PAYMENT_POSITIONING to ask for payment method (already done)
- [ ] Update ENROLLMENT_PREFRAME to be final message (already done)
- [ ] Update tests to expect user input between each step
- [ ] Manual UI test: Parent (child) flow
- [ ] Manual UI test: Adult flow
- [ ] Add debug panel showing currentStep and state fields

## Kai Trial-First Strategy Redesign (COMPLETED)

- [x] Rename old intakeStateMachine.ts as intakeStateMachine.legacy.ts (backup)
- [x] Build new intakeStateMachine.trialFirst.ts from scratch with strict one-step-per-turn rules
- [x] Implement all 13 step handlers: GREETING, CLASS_FOR, CHILD_NAME, CHILD_AGE, RAPID_RAPPORT_ADULT, EMOTIONAL_DISCOVERY_Q1, EMOTIONAL_DISCOVERY_Q2, TRIAL_TRANSITION, FAST_FIRST_LESSON, SECONDARY_DECISION_MAKER, NAME, PHONE, EMAIL, PAYMENT_POSITIONING, ENROLLMENT_PREFRAME, DONE
- [x] Add hidden direct enrollment path (skipTrial=true) triggered by explicit user request
- [x] Add resolveNextStep() that returns exactly ONE next step (no walking)
- [x] Add hard safety guard: stepAdvanceCount <= 1 per turn
- [x] Wire V2 procedures in routers.ts (intakeStepV2, getIntakeGreetingV2)
- [x] Enable feature flag VITE_KAI_TRIAL_FIRST_V2=true
- [x] Add dev-mode debug panel to IntakeChatbot showing step, prevStep, and all state fields
- [x] Write 21 unit tests for child path, adult path, hidden enrollment path, resolveNextStep, and safety guard
- [x] All 21 tests passing

## Kai - One Free Class Update

- [ ] Change all "2-week trial" messaging to "one free class" in intakeStateMachine.trialFirst.ts
- [ ] Update TRIAL_TRANSITION message to offer one free class
- [ ] Update FAST_FIRST_LESSON to book a single free class
- [ ] Update PAYMENT_POSITIONING to reflect one free class (no payment for first class)
- [ ] Update ENROLLMENT_PREFRAME to transition to membership after first class
- [ ] Make direct enrollment path more accessible (detect "enroll", "sign up", "membership" keywords)
- [ ] Update resolveNextStep to route to enrollment when skipTrial=true
- [ ] Update unit tests to reflect one free class messaging

## Kai - Enrollment Now: Show Programs + Link
- [ ] Add PROGRAM_SELECTION step after "Enroll now" trigger
- [ ] Present program options based on classFor/childAge context
- [ ] Generate direct enrollment link per program
- [ ] Remove "team will reach out" message

## Kai - Add $99 Down Payment to All Membership Checkouts
- [ ] Create $99 one-time down payment price in Stripe (or use existing)
- [ ] Add down payment as additional line item in checkout session
- [ ] Update Kai messaging to show $99 down + monthly rate

## Membership Upgrade Flow via Kai Chatbot

- [x] Add UPGRADE_LOOKUP, UPGRADE_CONFIRM, UPGRADE_COMPLETE steps to TFStep enum
- [x] Add upgrade-related fields to TFState interface (isUpgrade, lookupPhone, currentPlan, currentPlanMonthlyPrice, proratedCredit, upgradeEnrollmentId, upgradeTargetPlan)
- [x] Add upgradeAction field to TFResponse interface
- [x] Implement isUpgradeRequest() helper function to detect upgrade intent
- [x] Add upgrade intercept at GREETING and CLASS_FOR steps
- [x] Add UPGRADE_LOOKUP handler (accepts phone or email, validates format)
- [x] Add UPGRADE_CONFIRM handler (plan selection: Black Belt $199/mo, Leadership $249/mo, or cancel)
- [x] Add UPGRADE_COMPLETE handler (transitions to DONE)
- [x] Add upgrade step question generators in generateQuestion()
- [x] Add upgrade lookup logic in intakeStepV2 (search enrollments by phone/email, calculate proration)
- [x] Add upgrade execute logic in intakeStepV2 (update Stripe subscription with proration, update DB)
- [x] Fix current_period_end access to use items.data[0] for Stripe v20 API
- [x] Update IntakeChatbot.tsx frontend to handle upgradeResult from server
- [x] Add 21 unit tests for upgrade flow (all passing)

## Email Required + Post-Enrollment Student Dashboard Redirect

- [x] Remove "skip email" option from trial-first state machine (email is mandatory)
- [x] Remove skip-email detection logic and re-prompt behavior
- [x] After successful enrollment payment, redirect parent to student dashboard to enter student info
- [x] Add student info entry form/modal on the enrollment success page or member dashboard
- [x] Student info form fields: student full name, date of birth, program, emergency contact (optional)

## UI Cleanup
- [x] Remove "Find Your Nearest Dojo" location prompt popup/box

## Program Lead Pages
- [x] Create reusable ProgramLeadPage component with hero, benefits, and lead capture form
- [x] Little Ninjas lead page (/programs/little-ninjas)
- [x] Dragon Kids lead page (/programs/dragon-kids)
- [x] Teens lead page (/programs/teens)
- [x] Adult Karate lead page (/programs/adult-karate)
- [x] Kickboxing lead page (/programs/kickboxing)
- [x] After School lead page (/programs/after-school)
- [x] Summer Camp lead page (/programs/summer-camp)
- [x] Wire lead form to trial signup backend procedure
- [x] Add all program lead routes to App.tsx
- [x] Add "Learn More" links from Programs page to individual lead pages

## Google Ads Landing Page
- [x] Build /join landing page with all programs and lead capture form (no nav distractions)
- [x] Register /join route in App.tsx
- [x] Add CTA buttons to /join page (sticky mobile bar, hero CTAs, scroll-to-form buttons)
- [x] Add FAQ accordion section to /join landing page
- [x] Add Google Analytics gtag.js (G-TJ9R7TW3VL) to /join page HTML head

## Instructor Admin Portal
- [x] Audit existing admin pages, schema roles, and auth setup
- [x] Create instructor role in schema (instructor role separate from admin/user) — keeping single admin role
- [x] Redesign /admin/login as branded Instructor & Staff Portal login page
- [x] Add Staff Login link to site navigation
- [x] Improve AdminLayout branding for instructor use






## Admin Portal Security
- [x] Add role=admin guard to AdminLogin page (redirect non-admins away after OAuth)
- [x] Add role=admin guard to AdminLayout (block direct URL access to /admin/*)
- [x] Show "Access Denied" page for non-admin users who try to access admin portal
- [x] Add inconspicuous admin login link in footer copyright area
- [x] Add Shift+A x3 keyboard shortcut to redirect to /admin/login

## Bug Fixes
- [x] Fix Students page in admin portal not working
- [x] Fix Attendance page in admin portal not working
- [ ] Fix /admin/classes page not working (missing page component and route)

- [x] Fix admin Students page - updated getAllStudents and getAllAttendance procedures to query `enrollments` table (joined with membershipPackages) instead of non-existent `students` table

- [x] Fix Stripe webhook: checkout.session.completed now CREATES a new enrollment record from session metadata instead of looking for a pre-existing pending one. Also manually inserted JT Jasper and Craig Simonson enrollment records from their real Stripe data.

- [x] Add Edit Student modal to admin Students page — fields: name, email, phone, date of birth (with live age calculation), belt rank, membership status

- [x] Add photo upload to Edit Student modal — S3 upload, preview in modal, avatar shown in Students table

- [x] Show student profile photos on attendance check-in screen — circular avatar in attendance table and in manual check-in modal (with identity card preview when student is selected)

- [x] Show attendance streak in check-in identity card — current streak (flame icon) and best streak (trophy icon) displayed in the student identity card when selected in Manual Check-In modal

- [x] Streak milestone notifications — auto-send congratulatory email to student when they hit 5, 10, 25, 50, 100 class streak; milestone logged to streakMilestones table; admin can view history at /admin/milestones with email delivery status

- [x] Customize streak milestone email template — added MyDojo logo header, program name in red banner, streak + belt rank tiles, and 'Book Your Next Class' CTA button linking to /schedule

- [x] Add 'Resend Email' button to admin milestones page for failed deliveries — one-click retry that re-sends the milestone email, updates delivery status in DB, and shows success/error toast

- [x] Update all enrollment/trial CTA buttons and links across the public site to open the IntakeChatbot — updated Layout.tsx (Join Now, Book Free Trial), HeroSlider.tsx (Start Your Journey), Home.tsx, About.tsx, Kickboxing.tsx, LocationDetail.tsx, Waiver.tsx, ScheduleWidget.tsx, SummerCamp.tsx

- [x] Staff invitation system — admin sends invite by email, staff clicks link, logs in with Manus OAuth, auto-granted staff role; Admin Staff page at /admin/staff with invite form, invite list, revoke button; Staff nav item visible to admins only; staff role can access admin dashboard; 8 unit tests pass

- [x] Add 'Resend Invite' button to admin Staff page for pending invitations — re-sends the invite email with a fresh token, resets the 48-hour expiry window, spinning icon while in flight

- [ ] Internal communication system — staff chat hub (admin ↔ staff real-time messaging) and student inbox (admin/staff → student dashboard with reply support)

## Internal Messaging System

- [x] Create conversations and internalMessages database tables (schema.ts)
- [x] Push DB migration for messaging tables
- [x] Add backend tRPC procedures: getConversations, getMessages, sendMessage, createConversation, markConversationRead, deleteConversation
- [x] Build AdminMessages.tsx page with Staff Chat and Student Messages tabs
- [x] Two-panel layout: conversation list on left, chat view on right
- [x] Optimistic message updates for instant UI feedback
- [x] Auto-scroll to latest message on new send
- [x] 3-second polling for new messages in active conversation
- [x] 5-second polling for conversation list refresh
- [x] Unread message badges on tabs and conversation list items
- [x] Mark-as-read when opening a conversation
- [x] New Conversation modal for both staff chats and student messages
- [x] Delete conversation with confirmation prompt
- [x] Add Messages nav item to AdminLayout sidebar
- [x] Register /admin/messages route in App.tsx
- [x] Write 16 vitest tests for messaging logic (all passing)

## Student Roster Fix & Parent-of-Student Model

- [x] Investigate why new Stripe enrollments are missing from the student roster (root cause: Kai chatbot v2 checkout was missing packageId in metadata, causing webhook to skip enrollment creation)
- [x] Fix Kai chatbot v2 checkout session metadata to include packageId and consistent key names
- [x] Manually insert Gianna Gozzo's missing enrollment record from Stripe data
- [x] Fix getAllStudents query to only show Stripe-linked enrollments (isNotNull stripeCustomerId)
- [x] Apply same Stripe filter to searchByPhone and searchByName (kiosk check-in)
- [x] Update roster UI labels to reflect parent-of-student model (Members & Students, Member (Parent) column)
- [x] Update AdminLayout sidebar label from Students to Members

## Student Name Field (Parent vs Student Distinction)

- [x] Add studentName column to enrollments table in drizzle/schema.ts
- [x] Push DB migration via ALTER TABLE (column added directly)
- [x] Update Stripe webhook handler to capture studentName from metadata
- [x] Update Kai chatbot v2 checkout metadata to include studentName (uses childName if child enrollment, else name)
- [x] Update IntakeChatbot checkout metadata to include studentName (uses childName if child enrollment, else name)
- [x] Update admin roster to show Student Name column alongside Member (Parent) name
- [x] Update admin edit modal to allow editing studentName with Parent/Guardian label clarification
- [x] Update getAllStudents procedure to return studentName
- [x] Update updateStudent procedure to accept studentName
- [x] Update search to also match on studentName

## Staff Access Control Fix

- [x] Audit all admin procedure guards and frontend route checks blocking staff role
- [x] Updated 8 operational procedure guards to allow staff role: getAllEnrollments, getPendingRequests, approveRequest, denyRequest, addInstructorFeedback, getStudentProgress, getAttendanceByDate, generateClassQR
- [x] AdminLayout frontend guard already allowed staff (no change needed)
- [x] admin sub-router procedures (getAllStudents, updateStudent, etc.) use plain protectedProcedure — accessible to staff via AdminLayout
- [x] Staff invite management (listStaffInvites, createStaffInvite, revokeStaffInvite, resendStaffInvite) intentionally kept admin-only

## Staff-Specific Sidebar View

- [x] Read AdminLayout to identify all nav items and which are admin-only
- [x] Filter sidebar nav items by role: staff sees Dashboard, Intro Appointments, Class Schedule, Members, Attendance Logs, Streak Milestones, Messages only
- [x] Admin-only items (Staff, Settings) hidden from staff sidebar
- [x] Portal label changes to 'Staff Portal' for staff users
- [x] Role badge added to user info section (red 'Admin' or blue 'Staff')

## Staff Access Denied - Root Cause Investigation

- [x] Check staff user's role in the database: Kamil (Clover Dojo) had role=staff, Coach Kleila had role=user (invite not accepted)
- [x] Check admin login route: AdminLogin.tsx only redirected role=admin, blocking staff users with role=staff
- [x] Fixed AdminLogin.tsx to redirect both admin and staff roles into the portal
- [x] Fixed access denied condition to allow staff through
- [x] Manually promoted Coach Kleila (coachkleila@gmail.com) to role=staff in the database

## GoHighLevel Lead Integration (GHL → MyDojo)

- [x] Audit existing leads table schema and admin leads page
- [x] Added ghlContactId column to trialSignups table via ALTER TABLE
- [x] Created POST /api/ghl/webhook endpoint with HMAC-SHA256 signature verification
- [x] Maps GHL payload fields (firstName, lastName, name, email, phone, tags, source) to trialSignups table
- [x] Infers program from GHL tags/source (Kickboxing, Little Ninjas, Dragon Kids, Teens, Adult Karate, After School, Summer Camp, Not Sure)
- [x] Deduplicates leads by phone number to avoid double entries
- [x] Updated admin Intro Appointments UI with Source column: orange GHL badge, blue Chatbot badge
- [x] 14/14 vitest tests pass for GHL webhook handler

## Attendance System Bug Fix

- [x] Diagnosed: manualCheckIn was inserting attendance records without enrollmentId, so getAllAttendance join returned no student name/program
- [x] Fixed: manualCheckIn now sets enrollmentId = studentId on every attendance insert
- [x] Fixed: added NOT_FOUND error when enrollment doesn't exist (instead of silent failure)
- [x] Fixed: source field now uses ctx.user.role to correctly tag 'staff' vs 'admin' check-ins
- [x] Verified: only 7 pre-existing TS errors remain (all in legacy TrialChatbot.tsx)

## Attendance Log - Show Student Name

- [x] Updated getAllAttendance to return studentName (from enrollments.studentName) and parentName (from enrollments.customerName) separately
- [x] Updated AdminAttendance UI to display studentName as primary, falling back to parentName if studentName is blank
- [x] Added a subtle 'Parent: [name]' sub-label under the student name when both are present

## Tomball HQ About Page / Facility Showcase

- [x] Upload 4 facility photos to CDN (entrance/torii gate, main floor x2, kickboxing room)
- [x] Built rich "About Our Tomball Location" section in LocationDetail.tsx (HQ-only)
- [x] Added interactive photo gallery with 4 facility images and caption overlays
- [x] Added story copy: "A Facility Built for Champions" + "The MyDojo Promise"
- [x] Added 8-item amenities grid: 3,500+ sq ft, 500+ members, reserved parking, waiting area, coffee bar, vending, free WiFi, daily cleaning
- [x] Added "View Tomball MyDojo on Google Maps" link in gallery and sidebar
- [x] Added "View Tomball MyDojo on Google Maps" link to Locations listing page card

## Navigation Programs Dropdown

- [x] Replace flat "Programs" and "Summer Camp" nav links with a Programs dropdown in the desktop header
- [x] Dropdown should list: Little Ninjas, Dragon Kids (Core Kids), Teens & Adults, Kickboxing, After School, Summer Camp
- [x] Update mobile menu to show Programs as an expandable accordion section with the same sub-links
- [x] Remove standalone "Summer Camp" top-level nav item (now nested under Programs)

## Mobile Nav Visibility Fix

- [ ] Fix mobile hamburger menu hidden on home page hero - header positioned at bottom of viewport (top:100vh) so menu button is off-screen on first load
- [ ] Add a separate always-visible mobile nav bar fixed to the top of the screen on the home page

## Lead Magnet Pop-up
- [ ] Add leadMagnetLeads table to DB schema
- [ ] Add tRPC mutation to save lead magnet email submissions
- [ ] Build LeadMagnetPopup React component (timed, 15s delay)
- [ ] Respect "don't show again" via localStorage
- [ ] Send confirmation email via Resend with guide content
- [ ] Wire pop-up into Layout.tsx so it appears site-wide

- [x] Lead magnet pop-up: remove 15s timer, trigger only on exit-intent (desktop mouseleave + mobile visibilitychange)
- [x] Lead magnet pop-up: add phone number field (optional)
- [x] Update leadMagnet backend to accept and store phone number (schema + migration + router)

- [x] Rename "Intro Appointments" to "Leads" across admin portal (page title, nav, breadcrumbs, buttons, dialogs, toasts)
- [x] Add date/time (createdAt) column to the Leads table in admin portal

- [x] Add pipelineStage column to trialSignups schema (new_lead, contacted, intro_scheduled, showed_up, offer_presented, enrolled, nurture)
- [x] Add updateLeadPipelineStage tRPC mutation for drag-and-drop stage updates
- [x] Build LeadsKanbanBoard component with 7 pipeline columns
- [x] Add drag-and-drop support using @dnd-kit
- [x] Add view toggle (table / board) to Leads admin page
- [x] Lead cards show: name, program, source badge, date added, phone

- [x] Add notes column to trialSignups schema and push migration
- [x] Add getLeadById, updateLeadNotes, updateLeadStatus tRPC procedures
- [x] Build LeadDetailPanel slide-out component (full details, stage selector, status selector, quick actions, notes)
- [x] Wire LeadDetailPanel into LeadsKanbanBoard (click card to open)
- [x] Wire LeadDetailPanel into table view (click row to open, action buttons stop propagation)

- [x] Add LocalBusiness + SportsActivityLocation schema to homepage, about, and contact pages
- [x] Add FAQPage schema to homepage (8 questions)
- [x] Add WebSite schema with SearchAction to homepage
- [x] Add Course schema to Programs page and each ProgramDetail page
- [x] Add Event schema to Schedule page for 6 recurring classes
- [x] Add BreadcrumbList schema to all inner pages (Programs, ProgramDetail, Schedule, About, Contact)

- [x] Add dynamic /sitemap.xml server route listing all public pages (20 URLs, canonical mydojoma.com domain)
- [x] Update robots.txt to reference canonical sitemap URL and add /admin/ + /api/ disallow rules

- [ ] Fix chatbot appointment scheduling to use CST/CDT (America/Chicago) timezone
- [ ] Ensure class schedule availability checks use CST time, not UTC

- [x] Fix chatbot appointment scheduling to use CST/CDT (America/Chicago) timezone
  - Fixed intakeStateMachine.ts TRIAL_TRANSITION and FAST_FIRST_LESSON slot generation (3 locations)
  - Fixed intakeStateMachine.trialFirst.ts generateDefaultSlots() fallback
  - Fixed routers.ts appointment date/day-of-week calculation for weather fetch
- [x] Ensure class schedule availability checks use CST time (scheduleHelpers.ts already correct)

- [x] Research 800.com SMS API endpoints and authentication
- [x] Add EIGHT_HUNDRED_API_KEY and EIGHT_HUNDRED_FROM_NUMBER secrets
- [x] Build server-side 800.com SMS helper (server/sms800.ts)
- [x] Add admin.sendSms tRPC mutation to router
- [x] Add SMS compose UI to LeadDetailPanel (message input + Send button + dialog)
- [ ] Show SMS send history in LeadDetailPanel communication tab

- [x] Multi-select leads for bulk delete in admin Leads table
  - [x] Add checkboxes to each table row (and a "select all" header checkbox)
  - [x] Show floating action bar when 1+ leads are selected (count + Delete button)
  - [x] Add admin.bulkDeleteLeads tRPC mutation
  - [x] Confirm dialog before deletion
  - [x] Deselect all after successful delete

- [x] CSV export button in Leads table action bar
  - [x] Export selected leads when rows are checked
  - [x] Export all filtered leads when nothing is selected
  - [x] Include all relevant columns: Name, Phone, Email, Program, Pipeline Stage, Status, Source, Scheduled Time, Date Added, Notes
  - [x] Filename includes timestamp (e.g. leads-2026-03-08.csv)

- [x] Fix admin dashboard data accuracy
  - [x] Wire "Active Students" stat to real member count from DB
  - [x] Wire "Check-ins Today" stat to real attendance count from DB
  - [x] Add "Total Leads" stat (all-time count from trialSignups)
  - [x] Add "New Leads This Week" stat
  - [x] Add "Enrolled This Month" stat
  - [x] Add Lead Pipeline funnel chart (bar chart by stage)
  - [x] Add recent leads list with pipeline stage badges
  - [x] Add recent check-ins list

- [x] Last Contacted column in Leads table
  - [x] Add lastContactedAt column to trialSignups schema
  - [x] Run DB migration (pnpm db:push)
  - [x] Add admin.recordContact tRPC mutation to stamp lastContactedAt
  - [x] Auto-stamp on SMS send (sendLeadSms)
  - [x] Auto-stamp on Call click in LeadDetailPanel
  - [x] Auto-stamp on Email click in LeadDetailPanel
  - [x] Add "Last Contacted" column to AdminIntroAppointments table
  - [x] Show "Last Contacted" in LeadDetailPanel overview tab
  - [x] Include Last Contacted + method in CSV export

- [x] "Needs Follow-up" quick filter in Leads table
  - [x] Add needsFollowUp filter toggle state
  - [x] Filter logic: leads not contacted in last 48h (lastContactedAt null OR > 48h ago), excluding enrolled leads
  - [x] Toggle button in filter bar with count badge
  - [x] Clear filter when toggled off

- [x] Delete old member dashboard (MemberDashboard.tsx / /dashboard-old route) and clean up routing

- [ ] Instructor messaging feature (admin dashboard)
  - [ ] Add studentMessages table to schema (id, studentId, channel, subject, body, sentAt, sentBy)
  - [ ] Run DB migration
  - [ ] Add admin.sendStudentMessage tRPC mutation (SMS via 800.com or email via Resend)
  - [ ] Add admin.getStudentMessages tRPC query (list sent messages)
  - [ ] Build AdminMessages UI: student search/picker, channel selector (SMS/Email), compose form, sent history table
  - [ ] Add Messages link to admin sidebar navigation

- [x] Fix nested <a> tag error on /admin/intro-appointments page (removed inner <a> from Link nav items in AdminLayout)

- [x] 6-digit PIN gate for deleting leads/students + audit log
  - [x] Add deletionAuditLog table to schema (id, action, targetType, targetId, targetName, performedBy, performedByName, timestamp)
  - [x] Add adminConfig table (key, value) to store the delete PIN
  - [x] Run DB migration (tables created via direct SQL)
  - [x] Add admin.setDeletePin tRPC mutation
  - [x] Add admin.getDeletePinStatus query
  - [x] Add admin.verifyDeletePin mutation
  - [x] Update deleteIntroAppointment and bulkDeleteLeads to require PIN + write audit log
  - [x] Build reusable PinConfirmDialog component (6-digit input boxes, auto-submit on 6th digit, paste support)
  - [x] Wire PinConfirmDialog into single-lead delete in AdminIntroAppointments
  - [x] Wire PinConfirmDialog into bulk delete in AdminIntroAppointments
  - [x] Build AdminAuditLog page at /admin/audit-log (table with search, pagination)
  - [x] Add Audit Log link to admin sidebar (admin-only)
  - [x] Add Set/Change PIN button on audit log page

- [x] Replace student/staff dropdown in Messages with searchable contact list panel
  - [x] Add search bar above the conversations list to filter active threads
  - [x] Replace Select dropdown with scrollable searchable student list in New Message dialog
  - [x] Filter list in real-time as user types (name)
  - [x] Show selected student as a chip with clear button
  - [x] Auto-focus search input when dialog opens
  - [x] Show result count below the list

- [x] Remove public website nav bar from student dashboard pages (keep only dashboard sidebar) - moved /dashboard route outside Layout wrapper in App.tsx

- [ ] Student dashboard visual redesign (UI only, no backend changes)
  - [ ] Dark glass UI with red #E11D2A accents, glassmorphism panels
  - [ ] Top nav: MYDOJO logo + Dashboard/Curriculum/Progress/Messages tabs + notifications + avatar
  - [ ] Hero section: cinematic current lesson card with martial arts image + next class overlay
  - [ ] Welcome panel: avatar badge + Resume Course / Check In / View Schedule buttons
  - [ ] Goals widget: train 5x/week, watch videos, complete drills with progress bars
  - [ ] Progress ring: animated circular ring, XP level, belt progress bar
  - [ ] Achievements panel: unlocked/locked techniques with badge icons
  - [ ] Quick actions: QR Check-in, Book a Class, Join Live Class, Training Timer
  - [ ] Announcements: card-style with red notification dot
  - [ ] Messages widget: latest messages with avatars
  - [ ] Training resources: Video Library, Practice Drills, Skill Guides, Community Forum
  - [ ] Training streak counter, XP level, hover/transition animations

- [ ] Progress tab in student dashboard
  - [ ] Add member.getProgressStats tRPC query (attendance by week, belt history, total classes, streak)
  - [ ] Weekly attendance bar chart (Chart.js, last 12 weeks)
  - [ ] Belt advancement timeline with dates
  - [ ] Total classes attended stat card
  - [ ] Current streak stat card
  - [ ] Program breakdown (classes by program type)

- [x] Add Light/Dark/Auto theme toggle to student dashboard top-right nav
- [x] Persist theme preference to localStorage
- [x] Apply dark theme styles (dark red/charcoal sunset) when dark mode active
- [x] Add mobile bottom tab bar (Dashboard/Curriculum/Progress/Messages) to student dashboard
- [x] Add red dot badge on Messages tab icon showing unread instructor message count
- [x] Add getUnreadMessageCount tRPC procedure to member router
- [x] Build real conversation thread UI in Messages tab (list + thread + reply)
- [x] Add getConversations, getMessages, sendMessage, markAsRead tRPC procedures
- [x] Show banner notification at top of dashboard when new instructor message arrives
- [ ] Fix kiosk attendance check-in not working
- [x] Kiosk success screen: show special "Already Checked In" message when alreadyCheckedIn is true
- [x] Kiosk birthday detection: compare dateOfBirth to today, return isBirthday in checkIn result, show birthday celebration on success screen
- [x] Admin dashboard: "Today's Birthdays" widget showing enrolled students with birthdays today
- [ ] Add getTodayAttendance procedure to admin router
- [ ] Build AttendanceLog component in admin CRM with real-time refresh
- [ ] Kiosk confirmation screen class selector - show today's scheduled classes when no class pre-selected

## Day Pass Feature
- [x] Add dayPasses table to schema (name, email, phone, program, amount, stripePaymentIntentId, status, createdAt)
- [x] Add createDayPassPaymentIntent tRPC procedure (creates Stripe PaymentIntent, returns clientSecret)
- [x] Add confirmDayPassCheckIn tRPC procedure (verifies payment, records attendance, returns success)
- [x] Add getDayPassConfig tRPC procedure (returns price from adminConfig)
- [x] Build kiosk Day Pass UI: entry button on idle screen
- [x] Build kiosk Day Pass UI: info collection form (name, email, phone, program)
- [x] Build kiosk Day Pass UI: payment screen with Stripe Elements card input
- [x] Build kiosk Day Pass UI: success screen after payment + check-in

## Admin Settings - Day Pass Price
- [x] Add getDayPassConfig and setDayPassConfig admin tRPC procedures
- [x] Create AdminSettings page with Day Pass price editor
- [x] Register /admin/settings route in App.tsx

## Fluid Pay Integration (Day Pass)
- [x] Store FLUIDPAY_SECRET_KEY and VITE_FLUIDPAY_PUBLIC_KEY env vars
- [x] Replace Stripe backend (createDayPassPaymentIntent) with Fluid Pay transaction API
- [x] Replace Stripe Elements frontend with Fluid Pay Tokenizer.js iframe
- [x] Remove @stripe/stripe-js dependency from Day Pass component

## Fluid Pay Membership Enrollment
- [ ] Research Fluid Pay recurring billing / subscription API
- [ ] Replace Stripe Checkout Session (membership) with Fluid Pay inline payment + recurring billing
- [ ] Replace Stripe Checkout Session (summer camp) with Fluid Pay one-time charge
- [ ] Update EnrollmentSuccess page to handle Fluid Pay confirmation
- [ ] Update enrollment webhook/confirmation to use Fluid Pay transaction IDs

## Admin Promote Belt Feature
- [x] Add admin.promoteBelt tRPC procedure (advance belt rank, reset stripe counter, log promotion)
- [x] Build Promote Belt dialog UI in AdminStudents.tsx (confirm dialog with next belt preview)
- [x] Add "Promote Belt" option to student row dropdown menu

## Orange Belt Exam Eligibility Email Automation
- [x] Add sendBeltExamEligibleEmail to emailService.ts with rich HTML template and payment link
- [x] Add createBeltExamCheckoutSession server procedure (public, enrollment-ID-based for email links)
- [x] Wire exam eligibility detection into kioskCheckIn and recordCheckIn (Orange Belt + allPhasesComplete → send email once, set beltExamEligible=1)
- [x] Add admin.triggerBeltExamEmail procedure for manual resend from admin panel
- [x] Add "Resend Exam Email" option to AdminStudents dropdown for eligible students

## Belt Exam Fee Stripe Webhook
- [x] Add handleBeltExamPayment() function to stripeWebhook.ts (set beltExamFeePaid=1, log to beltPromotions)
- [x] Route checkout.session.completed with metadata.type==='belt_exam' to the new handler
- [x] Add sendBeltExamPaidInstructorEmail() to emailService.ts (notify instructor/admin)
- [x] Send owner push notification via notifyOwner() on exam fee paid

## Summer Camp & Kickboxing Lead Capture Popups
- [x] Add popupLeads table to drizzle/schema.ts (campaign, name, email, phone, source)
- [x] Run db:push to create the table
- [x] Add popup.submitLead tRPC procedure (dedup by email+campaign, notify owner)
- [x] Build SummerCampPopup.tsx component (timed trigger at 8s + scroll 40%)
- [x] Build KickboxingPopup.tsx component (exit-intent + scroll 60%)
- [x] Wire both popups into Layout.tsx with separate localStorage dismiss keys
- [ ] Add admin view for popup leads in admin panel (future)

## Popup Slideshow Redesign
- [x] Build PopupSlideshow.tsx — full-screen two-slide carousel (Summer Camp + Kickboxing)
- [x] Replace SummerCampPopup + KickboxingPopup in Layout.tsx with single PopupSlideshow

## Bug Fixes (from user screenshots)
- [x] Fix Kai: recognize adult enrollees (spouse/husband/wife/partner/friend) — don't ask for child's name
- [x] Fix Kai: break scheduling loop when user says "Neither works" — ask for their availability instead of repeating same slots
- [x] Fix waiver: scroll-to-bottom gate not unlocking sign button on mobile

## Kai 'Someone Else' Adult Flow Audit
- [x] Audit all messages in the OTHER/someone-else branch for child-oriented language
- [x] Fix any child-specific questions (child name, child age, school grade, etc.) that appear in adult flow
- [x] Ensure program recommendations for "other" enrollees are adult-appropriate
- [x] Verify relationship context is carried through the full conversation

## Kai Skip Age for Adult 'Other' Enrollees
- [x] Skip CHILD_AGE step when classFor === "other" and enrollee is an adult (spouse/partner/friend)
- [x] Route directly from CHILD_NAME to RAPID_RAPPORT_ADULT then EMOTIONAL_DISCOVERY for adult "other" enrollees
- [x] Ensure program defaults to adult-appropriate programs when age is not collected
- [x] Update CLASS_FOR handler to use context-aware name question (child vs adult)
- [x] Add RAPID_RAPPORT_ADULT (prior training?) step for "other" adult enrollees

## Kai Program Recommendation — Adult 'Other' Default
- [ ] Audit resolveProgram / program recommendation for age-dependent branching
- [ ] Fix: when classFor === "other" and no age is collected, default to adult programs (Teens & Adults / Kickboxing)
- [ ] Ensure segment/program assignment doesn't fall back to child programs for adult enrollees

## Kai Chatbot Intelligence Improvements

- [ ] Kai: Detect classFor/intent from opening message — skip CLASS_FOR question when user already says "for my husband/wife/child/etc." in their first message

## Child Profiles (Parent Portal)

- [ ] Add `childProfiles` table to schema (userId, name, dob, photoUrl, photoKey, program, beltRank)
- [ ] Add tRPC procedures: childProfiles.list, childProfiles.create, childProfiles.update, childProfiles.delete
- [ ] Add S3 photo upload endpoint for child profile photos
- [ ] Build parent-facing "My Children" page with add/edit child form
- [ ] Camera capture + file upload for child photo (mobile-friendly)
- [ ] Surface child profiles in admin dashboard (linked to parent account)
- [ ] Run pnpm db:push for schema migration

## Member Self-Photo Upload

- [x] Backend: add member.uploadSelfPhoto tRPC procedure to update enrollment photoUrl from S3 upload
- [x] Member portal: clicking profile avatar opens photo picker (file upload + camera option)
- [x] Attendance/roster: member self-photo appears alongside parent-uploaded child photos

## FluidPay Member Visibility Fix

- [x] Remove stripeCustomerId NOT NULL filter from getAllStudents — FluidPay members (no Stripe ID) were invisible in admin panel
- [x] Fix active member count stat to count all active enrollments, not just Stripe-linked ones

## Kiosk Fullscreen Lockdown Mode

- [ ] Kiosk check-in screen enters fullscreen on launch (Fullscreen API)
- [ ] Browser chrome hidden, no way to navigate away without PIN
- [ ] PIN code 202020 required to exit kiosk and return to admin panel
- [ ] PIN entry dialog appears on long-press or hidden tap area

## Enrollment Flow Mobile Redesign

- [ ] Audit current enrollment/contract pages and identify all pain points
- [ ] Rebuild as multi-step wizard: Info → Contract → Signature → Payment
- [ ] Contract on its own full-screen step with large readable text
- [ ] Fat-finger-safe tap targets (min 48px height on all buttons/inputs)
- [ ] Progress bar showing which step the user is on
- [ ] "Back" button that doesn't lose form data (no accidental restarts)
- [ ] Payment step only appears after contract is signed
- [ ] Mobile-first layout with proper spacing and font sizes

## Kiosk Lock Icon Toggle
- [ ] Replace hidden hold-down trigger with visible lock icon at bottom of kiosk screen
- [ ] Tapping lock icon opens PIN pad (202020)
- [ ] Correct PIN toggles fullscreen lock mode ON (locked) or OFF (unlocked/exit kiosk)

## GHL & Facebook Lead Integration Fix
- [x] Fix GHL webhook body parsing (route registered before express.json middleware)
- [x] Add Facebook Lead Ads webhook endpoint with verification handshake
- [x] Add facebook source color to LeadsKanbanBoard









- [x] Add collapsible sidebar (desktop) and hamburger menu (mobile) to AdminLayout
- [x] Add real-time Active Now indicator to admin sidebar footer showing current check-ins
