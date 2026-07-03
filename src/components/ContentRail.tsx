import Link from "next/link";
import { Experience } from "@/lib/types";
import ExperienceCard from "./ExperienceCard";

interface ContentRailProps {
  title: string;
  experiences: Experience[];
  viewAllHref?: string;
  subtitle?: string;
  isPersonalized?: boolean;
}

export default function ContentRail({ title, experiences, viewAllHref, subtitle, isPersonalized }: ContentRailProps) {
  if (experiences.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4 px-4 sm:px-8">
        <div>
          <h2 className="text-heading-lg sm:text-heading-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-[#CBD5E1] mt-0.5">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-body-sm text-[#CBD5E1] hover:text-[#FF0F73] transition-colors duration-200 flex items-center gap-1 flex-shrink-0"
          >
            See all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        )}
      </div>
      {isPersonalized && (
        <div className="px-4 sm:px-8 mb-3">
          <span className="text-caption text-[#FF0F73] font-semibold flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            Personalized for you
          </span>
        </div>
      )}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-8 pb-4 hide-scrollbar snap-x snap-mandatory">
        {experiences.map((exp) => (
          <ExperienceCard key={exp.id} experience={exp} size="md" />
        ))}
      </div>
    </section>
  );
}
