/**
 * Where my students come from, shown on the home page map, one entry per class I've taught.
 * `code` is the ISO 3166-1 alpha-2 country code (e.g. "IN", "US", "HK").
 * `students` defaults to 1; more students shade the country darker.
 * The map section stays hidden while every cohort is empty.
 */
export type StudentCountry = {
  code: string;
  students?: number;
};

export type Cohort = {
  id: string;
  /** Shown on the cohort switcher. */
  label: string;
  /** Shown under the heading. */
  title: string;
  countries: StudentCountry[];
};

/** Newest first; the map opens on the combined view. */
export const cohorts: Cohort[] = [
  {
    id: "pai-2026",
    label: "PAI 2026",
    title: "Probability for AI 2026",
    countries: [
      { code: "US", students: 4 },
      { code: "CA", students: 3 },
      { code: "NG", students: 2 },
      { code: "BR" },
      { code: "AU" },
      { code: "PE" },
      { code: "GB" },
      { code: "GR" },
      { code: "EG" },
    ],
  },
  {
    id: "cip-2026",
    label: "CiP 2026",
    title: "Code in Place 2026",
    countries: [
      { code: "ES", students: 3 },
      { code: "TR", students: 2 },
      { code: "EG", students: 2 },
      { code: "IN", students: 2 },
      { code: "BD" },
      { code: "NL" },
      { code: "AE" },
      { code: "BE" },
    ],
  },
  {
    id: "cip-2025",
    label: "CiP 2025",
    title: "Code in Place 2025",
    countries: [
      { code: "IN", students: 4 },
      { code: "PL", students: 2 },
      { code: "AU" },
      { code: "GB" },
      { code: "ZA" },
      { code: "BD" },
      { code: "VN" },
      { code: "DE" },
      { code: "HK" },
      { code: "TR" },
    ],
  },
];
