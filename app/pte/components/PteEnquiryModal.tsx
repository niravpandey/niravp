"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { submitPteEnquiry } from "../actions";
import {
  availabilityDays,
  availabilityPeriods,
  classTypes,
  enquirySteps,
  focusAreas,
  scoreGoals,
  type ClassType,
  type EnquiryState,
} from "./pteContent";

const chipClassName =
  "block cursor-pointer border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-900 hover:bg-gray-50 peer-checked:border-mauve-500 peer-checked:bg-mauve-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-mauve-500 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-60";

function useModalFocusTrap({
  isOpen,
  modalRef,
  closeButtonRef,
  onClose,
}: {
  isOpen: boolean;
  modalRef: React.RefObject<HTMLDivElement | null>;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const modal = modalRef.current;

      if (!modal) {
        return;
      }

      const focusableElements = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeButtonRef, isOpen, modalRef, onClose]);
}

export function EnquiryModal({
  isOpen,
  selectedClassType,
  onClassTypeChange,
  onClose,
}: {
  isOpen: boolean;
  selectedClassType: string;
  onClassTypeChange: (classType: ClassType) => void;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [state, formAction, isPending] = useActionState(submitPteEnquiry, null);
  const formDisabled = isPending || Boolean(state?.success);
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === enquirySteps.length - 1;

  useModalFocusTrap({
    isOpen,
    modalRef,
    closeButtonRef,
    onClose,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-blue-900/40 p-0 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pte-enquiry-title"
        className="max-h-[92vh] w-full overflow-y-auto border border-gray-200 bg-white p-4 shadow-xl transition-transform duration-200 motion-reduce:transition-none sm:mx-auto sm:max-w-3xl sm:p-6"
      >
        <ModalHeader closeButtonRef={closeButtonRef} onClose={onClose} />
        <StepIndicator currentStep={currentStep} />

        <EnquiryForm
          currentStep={currentStep}
          formAction={formAction}
          formDisabled={formDisabled}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          isPending={isPending}
          selectedClassType={selectedClassType}
          state={state}
          onBack={() => setCurrentStep((step) => Math.max(step - 1, 0))}
          onClassTypeChange={onClassTypeChange}
          onNext={() => setCurrentStep((step) => Math.min(step + 1, enquirySteps.length - 1))}
        />
      </div>
    </div>
  );
}

function ModalHeader({
  closeButtonRef,
  onClose,
}: {
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-mauve-500">
          PTE enquiry
        </p>
        <h2 id="pte-enquiry-title" className="mt-1 text-2xl font-semibold text-blue-900">
          Tell me what you need
        </h2>
      </div>
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition-colors hover:border-blue-900 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2"
        aria-label="Close enquiry form"
      >
        <PhosphorIcon name="x" size={16} />
      </button>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mt-5" aria-label="Enquiry progress">
      <div className="flex items-center px-2">
        {enquirySteps.map((step, index) => {
          const isComplete = index < currentStep;
          const isActive = index === currentStep;
          const isReached = index <= currentStep;

          return (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors motion-reduce:transition-none ${
                  isReached
                    ? "border-blue-900 bg-blue-900 text-white"
                    : "border-gray-300 bg-white text-gray-400"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {index + 1}
              </div>
              {index < enquirySteps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-colors motion-reduce:transition-none ${
                    isComplete ? "bg-blue-900" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1 text-center">
        {enquirySteps.map((step, index) => (
          <span
            key={step}
            className={`text-[0.7rem] font-semibold leading-tight sm:text-xs ${
              index === currentStep
                ? "text-blue-900"
                : index < currentStep
                  ? "text-gray-700"
                  : "text-gray-400"
            }`}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

function EnquiryForm({
  currentStep,
  formAction,
  formDisabled,
  isFirstStep,
  isLastStep,
  isPending,
  selectedClassType,
  state,
  onBack,
  onClassTypeChange,
  onNext,
}: {
  currentStep: number;
  formAction: (payload: FormData) => void;
  formDisabled: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  isPending: boolean;
  selectedClassType: string;
  state: EnquiryState | null;
  onBack: () => void;
  onClassTypeChange: (classType: ClassType) => void;
  onNext: () => void;
}) {
  return (
    <form action={formAction} className="mt-5 grid gap-5">
      <ClassTypeStep
        active={currentStep === 0}
        disabled={formDisabled}
        selectedClassType={selectedClassType}
        onClassTypeChange={onClassTypeChange}
      />
      <WeakAreasStep active={currentStep === 1} disabled={formDisabled} />
      <TargetScoreStep active={currentStep === 2} disabled={formDisabled} />
      <AvailabilityStep active={currentStep === 3} disabled={formDisabled} />
      <ContactDetailsStep active={currentStep === 4} disabled={formDisabled} />

      <StepControls
        canGoNext={currentStep !== 0 || Boolean(selectedClassType)}
        formDisabled={formDisabled}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        isPending={isPending}
        onBack={onBack}
        onNext={onNext}
      />
      <FormStatus state={state} />
    </form>
  );
}

function ClassTypeStep({
  active,
  disabled,
  selectedClassType,
  onClassTypeChange,
}: {
  active: boolean;
  disabled: boolean;
  selectedClassType: string;
  onClassTypeChange: (classType: ClassType) => void;
}) {
  return (
    <StepFieldset active={active} disabled={disabled} legend="Class type">
      <div className="grid gap-2 sm:grid-cols-2">
        {classTypes.map((classType) => (
          <label key={classType.value} className="block">
            <input
              type="radio"
              name="classType"
              value={classType.value}
              checked={selectedClassType === classType.value}
              onChange={() => onClassTypeChange(classType.value)}
              required
              className="peer sr-only"
            />
            <span className="block cursor-pointer border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-900 hover:bg-gray-50 peer-checked:border-blue-900 peer-checked:bg-blue-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-900 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-60">
              {classType.label}
            </span>
          </label>
        ))}
      </div>
    </StepFieldset>
  );
}

function WeakAreasStep({
  active,
  disabled,
}: {
  active: boolean;
  disabled: boolean;
}) {
  return (
    <StepFieldset
      active={active}
      disabled={disabled}
      legend="What do you want the most help with?"
    >
      <ChipGroup
        inputType="checkbox"
        name="focusAreas"
        options={focusAreas.map((area) => ({
          label: area,
          value: area.toLowerCase().replaceAll(" ", "-"),
        }))}
      />
    </StepFieldset>
  );
}

function TargetScoreStep({
  active,
  disabled,
}: {
  active: boolean;
  disabled: boolean;
}) {
  return (
    <StepFieldset
      active={active}
      disabled={disabled}
      legend="What score are you aiming for?"
    >
      <ChipGroup
        inputType="radio"
        name="scoreGoal"
        options={scoreGoals.map((goal) => ({ label: goal, value: goal }))}
      />
    </StepFieldset>
  );
}

function AvailabilityStep({
  active,
  disabled,
}: {
  active: boolean;
  disabled: boolean;
}) {
  return (
    <StepFieldset
      active={active}
      disabled={disabled}
      legend="When are you usually available?"
    >
      <p className="text-sm text-gray-600">
        Select all times that could work for you.
      </p>

      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[42rem] grid-cols-7 gap-2">
          {availabilityDays.map((day) => (
            <AvailabilityDay key={day} day={day} />
          ))}
        </div>
      </div>
    </StepFieldset>
  );
}

function AvailabilityDay({ day }: { day: string }) {
  return (
    <div className="border border-gray-200 bg-white p-2">
      <p className="border-b border-gray-200 pb-2 text-center text-sm font-semibold text-blue-900">
        {day}
      </p>
      <div className="mt-2 grid gap-2">
        {availabilityPeriods.map((period) => {
          const value = `${day.toLowerCase()}-${period.value}`;

          return (
            <label key={value} className="block">
              <input
                type="checkbox"
                name="availability"
                value={value}
                className="peer sr-only"
              />
              <span
                aria-label={period.label}
                title={period.label}
                className="flex cursor-pointer items-center justify-center border border-gray-300 bg-white px-2 py-2 text-gray-700 transition-colors hover:border-blue-900 hover:bg-gray-50 peer-checked:border-blue-900 peer-checked:bg-blue-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-900 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-60"
              >
                <PhosphorIcon name={period.icon} size={18} />
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ContactDetailsStep({
  active,
  disabled,
}: {
  active: boolean;
  disabled: boolean;
}) {
  return (
    <StepFieldset active={active} disabled={disabled} legend="Contact details">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="firstName"
          label="First name"
          name="firstName"
          required
          autoComplete="given-name"
        />
        <TextField
          id="lastName"
          label="Last name"
          name="lastName"
          required
          autoComplete="family-name"
        />
      </div>

      <TextField
        id="email"
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
      />
      <TextField
        id="phone"
        label="Phone number"
        name="phone"
        type="tel"
        autoComplete="tel"
      />
    </StepFieldset>
  );
}

function StepFieldset({
  active,
  children,
  disabled,
  legend,
}: {
  active: boolean;
  children: React.ReactNode;
  disabled: boolean;
  legend: string;
}) {
  return (
    <fieldset className={active ? "grid gap-2" : "hidden"} disabled={disabled}>
      <legend className="text-base font-semibold text-gray-900">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

function ChipGroup({
  inputType,
  name,
  options,
}: {
  inputType: "checkbox" | "radio";
  name: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={option.value} className="block">
          <input
            type={inputType}
            name={name}
            value={option.value}
            className="peer sr-only"
          />
          <span className={chipClassName}>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function TextField({
  id,
  label,
  name,
  type = "text",
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-gray-800">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={Boolean(required)}
        autoComplete={autoComplete}
        className="mt-1 w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15 disabled:opacity-60"
      />
    </div>
  );
}

function StepControls({
  canGoNext,
  formDisabled,
  isFirstStep,
  isLastStep,
  isPending,
  onBack,
  onNext,
}: {
  canGoNext: boolean;
  formDisabled: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  isPending: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirstStep || formDisabled}
        className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-900 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-60"
      >
        Back
      </button>

      {isLastStep ? (
        <button
          type="submit"
          disabled={formDisabled}
          className="border border-mauve-500 bg-mauve-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-mauve-600 focus:outline-none focus:ring-2 focus:ring-mauve-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Submit enquiry"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={formDisabled || !canGoNext}
          className="border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-60"
        >
          Next
        </button>
      )}
    </div>
  );
}

function FormStatus({ state }: { state: EnquiryState | null }) {
  if (!state) {
    return null;
  }

  return (
    <p
      role="status"
      className={state.success ? "text-sm font-semibold text-blue-900" : "text-sm text-red-700"}
    >
      {state.message}
    </p>
  );
}
