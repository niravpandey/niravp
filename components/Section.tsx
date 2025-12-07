"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

const sectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 32,
    rotateX: -4,
    filter: "blur(2px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1], // smoother ease-out
    },
  },
};

export default function Section({ children, className = "", id }: SectionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <section
        id={id}
        className={`w-full max-w-4xl mx-auto my-10 ${className}`}
      >
        {children}
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      className={`w-full max-w-4xl mx-auto my-10 ${className}`}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }} // animates when ~20% in view
    >
      {children}
    </motion.section>
  );
}
