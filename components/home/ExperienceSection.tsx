import Image from "next/image";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import type { Experience } from "@/lib/experience";

export default function ExperienceSection({ experiences }: { experiences: Experience[] }) {
  if (experiences.length === 0) return null;

  return (
    <section className="w-full border-b border-gray-200 py-8">
      <h1 className="flex items-center gap-2 text-3xl font-semibold text-blue-900">
        <PhosphorIcon name="book-open" size={28} className="text-mauve-500" />
        Experience
      </h1>
      <div className="mt-5 grid gap-5">
        {experiences.map((experience) => (
          <article key={experience.id} className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center">
              {experience.logo_url ? (
                <Image src={experience.logo_url} alt="" width={48} height={48} className="h-full w-full object-contain" />
              ) : (
                <PhosphorIcon name="folder" size={22} className="text-mauve-500" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-medium text-gray-900">{experience.title}</h2>
              {(experience.organization || experience.subtitle) && (
                <p className="mt-0.5 text-sm text-mauve-500">
                  {[experience.organization, experience.subtitle].filter(Boolean).join(" · ")}
                </p>
              )}
              {experience.date_range && <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-400">{experience.date_range}</p>}
              {experience.description && <p className="mt-2 text-sm leading-6 text-gray-600">{experience.description}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
