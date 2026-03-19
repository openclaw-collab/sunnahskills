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
| `StepMedicalInfo.tsx` | Step 3: Medical information |
| `StepReview.tsx` | Step 4: Review all information |
| `StepWaivers.tsx` | Step 5: Liability waivers and signatures |

## Registration Flow

1. **Step 1**: Guardian info (name, email, phone, emergency contact)
2. **Step 2**: Student info (name, DOB, school, experience)
3. **Step 3**: Medical info (conditions, allergies, medications)
4. **Step 4**: Review all data, select payment method
5. **Step 5**: Sign waivers, submit & pay

## State Management

- `useRegistration` hook manages draft state
- Draft persisted to localStorage (key: `ss-reg-draft-{slug}`)
- Validation via `useStepValidation` hook
- Zod schemas in `lib/programSchemas.ts`

## For AI Agents

### Working In This Directory
- Each step is a self-contained form section
- Steps communicate via parent component callbacks
- Validation runs on blur and before navigation
- Draft auto-saves to localStorage

### Payment Integration
- One-time programs: Stripe PaymentIntent
- BJJ (recurring): Stripe Subscription
- Waits for capacity check before payment creation

### Patterns
```typescript
// Step component structure
export function StepComponent({
  data,
  onChange,
  onValidate
}: StepProps) {
  const { validate, errors } = useStepValidation(schema);

  return (
    <form>
      {/* form fields */}
    </form>
  );
}
```

<!-- MANUAL: -->
