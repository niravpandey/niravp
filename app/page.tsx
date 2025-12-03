import Image from "next/image";
import RunningStats from "@/components/running/RunningStats";
import { Button } from "@/components/ui/button";
import CurrentlyReading from "@/components/reading/CurrentlyReading";
import { BookOpen, Eye } from "lucide-react";
import Section from "@/components/Section";
import BlogCard from "@/components/blog/BlogCard";
import { blogCards } from "./api/blog/blogCards";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col min-h-screen w-full max-w-6xl py-12 px-12 gap-12 bg-white dark:bg-slate-950">
        
        <Section>
          <div className="flex flex-col justify-center">
            {/* Heading */}
            <h1 className="text-5xl font-bold mb-2">
              Hi, I am <span className="text-blue-800 dark:text-green-500">Nirav</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Data Science @ UniMelb | Machine Learning Enthusiast
            </p>

            {/* Content Section */}
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              {/* Text Section */}
              <div className="space-y-4 max-w-prose flex-1">
                <p>
                  Final-year Bachelor of Science student at The University of Melbourne, majoring in Data Science.
                </p>
                <p>
                  I’m fascinated by AI and Machine Learning, particularly how they interact with finance, economics, and society. 
                  I also enjoy building thoughtful and useful web applications.
                </p>
                <p>
                  In my spare time, I climb, paint, write blogs, and listen to music. 
                  When the sun is out, I run; when it isn’t, I cook, read, or play the piano.
                </p>
                <p>Stay curious.</p>
              </div>

              {/* Image Section */}
              <div className="flex justify-center md:justify-end flex-1 mt-6 md:mt-0">
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-xl overflow-hidden shadow-md">
                  <Image
                    src="/headshot.jpeg"
                    alt="Headshot of Nirav Pandey"
                    width={320}
                    height={320}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>
        <Section>
          <h1 className="text-5xl font-bold">Recent <span className={`text-blue-800 dark:text-green-500`}>Ideas</span></h1>
          <p className="text-gray-500 dark:text-gray-400 mb-3">Ideas, Opinions, Explainers and more</p>
          <div className="py-6">
            {blogCards.map((blog) => (
          <BlogCard key={blog.slug} {...blog} />
          ))}
          </div>
          
          <div className="w-full flex justify-center mt-6">
            <Button 
              variant="outline"
              className="
                bg-transparent 
                border-gray-400 
                text-gray-700 
                dark:text-gray-300 
                hover:bg-gray-100 
                dark:hover:bg-gray-800
                transition-all
                px-6 py-3 
                gap-2
              "
            >
              <BookOpen className="w-4 h-4" />
              Read More Articles
            </Button>
          </div>
        </Section>

        {/* My Running Stats */}
        <Section>
          <h1 className="text-5xl font-bold">My <span className={`text-blue-800 dark:text-green-500`}>Running </span>Stats</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-3">Imported using Strava API, plotted using Recharts</p>
          <RunningStats/>
        </Section>
        
        {/* Currently Reading */}
        
        <Section>
          <h1 className="text-5xl font-bold">My <span className={`text-blue-800 dark:text-green-500`}>Bookshelf </span></h1>
          <p className="text-gray-500 dark:text-gray-400">
            Books I am currently reading. Dynamically fetched from the Goodreads RSS.
          </p>
          <CurrentlyReading />
          <p className="text-gray-500 dark:text-gray-400 mt-4 text-xs text-right">
            All images and information belong to Goodreads. 
          </p>
          <div className="w-full flex justify-center mt-6">
            <Button 
              variant="outline"
              className="
                bg-transparent 
                border-gray-400 
                text-gray-700 
                dark:text-gray-300 
                hover:bg-gray-100 
                dark:hover:bg-gray-800
                transition-all
                px-6 py-3 
                gap-2
              "
            >
              <Eye className="w-4 h-4" />
              How I built this feature
            </Button>
          </div>

          
        </Section>
          
        


      </main>
    </div>
  );
}
