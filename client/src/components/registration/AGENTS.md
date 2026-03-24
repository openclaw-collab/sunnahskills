<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# registration

## Purpose
Multi-step registration wizard components. Handles the complete registration flow from program selection to payment submission.

## Key Files

| File | Description |
|------|-------------|
| `ProgressIndicator.tsx` | Step progress bar (1-5) |
| `ProgramSummaryCard.tsx` | Selected program display with pricing |
| `StepGuardianInfo.tsx` | Step 1: Parent/guardian information |
| `StepStudentInfo.tsx` | Step 2: Student information |
| `StepProgramDetails.tsx` | Step 3: Program-specific fields + sibling discount |
| `StepWaivers.tsx` | Step 4: Liability waivers and signatures |
| `StepPayment.tsx` | Step 5: Order summary + Stripe Elements |
| `OrderSummaryCard.tsx` | Pricing breakdown + discount code field |
| `ResumeBanner.tsx` | Draft recovery prompt for saved registrations |

## Registration Flow

1. **Step 1**: Guardian info (name, email, phone, emergency contact, relationship)
2. **Step 2**: Student info (name, DOB, experience, medical notes)
3. **Step 3**: Program details (BJJ / Archery / Outdoor / Bullyproofing branching)
4. **Step 4**: Waivers and signature
5. **Step 5**: Payment and confirmation

## State Management

- `useRegistration` hook manages draft state
- Draft persisted to localStorage (key: `ss-reg-draft-{slug}`)
- Validation via `useStepValidation` hook
- Program config and payment behavior come from `lib/programConfig.ts`

## For AI Agents

### Working In This Directory
- Each step is a self-contained form section
- Steps communicate via parent component callbacks
- Validation runs on blur and before navigation
- Draft auto-saves to localStorage

### Payment Integration
- One-time programs: Stripe PaymentIntent
- BJJ (recurring): Stripe Subscription with a one-time fallback
- Waits for capacity check before payment creation
- Waivers now require a typed signature plus a valid date before the wizard can advance

### Patterns
```typescript
// Step component structure
export function StepComponent({
  data,
  onChange,
  onValidate
}: StepProps) {
  const { errors, validateAndTouch } = useStepValidation("guardian", draft);

  return (
    <form>
      {/* form fields */}
    </form>
  );
}
```

<!-- MANUAL: -->
