import type { ReactNode } from "react";
import PhosphorIcon, { type PhosphorIconName } from "@/components/ui/PhosphorIcon";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  icon: PhosphorIconName;
  iconSize?: number;
  className?: string;
  children: ReactNode;
};

/** The blue section title with a mauve icon used across the home page. */
export default function SectionHeading({ icon, iconSize = 28, className, children }: SectionHeadingProps) {
  return (
    <h2 className={cn("flex items-center gap-2 font-serif text-3xl font-medium text-blue-900", className)}>
      <PhosphorIcon name={icon} size={iconSize} className="text-mauve-500" />
      {children}
    </h2>
  );
}
