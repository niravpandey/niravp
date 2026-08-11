import type { RefObject } from "react";
import Image from "next/image";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import {
  benefits,
  HEADSHOT_URL,
  scores,
  type ClassType,
} from "./pteContent";

function NiravMark() {
  return (
    <span className="inline-block [font-family:var(--font-caveat)] text-[1.15em] font-medium text-mauve-500 transition-transform duration-200 hover:-rotate-2 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:rotate-0 motion-reduce:hover:scale-100">
      Nirav
    </span>
  );
}

function PteMark({ children = "PTE" }: { children?: string }) {
  return (
    <span className="font-semibold text-blue-900 underline decoration-mauve-500 decoration-2 underline-offset-4">
      {children}
    </span>
  );
}

export function HeroSection({
  selectedClassType,
  onEnquire,
}: {
  selectedClassType: string;
  onEnquire: (classType?: ClassType) => void;
}) {
  return (
    <section className="grid gap-8 border-b border-gray-200 pb-8 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-mauve-500">
          Online PTE tutoring
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-blue-900 sm:text-5xl">
          <PteMark /> with <NiravMark />
        </h1>
        <p className="mt-4 max-w-3xl text-xl text-gray-700">
          I am <NiravMark />, originally from Nepal and now studying at Melbourne University. I scored 90 across all sections of the <PteMark />, and I offer bilingual support for Nepali students.
        </p>
        <p className="mt-3 max-w-3xl text-gray-600">
          With the correct guidance, anything is possible and I would love to help you get your desired score.
        </p>

        <PricingOptions
          selectedClassType={selectedClassType}
          onSelect={onEnquire}
        />
        <BenefitsSection />

        <p className="mt-4 text-sm text-gray-500">
          Working with Children Check · ABN: 68 747 605 307
        </p>
      </div>

      <Headshot />
    </section>
  );
}

function PricingOptions({
  selectedClassType,
  onSelect,
}: {
  selectedClassType: string;
  onSelect: (classType: ClassType) => void;
}) {
  return (
    <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
      <PriceRing
        title="One-on-one"
        price="A$35"
        description="Personal tutoring"
        selected={selectedClassType === "one-on-one"}
        onSelect={() => onSelect("one-on-one")}
      />
      <PriceRing
        title="Group"
        price="A$25"
        description="2-5 students only"
        selected={selectedClassType === "group"}
        onSelect={() => onSelect("group")}
      />
    </div>
  );
}

function PriceRing({
  title,
  price,
  description,
  selected,
  onSelect,
}: {
  title: string;
  price: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`group flex w-full items-center gap-4 border bg-white p-3 text-left transition-colors hover:border-blue-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 ${
        selected ? "border-blue-900 ring-2 ring-blue-900/15" : "border-transparent"
      }`}
    >
      <div
        aria-hidden="true"
        className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[10px] border-blue-900 bg-white text-center text-2xl font-semibold leading-none text-blue-900 transition-transform duration-300 group-hover:rotate-6 motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
      >
        {price}
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
    </button>
  );
}

function Headshot() {
  return (
    <div className="relative aspect-[706/944] w-44 border border-gray-300 bg-gray-50 p-1 sm:w-52 md:justify-self-end">
      <Image
        src={HEADSHOT_URL}
        fill
        alt="Nirav Pandey"
        sizes="(max-width: 640px) 11rem, 13rem"
        className="object-cover"
      />
    </div>
  );
}

function BenefitsSection() {
  return (
    <section aria-labelledby="pte-benefits" className="mt-8">
      <h2 id="pte-benefits" className="text-3xl font-semibold text-blue-900">
        Why learn with me?
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {benefits.map((benefit) => (
          <BenefitCard key={benefit.title} {...benefit} />
        ))}
      </div>
    </section>
  );
}

function BenefitCard({
  title,
  text,
  icon,
}: (typeof benefits)[number]) {
  return (
    <div className="rounded-sm border border-gray-200 bg-white p-4">
      <PhosphorIcon
        name={icon}
        size={32}
        className="text-mauve-500"
      />
      <h3 className="mt-4 text-base font-semibold text-gray-900">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-600">{text}</p>
    </div>
  );
}

export function ScoreReportSection({
  sectionRef,
  active,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  active: boolean;
}) {
  return (
    <section
      ref={sectionRef}
      aria-labelledby="pte-scores"
      className="border-b border-gray-200 py-8"
    >
      <h2 id="pte-scores" className="text-3xl font-semibold text-blue-900">
        Score Report
      </h2>
      <p className="mt-2 max-w-2xl text-gray-600">
        PTE registration ID: 541211700. This is not an official report, and my results can be requested on demand.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {scores.map((score, index) => (
          <ScoreRing
            key={score.label}
            {...score}
            active={active}
            delay={index * 140}
          />
        ))}
      </div>
    </section>
  );
}

function ScoreRing({
  label,
  value,
  color,
  active,
  delay,
}: {
  label: string;
  value: number;
  color: string;
  active: boolean;
  delay: number;
}) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = active ? value / 90 : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex items-center gap-4 border border-gray-200 bg-white p-4 sm:flex-col sm:gap-3 sm:text-center">
      <div className="relative h-28 w-28 shrink-0" aria-hidden="true">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 112 112">
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="rgb(229, 231, 235)"
            strokeWidth="10"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="motion-reduce:transition-none"
            style={{
              transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)",
              transitionDelay: `${delay}ms`,
            }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-semibold text-blue-900">
          {value}
        </span>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900">{label}</h3>
        <p className="text-sm text-gray-600">90/90</p>
      </div>
    </div>
  );
}

export function BottomCta({ onEnquire }: { onEnquire: () => void }) {
  return (
    <section className="py-8">
      <div className="border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="text-3xl font-semibold text-blue-900">
          Ready to work towards your PTE score?
        </h2>
        <p className="mt-2 max-w-2xl text-gray-600">
          Tell me what you’re aiming for and when you’re available. It takes about a minute.
        </p>
        <button
          type="button"
          onClick={onEnquire}
          className="mt-5 inline-flex w-fit items-center border border-mauve-500 bg-mauve-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-mauve-600 focus:outline-none focus:ring-2 focus:ring-mauve-500 focus:ring-offset-2"
        >
          Enquire about classes →
        </button>
      </div>
    </section>
  );
}
