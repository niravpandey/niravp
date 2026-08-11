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

export const availabilityPeriods = [
  { label: "Morning", value: "morning", icon: "sun-horizon" },
  { label: "Afternoon", value: "afternoon", icon: "sun" },
  { label: "Evening", value: "evening", icon: "sun-dim" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: string;
  icon: PhosphorIconName;
}>;

export const classTypes = [
  { label: "One-on-one", value: "one-on-one" },
  { label: "Group", value: "group" },
] as const;

export const focusAreas = ["Speaking", "Writing", "Reading", "Listening", "Not sure"] as const;
export const scoreGoals = ["50+", "65+", "79+", "90"] as const;
export const enquirySteps = [
  "Class type",
  "Weak areas",
  "Target score",
  "Availability",
  "Contact details",
] as const;

export type ClassType = (typeof classTypes)[number]["value"];
export type EnquiryState = Awaited<ReturnType<typeof submitPteEnquiry>>;
