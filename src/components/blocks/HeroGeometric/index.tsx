import { HeroGeometic as HeroType } from "@/types/blocks/heroGeometic";
import { HeroGeometric } from "@/components/ui/shadcn-io/shape-landing-hero";

export default function HeroGeometic({ hero }: { hero: HeroType }) {

  if (hero.disabled) {
    return null;
  }
  return (
    <>
      <section className="py-24">
          <div className="min-h-screen">
            <HeroGeometric
              badge={hero.badge}
              title1={hero.title1}
              title2={hero.title2}
              description={hero.description}
              />
          </div>
      </section>
    </>
  );
}
