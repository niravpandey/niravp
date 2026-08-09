import type { Metadata } from "next";
import PteClient from "./PteClient";

export const metadata: Metadata = {
  title: "PTE 90/90 | Nirav Pandey",
  description: "1-on-1 online PTE tutoring with Nirav Pandey.",
};

export default function PtePage() {
  return <PteClient />;
}
