// components/tech-stack/techData.ts

import { Code2, Brain, Globe2, Database, Wrench, type LucideIcon } from "lucide-react";

export type TechItem = {
  name: string;
  logo: string;
  description: string;
};

export type TechCategory = {
  name: string;
  icon: LucideIcon;
  items: TechItem[];
};

export const CATEGORIES: TechCategory[] = [
  {
    name: "Languages",
    icon: Code2,
    items: [
      {
        name: "Python",
        logo: "/tech/python.png",
        description: "General-purpose language I use for data science, ML, and scripting.",
      },
      {
        name: "C",
        logo: "/tech/c.png",
        description: "Low-level language for understanding memory, systems, and performance.",
      },
      {
        name: "R",
        logo: "/tech/r.png",
        description: "Statistics and data analysis, especially in an academic context.",
      },
      {
        name: "JavaScript",
        logo: "/tech/javascript.png",
        description: "Core language of the web for client-side interactivity.",
      },
      {
        name: "TypeScript",
        logo: "/tech/typescript.png",
        description: "Typed superset of JS for safer, more maintainable web apps.",
      },
    ],
  },

  {
    name: "Data Science",
    icon: Brain,
    items: [
      { name: "NumPy", logo: "/tech/numpy.png", description: "Fast numerical computing and array operations in Python." },
      { name: "Matplotlib", logo: "/tech/matplotlib.png", description: "Foundational plotting and visualization library in Python." },
      { name: "scikit-learn", logo: "/tech/sklearn.png", description: "Classical machine learning models and evaluation tools." },
      { name: "TensorFlow", logo: "/tech/tensorflow.png", description: "Deep learning framework for building neural networks." },
      { name: "Keras", logo: "/tech/keras.png", description: "High-level API for building neural networks with minimal code." },
      { name: "PyTorch", logo: "/tech/pytorch.png", description: "Deep learning framework with dynamic computation graphs." },
      { name: "Jupyter", logo: "/tech/jupyter.png", description: "Interactive environment for experiments, EDA, and documentation." },
    ],
  },

  {
    name: "Web & UI",
    icon: Globe2,
    items: [
      { name: "React", logo: "/tech/react.png", description: "Component-driven UI library for modern web apps." },
      { name: "Next.js", logo: "/tech/nextjs.svg", description: "Full-stack React framework for production apps." },
      { name: "Tailwind CSS", logo: "/tech/tailwind.png", description: "Utility-first CSS framework for rapid UI development." },
      { name: "shadcn/ui", logo: "/tech/shadcn.png", description: "Accessible component system built on Radix + Tailwind." },
      { name: "Node.js", logo: "/tech/node.png", description: "JavaScript runtime used for backend and tooling." },
      { name: "OpenAI API", logo: "/tech/openai.svg", description: "LLM-powered capabilities for apps and tools." },
    ],
  },

  {
    name: "Backend",
    icon: Database,
    items: [
      { name: "Supabase", logo: "/tech/supabase.png", description: "Postgres backend with auth, storage, and real-time." },
      { name: "PostgreSQL", logo: "/tech/pgsql.png", description: "Advanced relational database for structured data." },
      { name: "MongoDB", logo: "/tech/mongodb.png", description: "Flexible NoSQL document store." },
      { name: "MySQL", logo: "/tech/mysql.png", description: "One of the most widely used relational databases." },
    ],
  },

  {
    name: "Tools",
    icon: Wrench,
    items: [
      { name: "Git", logo: "/tech/git.png", description: "Version control system for managing code changes." },
      { name: "GitHub", logo: "/tech/github.svg", description: "Hosting platform for Git repositories and collaboration." },
      { name: "Vercel", logo: "/tech/vercel.svg", description: "Cloud deployment platform for frontend + Next.js apps." },
    ],
  },
];
