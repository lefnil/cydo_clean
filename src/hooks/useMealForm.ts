import { useReducer, useCallback, useMemo } from 'react';
import { z } from 'zod';
import type { MEALRecord } from '../types/meal';
// toast removed (missing dep) - using console

// Form validation schema
const mealFormSchema = z.object({
  ppaName: z.string().min(1, 'PPA Name is required'),
  ppaType: z.enum(['Program', 'Project', 'Activity']),
  aipReferenceCode: z.string().min(1, 'AIP Reference Code is required'),
  ydpIndicator: z.string().min(1,'YDP indicator'),
  startDate: z.string().min(1, 'Start Date is required'),
  endDate: z.string().min(1, 'End Date is required'),
  centerOfParticipation: z.string().min(1, 'Center is required'),
  sdgGoal: z.string().min(1, 'SDG Goal is required'),
  budgetAllocated: z.coerce.number().min(0, 'Budget must be ≥ 0'),
  budgetUtilized: z.coerce.number().min(0, 'Budget must be ≥ 0'),
  expectedAttendees: z.coerce.number().min(0),
  actualAttendees: z.coerce.number().min(0),
  // Add more fields as needed...
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'End date must be after start date',
  path: ['endDate']
});

type MealFormData = z.infer<typeof mealFormSchema> & Partial<Omit<MEALRecord, keyof z.infer<typeof mealFormSchema>>>;

type FormAction = 
  | { type: 'SET_FIELD'; field: keyof MealFormData; value: any }
  | { type: 'SET_STEP'; step: 1 | 2 | 3 }
  | { type: 'RESET' }
  | { type: 'SET_ERRORS'; errors: Record<string, string> };

const formReducer = (state: MealFormData & { step: 1 | 2 | 3; errors: Record<string, string> }, action: FormAction): typeof state => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, errors: { ...state.errors, [action.field]: '' } };
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'RESET':
      return { step: 1, errors: {} } as typeof state;
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    default:
      return state;
  }
};

export const useMealForm = (initialData?: Partial<MEALRecord>) => {
  const [state, dispatch] = useReducer(formReducer, {
    step: 1,
    errors: {},
    ...initialData
  } as MealFormData & { step: 1 | 2 | 3; errors: Record<string, string> });

  const updateField = useCallback((field: keyof MealFormData, value: any) => {
    dispatch({ type: 'SET_FIELD' as const, field, value });
  }, []);

  const setStep = useCallback((step: 1 | 2 | 3) => {
    dispatch({ type: 'SET_STEP' as const, step });
  }, []);

  const validateStep = useCallback(async (step: 1 | 2 | 3) => {
    // Step-specific validation can be added here
    const result = mealFormSchema.safeParse(state);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(err => {
        errors[err.path[0] as string] = err.message;
      });
      dispatch({ type: 'SET_ERRORS' as const, errors });
      return false;
    }
    dispatch({ type: 'SET_ERRORS' as const, errors: {} as Record<string, string> });
    return true;
  }, [state]);

  const submit = useCallback(async () => {
    const valid = await validateStep(3);
    if (!valid) return false;

    try {
      console.log('Form submitted successfully!');
      dispatch({ type: 'RESET' as const });
      return true;
    } catch (err) {
      console.error('Submission failed');
      return false;
    }
  }, [validateStep]);

  const canNext = useMemo(() => Object.keys(state.errors).length === 0, [state.errors]);

  return {
    form: state,
    updateField,
    setStep,
    validateStep,
    submit,
    canNext,
    errors: state.errors
  };
};

