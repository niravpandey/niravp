"use client";

import { useEffect, useRef, useState } from "react";
import Footer from "@/components/layout/Footer";
import { EnquiryModal } from "./components/PteEnquiryModal";
import {
  BottomCta,
  HeroSection,
  ScoreReportSection,
} from "./components/PteLandingSections";
import type { ClassType } from "./components/pteContent";

function useScoreActivation() {
  const scoreSectionRef = useRef<HTMLElement | null>(null);
  const [scoresActive, setScoresActive] = useState(false);

  useEffect(() => {
    const section = scoreSectionRef.current;

    if (!section) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.requestAnimationFrame(() => setScoresActive(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setScoresActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return { scoreSectionRef, scoresActive };
}

export default function PteClient() {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const { scoreSectionRef, scoresActive } = useScoreActivation();
  const [selectedClassType, setSelectedClassType] = useState("");
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  function openEnquiry(classType?: ClassType) {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    if (classType) {
      setSelectedClassType(classType);
    }

    setIsEnquiryOpen(true);
  }

  function closeEnquiry() {
    setIsEnquiryOpen(false);
    previouslyFocusedRef.current?.focus();
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-16 pb-10 sm:px-8 sm:pt-24 lg:px-16">
        <HeroSection
          selectedClassType={selectedClassType}
          onEnquire={openEnquiry}
        />
        <ScoreReportSection
          sectionRef={scoreSectionRef}
          active={scoresActive}
        />
        <BottomCta onEnquire={() => openEnquiry()} />
      </main>

      {isEnquiryOpen && (
        <EnquiryModal
          isOpen={isEnquiryOpen}
          selectedClassType={selectedClassType}
          onClassTypeChange={setSelectedClassType}
          onClose={closeEnquiry}
        />
      )}
      <Footer />
    </div>
  );
}
