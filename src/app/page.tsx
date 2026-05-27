import { Navbar } from "@/components/nav/Navbar";
import { About } from "@/components/sections/About";
import { Work } from "@/components/sections/Work";
import { Capabilities } from "@/components/sections/Capabilities";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { ParticleNameHero } from "@/components/three/ParticleNameHero";

export default function HomePage() {
  return (
    <main className="relative">
      <Navbar />
      {/* Single-screen hero — particles assemble into "HOUMAN" with mouse
          physics (push them around, watch them spring back). Replaces the
          earlier cinematic <RequestJourney /> scroll hero, which felt too
          busy. To revert: swap this import + tag back to RequestJourney —
          the file is preserved at src/components/three/RequestJourney.tsx. */}
      <ParticleNameHero />
      <About />
      <Work />
      <Capabilities />
      <Contact />
      <Footer />
    </main>
  );
}
