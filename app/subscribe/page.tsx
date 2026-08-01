import NewsletterSection from "@/components/home/NewsletterSection";
import Footer from "@/components/layout/Footer";

export default function SubscribePage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center font-sans">
      <main className="flex w-full flex-1 flex-col items-center px-4 py-16 sm:items-start sm:px-8 sm:py-32 lg:px-16">
        <section className="w-full max-w-3xl">
          <div className="border border-gray-200 bg-white/50 p-6 sm:p-8">
            <h1 className="text-xs font-semibold uppercase tracking-wider text-mauve-500">
              Subscribe
            </h1>

            <p className="mt-4 text-2xl font-semibold tracking-tight text-blue-900">
              Occasional updates when I publish something new.
            </p>

            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">
              I don't send emails on a schedule. When I write something new,
              build a project, or find something worth sharing, I'll send you
              an update.
            </p>

            <div className="mt-8">
              <NewsletterSection />
            </div>

            <p className="mt-6 text-xs text-gray-500">
              You'll receive a confirmation email first. Just updates
              when there's something new.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}