"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { submitPteEnquiry } from "../actions";
import {
  classTypes,
  enquirySteps,
  formatClassPrice,
  groupSavingsContextLabel,
  groupSavingsLabel,
  introSession,
  scores,
  type ClassType,
  type EnquiryState,
} from "./pteContent";
import {
  cx,
  pteAccentButtonClassName,
  pteChipClassName,
  pteChoiceClassName,
  pteFocusRing,
  ptePrimaryButtonClassName,
  pteSecondaryButtonClassName,
} from "./pteUi";
import { AvailabilityMatrix } from "./AvailabilityMatrix";

const notSureScoreGoal = "not-sure-yet";
const minTargetScore = 10;
const maxTargetScore = 90;
const initialTargetScore = 70;

function isValidTargetScore(scoreGoal: string) {
  if (scoreGoal === notSureScoreGoal) {
    return true;
  }

  if (!/^\d+$/.test(scoreGoal)) {
    return false;
  }

  const score = Number(scoreGoal);
  return score >= minTargetScore && score <= maxTargetScore;
}

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
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [selectedScoreGoal, setSelectedScoreGoal] = useState(String(initialTargetScore));
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
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
          selectedAvailability={selectedAvailability}
          selectedClassType={selectedClassType}
          selectedFocusAreas={selectedFocusAreas}
          selectedScoreGoal={selectedScoreGoal}
          state={state}
          onAvailabilityChange={setSelectedAvailability}
          onBack={() => setCurrentStep((step) => Math.max(step - 1, 0))}
          onClassTypeChange={onClassTypeChange}
          onFocusAreasChange={setSelectedFocusAreas}
          onNext={() => setCurrentStep((step) => Math.min(step + 1, enquirySteps.length - 1))}
          onScoreGoalChange={setSelectedScoreGoal}
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
          Let&apos;s find the right fit
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Start with a {introSession.title.toLowerCase()}.
        </p>
      </div>
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900 ${pteFocusRing}`}
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

          return (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors motion-reduce:transition-none ${
                  isActive
                    ? "border-blue-900 bg-blue-900 text-white"
                    : isComplete
                      ? "border-blue-900 bg-white text-blue-900"
                      : "border-gray-300 bg-white text-gray-400"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? <PhosphorIcon name="check" size={14} /> : index + 1}
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
  selectedAvailability,
  selectedClassType,
  selectedFocusAreas,
  selectedScoreGoal,
  state,
  onAvailabilityChange,
  onBack,
  onClassTypeChange,
  onFocusAreasChange,
  onNext,
  onScoreGoalChange,
}: {
  currentStep: number;
  formAction: (payload: FormData) => void;
  formDisabled: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  isPending: boolean;
  selectedAvailability: string[];
  selectedClassType: string;
  selectedFocusAreas: string[];
  selectedScoreGoal: string;
  state: EnquiryState | null;
  onAvailabilityChange: React.Dispatch<React.SetStateAction<string[]>>;
  onBack: () => void;
  onClassTypeChange: (classType: ClassType) => void;
  onFocusAreasChange: (focusAreas: string[]) => void;
  onNext: () => void;
  onScoreGoalChange: (scoreGoal: string) => void;
}) {
  const canGoNext =
    currentStep === 0
      ? selectedFocusAreas.length > 0
      : currentStep === 1
        ? isValidTargetScore(selectedScoreGoal)
        : currentStep === 2
          ? Boolean(selectedClassType)
          : currentStep === 3
            ? selectedAvailability.length > 0
            : true;

  return (
    <form action={formAction} className="mt-5 grid gap-5">
      <ImprovementAreasStep
        active={currentStep === 0}
        disabled={formDisabled}
        selectedFocusAreas={selectedFocusAreas}
        onFocusAreasChange={onFocusAreasChange}
      />
      <TargetScoreStep
        active={currentStep === 1}
        disabled={formDisabled}
        selectedScoreGoal={selectedScoreGoal}
        onScoreGoalChange={onScoreGoalChange}
      />
      <ClassTypeStep
        active={currentStep === 2}
        disabled={formDisabled}
        selectedClassType={selectedClassType}
        onClassTypeChange={onClassTypeChange}
      />
      <AvailabilityStep
        active={currentStep === 3}
        disabled={formDisabled}
        selectedAvailability={selectedAvailability}
        onAvailabilityChange={onAvailabilityChange}
      />
      <ContactDetailsStep active={currentStep === 4} disabled={formDisabled} />

      <StepControls
        canGoNext={canGoNext}
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
  const selectedValue = selectedClassType ?? "";

  return (
    <StepFieldset active={active} disabled={disabled} legend="How would you like to learn?">
      <div className="grid gap-2 sm:grid-cols-2">
        {classTypes.map((classType) => {
          const isSelected = selectedValue === classType.value;

          return (
            <label key={classType.value} className="block">
              <input
                type="radio"
                name="classType"
                value={classType.value}
                checked={isSelected}
                onChange={() => onClassTypeChange(classType.value)}
                required
                className="peer sr-only"
              />
              <span className={pteChoiceClassName}>
                <span className="flex flex-wrap items-center gap-2 text-base">
                  <span>{classType.label}</span>
                  {classType.value === "group" && (
                    <span
                      className={cx(
                        "w-fit border px-2 py-0.5 text-xs font-semibold",
                        isSelected
                          ? "border-white/40 bg-white/10 text-white"
                          : "border-mauve-500/40 bg-mauve-500/10 text-mauve-600",
                      )}
                    >
                      {groupSavingsLabel}
                      <span className="sr-only">
                        {groupSavingsContextLabel.slice(groupSavingsLabel.length)}
                      </span>
                    </span>
                  )}
                </span>
                <span className="mt-2 block text-lg font-semibold leading-none">
                  {formatClassPrice(classType.price)}
                </span>
                <span
                  className={cx(
                    "mt-2 block text-sm font-normal",
                    isSelected ? "text-blue-50" : "text-gray-600",
                  )}
                >
                  {classType.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </StepFieldset>
  );
}

function ImprovementAreasStep({
  active,
  disabled,
  selectedFocusAreas,
  onFocusAreasChange,
}: {
  active: boolean;
  disabled: boolean;
  selectedFocusAreas: string[];
  onFocusAreasChange: (focusAreas: string[]) => void;
}) {
  const scoreColors = Object.fromEntries(scores.map((score) => [score.label, score.color]));
  const improvementOptions = [
    {
      label: "Listening",
      value: "listening",
      icon: "headphones",
      color: scoreColors.Listening,
      textColor: "white",
    },
    {
      label: "Reading",
      value: "reading",
      icon: "book-open",
      color: scoreColors.Reading,
      textColor: "rgb(3, 7, 18)",
    },
    {
      label: "Speaking",
      value: "speaking",
      icon: "microphone",
      color: scoreColors.Speaking,
      textColor: "white",
    },
    {
      label: "Writing",
      value: "writing",
      icon: "pencil-simple",
      color: scoreColors.Writing,
      textColor: "white",
    },
    {
      label: "Not sure",
      value: "not-sure",
      icon: "question",
      color: "rgb(30, 58, 138)",
      textColor: "white",
    },
  ] as const;

  return (
    <StepFieldset
      active={active}
      disabled={disabled}
      legend="Which areas do you want to improve?"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {improvementOptions.map((area) => {
          const isSelected = selectedFocusAreas.includes(area.value);

          return (
            <label key={area.value} className="block">
              <input
                type="checkbox"
                name="focusAreas"
                value={area.value}
                checked={isSelected}
                onChange={(event) => {
                  if (area.value === "not-sure") {
                    onFocusAreasChange(event.target.checked ? ["not-sure"] : []);
                    return;
                  }

                  onFocusAreasChange(
                    event.target.checked
                      ? [...selectedFocusAreas.filter((value) => value !== "not-sure"), area.value]
                      : selectedFocusAreas.filter((value) => value !== area.value),
                  );
                }}
                className="peer sr-only"
              />
              <span
                className={cx(
                  "grid min-h-24 cursor-pointer place-items-center gap-2 border px-2 py-3 text-center text-sm font-semibold transition-colors hover:bg-[var(--pte-card-color)] hover:text-[var(--pte-card-text)] peer-focus-visible:ring-2 peer-focus-visible:ring-blue-900 peer-focus-visible:ring-offset-2",
                  isSelected
                    ? "border-[var(--pte-card-color)] bg-[var(--pte-card-color)] text-[var(--pte-card-text)]"
                    : "border-[color:var(--pte-card-color)] bg-white text-gray-800",
                )}
                style={{
                  "--pte-card-color": area.color,
                  "--pte-card-text": area.textColor,
                } as React.CSSProperties}
              >
                <PhosphorIcon name={area.icon} size={22} />
                <span>{area.label}</span>
              </span>
            </label>
          );
        })}
      </div>
    </StepFieldset>
  );
}

function TargetScoreStep({
  active,
  disabled,
  selectedScoreGoal,
  onScoreGoalChange,
}: {
  active: boolean;
  disabled: boolean;
  selectedScoreGoal: string;
  onScoreGoalChange: (scoreGoal: string) => void;
}) {
  const isNotSure = selectedScoreGoal === notSureScoreGoal;
  const showScoreError =
    Boolean(selectedScoreGoal) && !isNotSure && !isValidTargetScore(selectedScoreGoal);
  const scoreValue = isNotSure ? initialTargetScore : Number(selectedScoreGoal) || initialTargetScore;

  return (
    <StepFieldset
      active={active}
      disabled={disabled}
      legend="What score are you aiming for?"
    >
      <input type="hidden" name="scoreGoal" value={selectedScoreGoal} />

      <div className="grid justify-items-start gap-3">
        <TargetScoreDial
          disabled={disabled || isNotSure}
          score={scoreValue}
          onScoreChange={(score) => onScoreGoalChange(String(score))}
        />

        <p id="scoreGoalHint" className="sr-only">
          Drag the score circle from 10 to 90, or select Not sure yet.
        </p>
        {showScoreError && (
          <p id="scoreGoalError" className="text-sm text-red-700">
            Enter a whole number from 10 to 90.
          </p>
        )}

        <label className="block w-fit">
          <input
            type="checkbox"
            checked={isNotSure}
            onChange={(event) => {
              onScoreGoalChange(event.target.checked ? notSureScoreGoal : String(initialTargetScore));
            }}
            className="peer sr-only"
          />
          <span className={pteChipClassName}>Not sure yet</span>
        </label>
      </div>
    </StepFieldset>
  );
}

function clampScore(score: number) {
  return Math.min(maxTargetScore, Math.max(minTargetScore, score));
}

function getScorePercent(score: number) {
  return (clampScore(score) - minTargetScore) / (maxTargetScore - minTargetScore);
}

function getScoreDialColor(percent: number) {
  const red = [220, 38, 38];
  const green = [21, 128, 61];
  const [r1, g1, b1] = red;
  const [r2, g2, b2] = green;
  const channel = (start: number, end: number) => Math.round(start + (end - start) * percent);

  return `rgb(${channel(r1, r2)}, ${channel(g1, g2)}, ${channel(b1, b2)})`;
}

function TargetScoreDial({
  disabled,
  score,
  onScoreChange,
}: {
  disabled: boolean;
  score: number;
  onScoreChange: (score: number) => void;
}) {
  const dialRef = useRef<HTMLButtonElement | null>(null);
  const percent = getScorePercent(score);
  const arcStartAngle = 130;
  const arcEndAngle = 410;
  const arcSweep = arcEndAngle - arcStartAngle;
  const angle = arcStartAngle + percent * arcSweep;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (arcSweep / 360);
  const knobX = 60 + Math.cos((angle * Math.PI) / 180) * radius;
  const knobY = 60 + Math.sin((angle * Math.PI) / 180) * radius;
  const scoreColor = getScoreDialColor(percent);

  function updateFromPointer(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = dialRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let degrees = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;

    if (degrees < 0) {
      degrees += 360;
    }

    if (degrees < arcStartAngle) {
      degrees += 360;
    }

    const clampedDegrees = Math.min(arcEndAngle, Math.max(arcStartAngle, degrees));
    const nextPercent = (clampedDegrees - arcStartAngle) / arcSweep;

    onScoreChange(clampScore(Math.round(minTargetScore + nextPercent * (maxTargetScore - minTargetScore))));
  }

  return (
    <button
      ref={dialRef}
      type="button"
      disabled={disabled}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
          return;
        }

        updateFromPointer(event);
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      className="relative grid h-36 w-36 place-items-center text-blue-900 outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={`Target score ${score} out of 90`}
    >
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgb(229 231 235)"
          strokeLinecap="round"
          strokeWidth="10"
          strokeDasharray={`${arcLength} ${circumference}`}
          transform={`rotate(${arcStartAngle} 60 60)`}
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeLinecap="round"
          strokeWidth="10"
          strokeDasharray={`${arcLength * percent} ${circumference}`}
          transform={`rotate(${arcStartAngle} 60 60)`}
        />
        <circle
          cx={knobX}
          cy={knobY}
          r="6"
          fill="white"
          stroke={scoreColor}
          strokeWidth="4"
        />
      </svg>
      <span className="grid text-center">
        <span className="text-3xl font-semibold leading-none" style={{ color: scoreColor }}>{score}</span>
        <span className="text-xs font-semibold text-gray-500">/90</span>
      </span>
    </button>
  );
}

function AvailabilityStep({
  active,
  disabled,
  selectedAvailability,
  onAvailabilityChange,
}: {
  active: boolean;
  disabled: boolean;
  selectedAvailability: string[];
  onAvailabilityChange: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <StepFieldset
      active={active}
      disabled={disabled}
      legend="When are you usually available?"
    >
      <p className="text-sm text-gray-600">
        Select every 30 minute block that usually works for you.
      </p>

      <div className="overflow-x-auto pb-1">
        <AvailabilityMatrix
          selectedAvailability={selectedAvailability}
          onAvailabilityChange={onAvailabilityChange}
        />
      </div>
    </StepFieldset>
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
    <StepFieldset active={active} disabled={disabled} legend="How can I get in touch?">
      <p className="text-sm text-gray-600">
        I&apos;ll use these details to follow up about tutoring.
      </p>

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
      <PhoneField />
    </StepFieldset>
  );
}

function PhoneField() {
  return (
    <div>
      <label htmlFor="phone" className="text-sm font-semibold text-gray-800">
        Mobile number
      </label>
      <div className="mt-1 flex overflow-hidden border border-gray-300 bg-white transition-colors focus-within:border-blue-900 focus-within:ring-2 focus-within:ring-blue-900/15">
        <span className="inline-flex shrink-0 items-center gap-1 border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700">
          <span aria-hidden="true" className="text-xs leading-none">
            🇦🇺
          </span>
          +61
        </span>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          pattern="4[0-9]{8}"
          maxLength={9}
          placeholder="449009169"
          aria-describedby="phoneHint"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
        />
      </div>
      <p id="phoneHint" className="mt-1 text-xs text-gray-500">
        Enter a 9 digit Australian mobile number starting with 4.
      </p>
    </div>
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
        className={pteSecondaryButtonClassName}
      >
        Back
      </button>

      {isLastStep ? (
        <button
          type="submit"
          disabled={formDisabled}
          className={pteAccentButtonClassName}
        >
          {isPending ? "Sending..." : "Submit enquiry"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={formDisabled || !canGoNext}
          className={ptePrimaryButtonClassName}
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
