
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col min-h-screen w-full max-w-3xl py-16 px-16 bg-white dark:bg-gray-950">
        <h1 className="text-4xl font-bold">Hi, I am <span className=" text-blue-800 dark:text-green-500">Nirav</span></h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">Data Science@UniMelb | Machine Learning Enthusiast</p>
        <p>
          Final-year Bachelor of Science student at The University of Melbourne, majoring in Data Science.<br/>
          I am interested in AI, Machine Learning, and how it interacts with Finance and Economics. I also tinker with web-development.<br/>
          In my free time, I love climbing, painting, writing blogs, and listening to music. If the sun is harsh, I play the piano, cook, and read. If it isn't, I run.<br/>
          </p>
      </main>
    </div>
  );
}
