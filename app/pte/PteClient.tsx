"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { submitPteEnquiry } from "./actions";

const scores = [
  { label: "Listening", value: 90, color: "rgb(29, 48, 84)" },
  { label: "Reading", value: 90, color: "rgb(211, 210, 73)" },
  { label: "Speaking", value: 90, color: "rgb(118, 118, 118)" },
  { label: "Writing", value: 90, color: "rgb(151, 46, 138)" },
];

const HEADSHOT_URL =
  "https://apqsehnfehgcygadnrgq.supabase.co/storage/v1/object/public/Assets/PTE.png";

const benefits = [
  {
    title: "Personalised Feedback",
    text: "Focus on the areas that are actually holding your score back.",
    icon: "crosshair",
  },
  {
    title: "90/90 Strategies",
    text: "Learn practical approaches from someone who scored 90 in every section.",
    icon: "trophy",
  },
  {
    title: "Guided Practice",
    text: "Practise PTE tasks, get corrections, and understand how to improve.",
    icon: "note-pencil",
  },
  {
    title: "Flexible Support",
    text: "Learn online, one-on-one or in a small group, with Nepali support available.",
    icon: "app-window",
  },
] as const;

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

function PriceRing({
  title,
  price,
  description,
}: {
  title: string;
  price: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        tabIndex={0}
        aria-label={`${title}: ${description}`}
        className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[10px] border-blue-900 bg-white text-center text-2xl font-semibold leading-none text-blue-900 transition-transform duration-300 hover:rotate-6 focus:outline-none focus-visible:rotate-6 focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:rotate-0 motion-reduce:focus-visible:rotate-0"
      >
        {price}
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export default function PteClient() {
  const scoreSectionRef = useRef<HTMLElement | null>(null);
  const [scoresActive, setScoresActive] = useState(false);
  const [state, formAction, isPending] = useActionState(submitPteEnquiry, null);

  useEffect(() => {
    const section = scoreSectionRef.current;

    if (!section) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.requestAnimationFrame(() => setScoresActive(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setScoresActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-16 pb-10 sm:px-8 sm:pt-24 lg:px-16">
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
            <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
              <PriceRing
                title="One-on-one"
                price="A$35"
                description="Personal tutoring"
              />
              <PriceRing
                title="Group"
                price="A$25"
                description="2-5 students only"
              />
            </div>

            <section aria-labelledby="pte-benefits" className="mt-8">
              <h2 id="pte-benefits" className="text-3xl font-semibold text-blue-900">
                Why learn with me?
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="rounded-sm border border-gray-200 bg-white p-4"
                  >
                    <PhosphorIcon
                      name={benefit.icon}
                      size={32}
                      className="text-mauve-500"
                    />
                    <h3 className="mt-4 text-base font-semibold text-gray-900">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">{benefit.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <p className="mt-4 text-sm text-gray-500">
              Working with Children Check · ABN: 68 747 605 307
            </p>

            <a
              href="#pte-enquiry"
              className="mt-6 inline-flex w-fit items-center border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2"
            >
              Enquire about tutoring
            </a>
          </div>

          <div className="relative aspect-[706/944] w-44 border border-gray-300 bg-gray-50 p-1 sm:w-52 md:justify-self-end">
            <Image
              src={HEADSHOT_URL}
              fill
              alt="Nirav Pandey"
              sizes="(max-width: 640px) 11rem, 13rem"
              className="object-cover"
            />
          </div>
        </section>

        <section
          ref={scoreSectionRef}
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
                active={scoresActive}
                delay={index * 140}
              />
            ))}
          </div>
        </section>

        <section id="pte-enquiry" aria-labelledby="pte-contact" className="max-w-2xl py-8">
          <h2 id="pte-contact" className="text-3xl font-semibold text-blue-900">
            Contact
          </h2>
          <form action={formAction} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="text-sm font-semibold text-gray-800">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  autoComplete="given-name"
                  disabled={isPending || state?.success}
                  className="mt-1 w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="text-sm font-semibold text-gray-800">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  autoComplete="family-name"
                  disabled={isPending || state?.success}
                  className="mt-1 w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-semibold text-gray-800">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                disabled={isPending || state?.success}
                className="mt-1 w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15 disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="phone" className="text-sm font-semibold text-gray-800">
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                disabled={isPending || state?.success}
                className="mt-1 w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15 disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="classType" className="text-sm font-semibold text-gray-800">
                Class type
              </label>
              <select
                id="classType"
                name="classType"
                required
                defaultValue=""
                disabled={isPending || state?.success}
                className="mt-1 w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-colors focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15 disabled:opacity-60"
              >
                <option value="" disabled>
                  Select a class type
                </option>
                <option value="one-on-one">One-on-one tutoring - from A$35 a class</option>
                <option value="group">Group tutoring - up to 5 students, from A$25/hour</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending || state?.success}
              className="w-fit border border-mauve-500 bg-mauve-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-mauve-600 focus:outline-none focus:ring-2 focus:ring-mauve-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {isPending ? "Sending..." : "Submit"}
            </button>

            {state && (
              <p
                role="status"
                className={state.success ? "text-sm font-semibold text-blue-900" : "text-sm text-red-700"}
              >
                {state.message}
              </p>
            )}
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
