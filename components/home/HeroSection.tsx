import Image from "next/image";
import PhosphorIcon from "@/components/ui/PhosphorIcon";

export default function HeroSection() {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-start gap-6 border-b border-gray-200 pb-5">
      <div className="relative w-32 sm:w-40 md:w-48 aspect-square shrink-0">
        <Image
          src="https://apqsehnfehgcygadnrgq.supabase.co/storage/v1/object/public/Assets/headshot.png"
          fill
          alt="Nirav Pandey"
          sizes="(max-width: 640px) 8rem, (max-width: 768px) 10rem, 12rem"
          className="object-cover border border-gray-300 p-1"
        />
      </div>

      <div className="shrink-0">
        <h1 className="text-3xl font-semibold text-blue-900">Nirav Pandey</h1>
        <p className="text-gray-600">Student, University of Melbourne</p>
        <p className="text-gray-600">Bachelor of Science (Data Science)</p>

        <div className="mt-4 flex flex-col gap-1 text-gray-700">
          <a href="mailto:niravp@student.unimelb.edu.au" className="flex items-center gap-2 hover:text-mauve-500">
            <PhosphorIcon name="paper-plane-tilt" size={16} />
            Email
          </a>
          <a href="https://linkedin.com/in/niravpandey05" className="flex items-center gap-2 hover:text-mauve-500">
            <Image
              src="https://apqsehnfehgcygadnrgq.supabase.co/storage/v1/object/public/Assets/icons/LinkedIn.png"
              width={16}
              height={16}
              alt="LinkedIn"
              className="h-4 w-4"
            />
            LinkedIn
          </a>
          <a href="https://github.com/niravpandey" className="flex items-center gap-2 hover:text-mauve-500">
            <Image
              src="https://apqsehnfehgcygadnrgq.supabase.co/storage/v1/object/public/Assets/icons/GitHub.png"
              width={16}
              height={16}
              alt="GitHub"
              className="h-4 w-4"
            />
            GitHub
          </a>
        </div>
      </div>

      <div className="w-full md:flex-1">
        <p className="text-gray-600">
          I grew up in Kathmandu, Nepal, and I am now pursuing my undergraduate
          studies in Melbourne. During my degree, I&apos;ve had the chance to learn about data science, AI and machine 
          learning. 
        </p>
        <p className="mt-2 text-gray-600">
          Beyond academics, I enjoy reading a wide range of literature and working
          on fun projects that challenge me to learn and grow. 
        </p>
        <p className="mt-2 text-gray-600">This is where I write about things that interest me and document my projects</p>
        <p className="mt-2 text-mauve-500">
          Nirav Pandey 
        </p>
        <p className="text-mauve-500">
          09/04/26
        </p>
      </div>
    </div>
  );
}
