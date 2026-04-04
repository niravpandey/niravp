import Image from "next/image";
import { Mail } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-start gap-6 border-b border-gray-200 pb-5">
      <div className="relative w-32 sm:w-40 md:w-48 aspect-square shrink-0">
        <Image
          src="/headshot.png"
          fill
          alt="Nirav Pandey"
          className="object-cover border border-gray-300 p-1"
        />
      </div>

      <div className="shrink-0">
        <h1 className="text-3xl font-semibold text-mauve-600">Nirav Pandey</h1>
        <p>Student, University of Melbourne</p>
        <p>Bachelor of Science (Data Science)</p>

        <div className="mt-4 flex flex-col gap-1">
          <a href="mailto:niravp@student.unimelb.edu.au" className="flex items-center gap-2 hover:text-mauve-500">
            <Mail className="h-4 w-4" />
            Email
          </a>
          <a href="https://linkedin.com/in/niravpandey05" className="flex items-center gap-2 hover:text-mauve-500">
            <Image src="/LI-In-Bug.png" width={16} height={16} alt="LinkedIn" />
            LinkedIn
          </a>
          <a href="https://github.com/niravpandey" className="flex items-center gap-2 hover:text-mauve-500">
            <Image src="/GitHub_Invertocat_Black.png" width={16} height={16} alt="GitHub" />
            GitHub
          </a>
        </div>
      </div>

      <div className="w-full md:flex-1">
        <p>
          I grew up in Kathmandu, Nepal, and I am now pursuing my undergraduate
          studies in Melbourne. During my degree, I&apos;ve had the chance to learn about data science, AI and machine 
          learning. 
        </p>
        <p className="mt-2">
          Beyond academics, I enjoy reading a wide range of literature and working
          on fun projects that challenge me to learn and grow. If you 
        </p>
        <p className="mt-2">You can find my projects and experiences here.</p>
      </div>
    </div>
  );
}
