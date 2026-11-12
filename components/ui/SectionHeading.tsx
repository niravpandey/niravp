import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  className?: string;
  children: ReactNode;
};

/** The blue serif section title used across the home page. */
export default function SectionHeading({ className, children }: SectionHeadingProps) {
  return <h2 className={cn("font-serif text-3xl font-heading tracking-heading text-heading", className)}>{children}</h2>;
}
