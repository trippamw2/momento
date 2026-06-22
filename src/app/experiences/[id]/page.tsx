import { getExperienceById, getExperiencesByMood, experiences } from "@/lib/data";
import { notFound } from "next/navigation";
import ExperienceDetailClient from "@/components/ExperienceDetailClient";

export default async function ExperienceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exp = getExperienceById(id);

  if (!exp) notFound();

  const sameMood = exp.mood.length > 0
    ? getExperiencesByMood(exp.mood[0]).filter((e) => e.id !== exp.id).slice(0, 10)
    : experiences.filter((e) => e.id !== exp.id).slice(0, 10);

  return <ExperienceDetailClient experience={exp} similarExperiences={sameMood} />;
}
