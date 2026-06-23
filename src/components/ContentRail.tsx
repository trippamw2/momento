import Link from "next/link";
import { Experience } from "@/lib/types";
import ExperienceCard from "./ExperienceCard";

interface ContentRailProps {
  title: string;
  experiences: Experience[];
  viewAllHref?: string;
  subtitle?: string;
}

export default function ContentRail({ title, experiences, viewAllHref, subtitle }: ContentRailProps) {
  if (experiences.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4 px-4 sm:px-8">
        <div>
          <h2 className="text-heading-lg sm:text-heading-xl font-bold text-[#222222]">{title}</h2>
          {subtitle && <p className="text-sm text-[#6a6a6a] mt-0.5">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-body-sm text-[#6a6a6a] hover:text-[#ff385c] transition-colors duration-200 flex items-center gap-1 flex-shrink-0"
          >
            See all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        )}
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-8 pb-4 hide-scrollbar snap-x snap-mandatory">
        {experiences.map((exp) => (
          <ExperienceCard key={exp.id} experience={exp} size="md" />
        ))}
      </div>
    </section>
  );
}
