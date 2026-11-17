import { getPostById } from "@/lib/blog";
import { getNoteTaxonomy } from "@/lib/notes";
import { notFound } from "next/navigation";
import PostEditor from "./PostEditor";
import Footer from "@/components/layout/Footer";

export default async function AdminPostPage(props: PageProps<"/admin/blog/[id]">) {
  const { id } = await props.params;
  const { kind } = await props.searchParams;
  let post = null;

  if (id !== "new") {
    post = await getPostById(id);

    if (!post) {
      notFound();
    }
  }

  const taxonomy = await getNoteTaxonomy();

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex flex-1 flex-col items-center  px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <PostEditor post={post} initialKind={kind === "note" ? "note" : "post"} noteTaxonomy={taxonomy} />
      </main>
      <Footer />
    </div>
  );
}
