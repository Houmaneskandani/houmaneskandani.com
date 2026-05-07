import { Navbar } from "@/components/nav/Navbar";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Work } from "@/components/sections/Work";
import { Capabilities } from "@/components/sections/Capabilities";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { PersistentDrop } from "@/components/three/PersistentDrop";
import { RibbonOverlay } from "@/components/three/RibbonOverlay";

export default function HomePage() {
  return (
    <>
      <PersistentDrop />
      <main className="relative z-10">
        <Navbar />
        <Hero />
        <About />
        <Work />
        <Capabilities />
        <Contact />
        <Footer />
      </main>
      <RibbonOverlay />
    </>
  );
}
