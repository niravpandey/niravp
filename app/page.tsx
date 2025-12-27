import Image from "next/image";
import RunningStats from "@/components/running/RunningStats";
import { Button } from "@/components/ui/button";
import CurrentlyReading from "@/components/reading/CurrentlyReading";
import { BookOpen } from "lucide-react";
import Section from "@/components/Section";
import BlogCard from "@/components/blog/BlogCard";
import TechStack from "@/components/tech-stack/TechStack";
import { Castoro } from "next/font/google";
import clientPromise from "@/lib/mongodb";

const castoro = Castoro({ 
  subsets: ['latin'], 
  weight: '400', 
  display: 'swap' 
});

export default async function Home() {

  const client = await clientPromise;
  const db = client.db("posts");

  const posts = await db
    .collection("metadata")
    .find({ })
    .sort({ publishedAt: -1 })
    .limit(4)
    .toArray();

  const recents = posts.map((p: any) => ({
    title: p.title,
    slug: p.slug,
    date: new Date(p.publishedAt).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    excerpt: p.excerpt,
    categories: p.categories ?? [],
    readTime: `${p.readTimeMinutes ?? 0} min read`,
    likes: p.likes ?? 0,
  }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col min-h-screen w-full max-w-6xl 
                       px-4 py-4
                       sm:px-6  sm:py-6
                       md:py-12 md:px-12 
                       bg-white dark:bg-zinc-950">
        
        <Section>
          <div className="flex flex-col justify-center">
            {/* Heading */}
            <h1 className={`text-5xl font-bold mb-2 ${castoro.className}`}>
              Hi, I am <span className={`text-blue-800 dark:text-green-500`}>Nirav</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Data Science @ UniMelb | Machine Learning Enthusiast
            </p>

            {/* Content Section */}
            <div className="flex flex-col gap-8 md:flex-row md:items-center">
              {/* Text Section */}
              <div className="space-y-4 max-w-prose flex-1">
                <p>
                  I am a final year Bachelor of Science student at The University of Melbourne, majoring in Data Science.
                </p>
                <p> 
                  I enjoy tinkering with web development in my free time, and I aspire to build something impactful one day. 
                </p>
                <p>
                  I love climbing on plastic rocks and listening to classical music. If the sun is harsh, I stay inside, play the piano, cook, and read. If it isn't, I run.
                </p>
              </div>
              <div className={`bg-blue-800 dark:bg-green-600 w-40 h-40 flex items-center justify-center mx-auto text-white text-4xl ${castoro.className}`}>
                np
              </div>
              
            </div>
          </div>
        </Section>

        <Section>
          <h1 className={`text-5xl font-bold mb-2 ${castoro.className}`}>Some <span className={`text-blue-800 dark:text-green-500`}>Tech</span> I use</h1>
          <TechStack/>
        </Section>

        <Section>
          <h1 className={`text-5xl font-bold mb-2 ${castoro.className}`}>Recent <span className={`text-blue-800 dark:text-green-500`}>Ideas</span></h1>
          <p className="text-gray-500 dark:text-gray-400 mb-3">Ideas, Opinions, Explainers and more</p>
          <div className="flex flex-col py-6 gap-2">
            {recents.map((blog) => (
          <BlogCard key={blog.slug} {...blog} />
          ))}
          </div>
          
          <div className="w-full flex justify-center mt-3">
            <Button 
              variant="outline"
              className="
                font-medium
                transition-all
                px-6 py-2 rounded-none
              bg-zinc-50/80 dark:bg-zinc-950
              hover:bg-white dark:hover:bg-zinc-900
                cursor-pointer
              "
            >
              <BookOpen className="w-4 h-4" />
              Read More Articles
            </Button>
          </div>
        </Section>

        {/* My Running Stats */}
        <Section>
          <h1 className={`text-5xl font-bold mb-2 ${castoro.className}`}>My <span className={`text-blue-800 dark:text-green-500`}>Running </span>Stats</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-3">Imported using Strava API, plotted using Recharts</p>
          <RunningStats/>
        </Section>
        
        {/* Currently Reading */}
        
        <Section>
          <h1 className={`text-5xl font-bold mb-2 ${castoro.className}`}>My <span className={`text-blue-800 dark:text-green-500`}>Bookshelf </span></h1>
          <p className="text-gray-500 dark:text-gray-400">
            Books I am currently reading. Dynamically fetched from the Goodreads RSS.
          </p>
          <CurrentlyReading />
          <p className="text-gray-500 dark:text-gray-400 mt-4 text-xs text-right">
            All images and information belong to Goodreads. 
          </p>
        </Section>
          
        


      </main>
    </div>
  );
}
