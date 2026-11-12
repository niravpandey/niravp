import LoadingIndicator from "@/components/ui/LoadingIndicator";

// Shown below the navbar while a page loads during in-site navigation.
export default function Loading() {
  return (
    <main className="flex min-h-[60vh] flex-1 items-center justify-center">
      <LoadingIndicator />
    </main>
  );
}
