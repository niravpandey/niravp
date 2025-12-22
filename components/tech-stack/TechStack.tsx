// components/tech-stack/TechStack.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { CATEGORIES } from "./techData";

const GLOW_TECH = [
  "r",
  "github",
  "nextjs",
  "next.js",
  "shadcn/ui",
  "openai api",
  "vercel",
  "mongodb",
  "tailwind css",
  "node.js",
  "pytorch",
  "jupyter",
  "mysql",
  "scikit-learn",
];

function shouldGlow(name: string) {
  const normalized = name.trim().toLowerCase();
  return GLOW_TECH.includes(normalized);
}

const sectionVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const categoryVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function TechStack() {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeCategory = CATEGORIES[activeIndex] ?? CATEGORIES[0];
  const ActiveIcon = activeCategory?.icon;

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!isPaused) {
        setActiveIndex((current) => (current + 1) % CATEGORIES.length);
      }
    }, 3500);

    return () => window.clearInterval(interval);
  }, [isPaused, shouldReduceMotion]);

  return (
    <motion.section
      className="w-full mt-8"
      variants={sectionVariants}
      initial={shouldReduceMotion ? undefined : "hidden"}
      whileInView={shouldReduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.2 }}
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-6xl">
        <TooltipProvider delayDuration={60}>
          <div className="space-y-6">
            <div
              className="flex flex-wrap items-center gap-3"
              role="tablist"
              aria-label="Tech stack categories"
            >
              {CATEGORIES.map((category, index) => {
                const isActive = index === activeIndex;
                const Icon = category.icon;

                return (
                  <button
                    key={category.name}
                    type="button"
                    role="tab"
                    id={`tech-category-tab-${index}`}
                    aria-selected={isActive}
                    aria-controls={`tech-category-panel-${index}`}
                    onClick={() => setActiveIndex(index)}
                    className={`flex items-center gap-2 px-1 pb-1 text-sm font-medium transition-colors border-b-2 ${
                      isActive
                        ? "text-zinc-900 dark:text-zinc-100 border-zinc-900/70 dark:border-zinc-200/70"
                        : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                        isActive
                          ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                          : "bg-transparent text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>

            {activeCategory && ActiveIcon && (
              <motion.div
                key={activeCategory.name}
                variants={categoryVariants}
                initial={shouldReduceMotion ? false : "hidden"}
                animate="visible"
                className="space-y-3"
                role="tabpanel"
                id={`tech-category-panel-${activeIndex}`}
                aria-labelledby={`tech-category-tab-${activeIndex}`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                    <ActiveIcon className="h-4 w-4" />
                  </span>
                  <h3 className="text-lg font-semibold">{activeCategory.name}</h3>
                </div>

                <motion.div
                  variants={gridVariants}
                  initial={shouldReduceMotion ? false : "hidden"}
                  animate="visible"
                  className="
                    grid gap-3
                    grid-cols-[repeat(auto-fit,minmax(6rem,1fr))]
                  "
                >
                  {activeCategory.items.map((tech) => {
                    const glow = shouldGlow(tech.name);

                    return (
                      <Tooltip key={tech.name}>
                        <TooltipTrigger asChild>
                          <motion.div
                            variants={cardVariants}
                            whileTap={
                              shouldReduceMotion
                                ? undefined
                                : {
                                    scale: 0.97,
                                    transition: { duration: 0.12 },
                                  }
                            }
                            className="group h-full"
                          >
                            <Card
                              className="
                                h-full
                                flex items-center justify-center
                                p-3
                                rounded-none
                                border border-zinc-200/70 dark:border-zinc-800
                                bg-zinc-50/80 dark:bg-zinc-900
                                hover:bg-white dark:hover:bg-zinc-800
                                transition-all duration-150
                                cursor-default
                              "
                            >
                              <div className="relative flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9">
                                {/* Dark-mode glow only for selected techs */}
                                {glow && (
                                  <div
                                    className="
                                      pointer-events-none 
                                      absolute inset-[-2px]
                                      opacity-0 dark:opacity-100
                                    bg-white transition-opacity 
                                      duration-200 
                                      group-hover:opacity-100
                                    "
                                  />
                                )}

                                <Image
                                  src={tech.logo}
                                  alt={tech.name}
                                  fill
                                  sizes="36px"
                                  className="object-contain relative"
                                />
                              </div>
                            </Card>
                          </motion.div>
                        </TooltipTrigger>

                        <TooltipContent
                          side="top"
                          className="px-2 py-1 text-[0.7rem] font-medium"
                        >
                          {tech.name}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}
          </div>
        </TooltipProvider>
      </div>
    </motion.section>
  );
}
