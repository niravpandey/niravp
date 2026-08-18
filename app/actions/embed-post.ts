"use server";

import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedSinglePost(postId: string) {
  try {
    const supabase = createAdminClient();

    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("id, title, description, content")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return { success: false, error: fetchError?.message || "Post not found" };
    }

    const input = `Title:\n${post.title}\n\nDescription:\n${
      post.description || ""
    }\n\nContent:\n${post.content || ""}`.trim();

    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input,
    });

    const vector = res.data[0].embedding;

    // Update Supabase vector column
    const { error: updateError } = await supabase
      .from("posts")
      .update({ embedding: vector })
      .eq("id", postId);

    if (updateError) {
      console.error("[embedSinglePost] Supabase update failed:", updateError);
      return { success: false, error: updateError.message };
    }

    // 👈 Critical: Revalidate BOTH routes to flush server caches
    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return { success: true };
  } catch (err: unknown) {
    console.error("[embedSinglePost] Exception caught:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal server error" };
  }
}
