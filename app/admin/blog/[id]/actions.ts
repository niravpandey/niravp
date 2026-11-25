"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serialize } from "next-mdx-remote/serialize";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { isAdminEmail } from "@/lib/auth/admin";
import type { PostKind } from "@/lib/blog";
import { createClient } from "@/lib/supabase/server";
import rehypeSourcePositions from "./rehypeSourcePositions";

export type PostFormData = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string;
  coverImage: string;
  published: boolean;
  createdAt: string;
  kind: PostKind;
  subject: string;
  topic: string;
  position: string;
};

/**
 * Refreshes every cached public page after a save or delete. Posts show up on the home page, the blog and
 * notes indexes, their own page, the navbar search and the sitemap, so the whole site is revalidated.
 */
function revalidatePublicPages() {
  revalidatePath("/", "layout");
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/");
  }

  return supabase;
}

export async function savePost(data: PostFormData) {
  const supabase = await requireUser();

  const tags = data.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const isNote = data.kind === "note";
  const position = Number.parseInt(data.position, 10);

  const payload = {
    title: data.title,
    slug: data.slug,
    description: data.description,
    content: data.content,
    tags,
    cover_image: data.coverImage,
    published: data.published,
    created_at: data.createdAt,
    kind: isNote ? "note" : "post",
    subject: isNote ? data.subject.trim() || null : null,
    topic: isNote ? data.topic.trim() || null : null,
    position: isNote && Number.isFinite(position) ? position : null,
    updated_at: new Date().toISOString(),
  };

  if (data.id && data.id !== "new") {
    const { error } = await supabase
      .from("posts")
      .update(payload)
      .eq("id", data.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { data: inserted, error } = await supabase
      .from("posts")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePublicPages();
    redirect(`/admin/blog/${inserted.id}`);
  }

  revalidatePublicPages();
}

/** Pins or unpins a post so it stays at the top of the admin list. */
export async function setPostPinned(id: string, pinned: boolean) {
  const supabase = await requireUser();

  const { error } = await supabase.from("posts").update({ pinned }).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/blog");
}

export async function deletePost(id: string) {
  const supabase = await requireUser();

  const { error: loadError } = await supabase
    .from("posts")
    .select("id")
    .eq("id", id)
    .single();

  if (loadError) {
    throw new Error(loadError.message);
  }

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePublicPages();

  redirect("/admin/blog");
}

export async function compilePostPreview(source: string) {
  await requireUser();

  return serialize(source, {
    mdxOptions: {
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeSourcePositions, rehypeKatex],
    },
  });
}
