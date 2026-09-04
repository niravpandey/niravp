"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serialize } from "next-mdx-remote/serialize";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

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
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/pte/dashboard");
  }

  return supabase;
}

export async function savePost(data: PostFormData) {
  const supabase = await requireUser();

  const tags = data.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const payload = {
    title: data.title,
    slug: data.slug,
    description: data.description,
    content: data.content,
    tags,
    cover_image: data.coverImage,
    published: data.published,
    created_at: data.createdAt,
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

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    redirect(`/admin/blog/${inserted.id}`);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
}

export async function deletePost(id: string) {
  const supabase = await requireUser();

  const { data: post, error: loadError } = await supabase
    .from("posts")
    .select("slug")
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

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);

  redirect("/admin/blog");
}

export async function compilePostPreview(source: string) {
  await requireUser();

  return serialize(source, {
    mdxOptions: {
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeKatex],
    },
  });
}
