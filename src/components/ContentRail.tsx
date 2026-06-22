import Link from "next/link";
import { Experience } from "@/lib/types";
import ExperienceCard from "./ExperienceCard";

interface ContentRailProps {
  title: string;
  experiences: Experience[];
}

export default function ContentRail({ title, experiences }: ContentRailProps) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-8">
        <h2 className="text-heading-lg sm:text-heading-xl font-bold text-text-primary">{title}</h2>
        <Link
          href="/experiences"
          className="text-body-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          See all
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 sm:px-8 pb-2 hide-scrollbar snap-x snap-mandatory">
        {experiences.map((exp) => (
          <ExperienceCard key={exp.id} experience={exp} />
        ))}
      </div>
    </section>
  );
}
