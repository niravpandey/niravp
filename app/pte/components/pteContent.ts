import type { ComponentProps } from "react";
import type PhosphorIcon from "@/components/ui/PhosphorIcon";
import type { submitPteEnquiry } from "../actions";

type PhosphorIconName = ComponentProps<typeof PhosphorIcon>["name"];

export const scores = [
  { label: "Listening", value: 90, color: "rgb(29, 48, 84)" },
  { label: "Reading", value: 90, color: "rgb(211, 210, 73)" },
  { label: "Speaking", value: 90, color: "rgb(118, 118, 118)" },
  { label: "Writing", value: 90, color: "rgb(151, 46, 138)" },
];

export const HEADSHOT_URL =
  "https://apqsehnfehgcygadnrgq.supabase.co/storage/v1/object/public/Assets/PTE.png";

export const benefits = [
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
] as const satisfies ReadonlyArray<{
  title: string;
  text: string;
  icon: PhosphorIconName;
}>;

export const availabilityDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function formatTimeSlot(totalMinutes: number) {
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hour12 = hour24 % 12 || 12;
  const suffix = hour24 < 12 ? "AM" : "PM";

  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export const availabilityTimeSlots = Array.from({ length: 26 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    label: formatTimeSlot(totalMinutes),
    value: `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
  };
}) as ReadonlyArray<{
  label: string;
  value: string;
}>;

export const classTypes = [
  {
    label: "One-on-one",
    value: "one-on-one",
    price: 35,
    description: "Personal tutoring",
  },
  {
    label: "Group",
    value: "group",
    price: 25,
    description: "2-5 students only",
  },
] as const;

export const introSession = {
  title: "Free 20–30 min introductory session",
  shortTitle: "Free introductory session",
  description:
    "Meet me, discuss your target score, and see if tutoring is the right fit.",
  ctaDescription:
    "Start with a free 20–30 min introductory session. We'll talk about your target score, where you need help, and whether tutoring is the right fit.",
} as const;

export const focusAreas = ["Speaking", "Writing", "Reading", "Listening", "Not sure"] as const;
export const enquirySteps = [
  "Improvement areas",
  "Target score",
  "Class type",
  "Availability",
  "Contact details",
] as const;

export type ClassType = (typeof classTypes)[number]["value"];
export type EnquiryState = Awaited<ReturnType<typeof submitPteEnquiry>>;
export type PteTestimonialCard = {
  id: string;
  studentName: string;
  text: string;
  rating: number;
  imageUrl: string | null;
};

export function formatClassPrice(price: number) {
  return `A$${price}`;
}

export function getClassTypeByValue(value: string) {
  return classTypes.find((classType) => classType.value === value);
}

function calculateGroupSavingsPercent() {
  const oneOnOnePrice = getClassTypeByValue("one-on-one")?.price;
  const groupPrice = getClassTypeByValue("group")?.price;

  if (!oneOnOnePrice || !groupPrice || groupPrice >= oneOnOnePrice) {
    return 0;
  }

  return Math.round(((oneOnOnePrice - groupPrice) / oneOnOnePrice) * 100);
}

export const groupSavingsPercent = calculateGroupSavingsPercent();
export const groupSavingsLabel = `SAVE ${groupSavingsPercent}%`;
export const groupSavingsContextLabel = `${groupSavingsLabel} compared with one-on-one`;
