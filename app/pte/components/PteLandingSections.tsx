import type { RefObject } from "react";
import Image from "next/image";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import {
  benefits,
  classTypes,
  formatClassPrice,
  groupSavingsContextLabel,
  groupSavingsLabel,
  HEADSHOT_URL,
  introSession,
  scores,
  type ClassType,
  type PteTestimonialCard,
} from "./pteContent";
import { cx, pteFocusRing } from "./pteUi";

function NiravMark() {
  return (
    <span className="inline-block [font-family:var(--font-caveat)] text-[1.15em] font-medium text-mauve-500">
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
          I am <NiravMark />, studying Data Science at Melbourne University. Recently, I scored full marks across all sections of the <PteMark />.
          I take great passion in teaching
          I firmly believe you can achieve your desired score under my guidance.
        </p>

        <IntroSessionCallout />

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

function IntroSessionCallout() {
  return (
    <div className="mt-6 max-w-3xl border border-gray-200 bg-white p-4">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-mauve-500/30 bg-mauve-500/10 text-mauve-500">
          <PhosphorIcon name="clock" size={16} />
        </span>
        <div>
          <p className="text-base font-semibold text-blue-900">
            {introSession.title}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {introSession.description}
          </p>
        </div>
      </div>
    </div>
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
      {classTypes.map((classType) => (
        <PriceRing
          key={classType.value}
          title={classType.label}
          price={formatClassPrice(classType.price)}
          description={classType.description}
          savingsLabel={classType.value === "group" ? groupSavingsLabel : undefined}
          savingsContextLabel={classType.value === "group" ? groupSavingsContextLabel : undefined}
          selected={selectedClassType === classType.value}
          onSelect={() => onSelect(classType.value)}
        />
      ))}
    </div>
  );
}

function PriceRing({
  title,
  price,
  description,
  savingsLabel,
  savingsContextLabel,
  selected,
  onSelect,
}: {
  title: string;
  price: string;
  description: string;
  savingsLabel?: string;
  savingsContextLabel?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cx(
        "group flex w-full items-center gap-4 border p-3 text-left transition-colors",
        "hover:border-blue-900 hover:bg-blue-50",
        selected
          ? "border-blue-900 bg-blue-50 ring-2 ring-blue-900/15"
          : "border-gray-200 bg-white",
        pteFocusRing,
      )}
    >
      <div
        aria-hidden="true"
        className={cx(
          "flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[10px] border-blue-900 text-center text-2xl font-semibold leading-none transition-colors",
          selected
            ? "bg-blue-900 text-white"
            : "bg-white text-blue-900 group-hover:bg-blue-900 group-hover:text-white",
        )}
      >
        {price}
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {savingsLabel && (
            <p className="w-fit border border-mauve-500/40 bg-mauve-500/10 px-2 py-0.5 text-xs font-semibold text-mauve-600">
              {savingsLabel}
              {savingsContextLabel && (
                <span className="sr-only">
                  {savingsContextLabel.slice(savingsLabel.length)}
                </span>
              )}
            </p>
          )}
        </div>
        <p className="sr-only">{price}</p>
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
      <p className="mt-2 max-w-5xl text-gray-600">
        This is not an official report, and my results can be requested on demand.
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

export function TestimonialsSection({
  testimonials,
}: {
  testimonials: PteTestimonialCard[];
}) {
  if (testimonials.length === 0) {
    return null;
  }

  const galleryItems = testimonials.length > 1 ? [...testimonials, ...testimonials] : testimonials;

  return (
    <section aria-labelledby="pte-testimonials" className="border-b border-gray-200 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-mauve-500">
            Student feedback
          </p>
          <h2 id="pte-testimonials" className="mt-1 text-3xl font-semibold text-blue-900">
            Testimonials
          </h2>
        </div>
        <span className="text-sm font-semibold text-gray-500">{testimonials.length} featured</span>
      </div>

      <div className="mt-6 overflow-hidden border border-gray-200 bg-white">
        <div className="flex w-max animate-[testimonial-gallery_28s_linear_infinite] gap-3 p-3 hover:[animation-play-state:paused] motion-reduce:animate-none">
          {galleryItems.map((testimonial, index) => (
            <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: PteTestimonialCard;
}) {
  return (
    <article className="grid w-72 shrink-0 gap-3 border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-gray-300 bg-white">
          {testimonial.imageUrl ? (
            <Image
              src={testimonial.imageUrl}
              alt={testimonial.studentName}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-blue-900">
              {testimonial.studentName
                .split(" ")
                .map((part) => part.charAt(0))
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-gray-900">{testimonial.studentName}</h3>
          <p className="mt-0.5 text-xs font-semibold text-mauve-500">
            {"★".repeat(testimonial.rating)}
            <span className="sr-only">{testimonial.rating} out of 5 stars</span>
          </p>
        </div>
      </div>
      <p className="line-clamp-5 text-sm leading-6 text-gray-600">{testimonial.text}</p>
    </article>
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
      </div>
    </div>
  );
}

export function BottomCta({ onEnquire }: { onEnquire: () => void }) {
  return (
    <section className="py-8">
      <button
        type="button"
        onClick={onEnquire}
        className={cx(
          "group grid w-full gap-5 border border-gray-200 bg-white p-4 text-left transition-transform hover:-translate-y-0.5 hover:scale-[1.01] sm:grid-cols-[1fr_auto] sm:items-center sm:p-5",
          pteFocusRing,
        )}
      >
        <span className="min-w-0">
          <span className="block text-3xl font-semibold text-blue-900">
            Ready to work towards your PTE score?
          </span>
          <span className="mt-2 block max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            {introSession.ctaDescription}
          </span>
        </span>
        <span className="inline-flex w-fit items-center justify-center border border-mauve-500 bg-mauve-500 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-mauve-600">
          Enquire about classes
        </span>
      </button>
    </section>
  );
}
