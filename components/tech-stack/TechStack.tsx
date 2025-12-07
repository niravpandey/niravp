// components/tech-stack/TechStack.tsx
"use client";

import Image from "next/image";
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

  return (
    <motion.section
      className="w-full mt-8"
      variants={sectionVariants}
      initial={shouldReduceMotion ? undefined : "hidden"}
      whileInView={shouldReduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="mx-auto max-w-6xl px-4">
        <TooltipProvider delayDuration={60}>
          <div className="space-y-8">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;

              return (
                <motion.div
                  key={category.name}
                  variants={categoryVariants}
                  className="space-y-3"
                >
                  {/* Category header */}
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                  </div>

                  {/* Compact grid with no names visible */}
                  <motion.div
                    variants={gridVariants}
                    className="
                      grid gap-3
                      grid-cols-[repeat(auto-fit,minmax(6rem,1fr))]
                    "
                  >
                    {category.items.map((tech) => {
                      const glow = shouldGlow(tech.name);

                      return (
                        <Tooltip key={tech.name}>
                          <TooltipTrigger asChild>
                            <motion.div
                              variants={cardVariants}
                              whileHover={
                                shouldReduceMotion
                                  ? undefined
                                  : {
                                      y: -4,
                                      scale: 1.03,
                                      transition: { duration: 0.18 },
                                    }
                              }
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
                                  border border-zinc-200/70 dark:border-zinc-800
                                  bg-zinc-50/80 dark:bg-zinc-900
                                  shadow-sm
                                  hover:border-blue-500/70 dark:hover:border-emerald-400/70
                                  hover:bg-white dark:hover:bg-zinc-800
                                  hover:shadow-md
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

                          {/* Tooltip now shows the name only */}
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
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </motion.section>
  );
}
