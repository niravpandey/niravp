import Image from "next/image";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Experience } from "@/lib/experience";

export default function ExperienceSection({ experiences }: { experiences: Experience[] }) {
  if (experiences.length === 0) return null;

  return (
    <section className="w-full border-b border-gray-200 py-8">
      <SectionHeading icon="book-open">Experience</SectionHeading>

      <div className="mt-5 grid gap-4">
        {experiences.map((experience) => {
          const meta = [experience.organization, experience.subtitle].filter(Boolean).join(" · ");

          return (
            <article key={experience.id} className="flex items-start gap-3">
              {/* Same-size white tile for every logo, so square and transparent logos look consistent. */}
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white p-1">
                {experience.logo_url ? (
                  <Image src={experience.logo_url} alt="" width={24} height={24} className="h-full w-full object-contain" />
                ) : (
                  <PhosphorIcon name="folder" size={16} className="text-mauve-500" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                {/* Role, organisation and dates share one line; the description is the second. */}
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="text-sm text-gray-900">
                    <span className="font-medium">{experience.title}</span>
                    {meta && <span className="text-mauve-500"> · {meta}</span>}
                  </h3>
                  {experience.date_range && (
                    <p className="shrink-0 text-xs uppercase tracking-wide text-gray-400">{experience.date_range}</p>
                  )}
                </div>
                {experience.description && (
                  <p className="mt-0.5 text-sm leading-6 text-gray-600">{experience.description}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
