import Image from "next/image";
import RunningStats from "@/components/running/RunningStats";
import { Button } from "@/components/ui/button";
import CurrentlyReading from "@/components/reading/CurrentlyReading";
import { BookOpen, Eye } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col min-h-screen w-full max-w-3xl py-12 px-12 bg-white dark:bg-slate-950">
        <section className="">
          <h1 className="text-4xl font-bold">Hi, I am <span className={`text-blue-800 dark:text-green-500`}>Nirav</span></h1>
          <p className="text-gray-500 dark:text-gray-400 mb-3">Data Science @UniMelb | Machine Learning Enthusiast</p>
        <div className="flex flex-col md:flex-row">
          <div className="space-y-3 ">
            <p>Final-year Bachelor of Science student at The University of Melbourne, majoring in Data Science.</p>
            <p>I am interested in AI, Machine Learning, and how it interacts with Finance, Economics and society as a whole. I also tinker with web-development, and I am passionate about building meaningful apps.</p>
            <p>In my free time, I love climbing, painting, writing blogs, and listening to music. If the sun is harsh, I play the piano, cook, and read. If it isn't, I run.</p>
            <p>Stay curious!</p>
          </div>
          
          <div className="flex justify-center px-3 py-3 md:items-center mt-4">
            <div className="relative w-40 h-40">
              
              <Image
                src="/headshot.jpeg"
                alt="Headshot of Nirav Pandey"
                width={160}
                height={160}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
                
          </div>
        </section>

        <section className="mt-12">
          <h1 className="text-4xl font-bold">Recent <span className={`text-blue-800 dark:text-green-500`}>Ideas</span></h1>
          <p className="text-gray-500 dark:text-gray-400 mb-3">Ideas, Opinions, Explainers and more</p>
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
        </section>

        {/* My Running Stats */}
        <section className="mt-12">
          <h1 className="text-4xl font-bold">My <span className={`text-blue-800 dark:text-green-500`}>Running </span>Stats</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-3">Imported using Strava API, plotted using Recharts</p>
          <RunningStats/>
        </section>
        
        {/* Currently Reading */}
        
        <section className="mt-12">
          <h1 className="text-4xl font-bold">My <span className={`text-blue-800 dark:text-green-500`}>Bookshelf </span></h1>
          <p className="text-gray-500 dark:text-gray-400">
            Books I am currently reading. Dynamically fetched from the Goodreads RSS.
          </p>
          <CurrentlyReading/>
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

          
        </section>
          
        


      </main>
    </div>
  );
}
