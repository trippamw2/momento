import HeroSection from "@/components/HeroSection";
import ContentRail from "@/components/ContentRail";
import { collections, collectionOrder } from "@/lib/data";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <div className="relative z-10 -mt-16 pb-12">
        {collectionOrder.map((key) => {
          const collection = collections[key];
          return (
            <ContentRail
              key={key}
              title={collection.title}
              experiences={collection.getExperiences()}
            />
          );
        })}
      </div>
    </div>
  );
}
