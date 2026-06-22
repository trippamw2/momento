import Link from "next/link";
import { Experience } from "@/lib/types";
import ExperienceCard from "./ExperienceCard";

interface ContentRailProps {
  title: string;
  experiences: Experience[];
  viewAllHref?: string;
}

export default function ContentRail({ title, experiences, viewAllHref }: ContentRailProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-8">
        <h2 className="text-heading-lg sm:text-heading-xl font-bold text-white">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-body-sm text-[#A1A1AA] hover:text-white transition-colors duration-200 flex items-center gap-1"
          >
            See all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 sm:px-8 pb-4 hide-scrollbar snap-x snap-mandatory">
        {experiences.map((exp) => (
          <ExperienceCard key={exp.id} experience={exp} size="md" />
        ))}
      </div>
    </section>
  );
}