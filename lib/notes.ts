import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/blog";

export type NoteSummary = Pick<
  Post,
  "id" | "title" | "slug" | "description" | "subject" | "topic" | "position" | "created_at" | "updated_at"
>;

export type Note = NoteSummary & Pick<Post, "content">;

export type NoteTopic = { name: string; notes: NoteSummary[] };
export type NoteSubject = { name: string; topics: NoteTopic[] };

const NOTE_COLUMNS = "id, title, slug, description, subject, topic, position, created_at, updated_at";

/** Notes without a subject or topic still need a home on the index. */
export const UNSORTED = "Unsorted";

/** All published notes, ordered for reading: subject, then topic, then position. */
export const getPublishedNotes = cache(async (): Promise<NoteSummary[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select(NOTE_COLUMNS)
    .eq("kind", "note")
    .eq("published", true)
    .order("subject", { ascending: true })
    .order("topic", { ascending: true })
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
});

/** A single published note, or null. Cached per request. */
export const getPublishedNote = cache(async (slug: string): Promise<Note | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`${NOTE_COLUMNS}, content`)
    .eq("kind", "note")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error) return null;
  return data;
});

/** Groups notes into subject → topic → notes, keeping the order from the query. */
export function groupNotes(notes: NoteSummary[]): NoteSubject[] {
  const subjects = new Map<string, Map<string, NoteSummary[]>>();

  for (const note of notes) {
    const subject = note.subject?.trim() || UNSORTED;
    const topic = note.topic?.trim() || UNSORTED;
    const topics = subjects.get(subject) ?? new Map<string, NoteSummary[]>();
    topics.set(topic, [...(topics.get(topic) ?? []), note]);
    subjects.set(subject, topics);
  }

  return [...subjects]
    .sort(([a], [b]) => (a === UNSORTED ? 1 : b === UNSORTED ? -1 : a.localeCompare(b)))
    .map(([name, topics]) => ({
      name,
      topics: [...topics]
        .sort(([a], [b]) => (a === UNSORTED ? 1 : b === UNSORTED ? -1 : a.localeCompare(b)))
        .map(([topicName, topicNotes]) => ({ name: topicName, notes: topicNotes })),
    }));
}

/** The other notes in the same subject and topic as `slug`, in reading order. */
export async function getTopicSiblings(note: NoteSummary): Promise<NoteSummary[]> {
  const notes = await getPublishedNotes();
  const subject = note.subject?.trim() || UNSORTED;
  const topic = note.topic?.trim() || UNSORTED;
  return (
    groupNotes(notes)
      .find((s) => s.name === subject)
      ?.topics.find((t) => t.name === topic)?.notes ?? []
  );
}

/** Admin: every subject and topic already used, drafts included, for the editor's suggestions. */
export async function getNoteTaxonomy(): Promise<{ subjects: string[]; topics: string[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("subject, topic").eq("kind", "note");

  if (error) {
    console.error("Failed to load note subjects:", error.message);
    return { subjects: [], topics: [] };
  }

  const unique = (values: (string | null)[]) =>
    [...new Set(values.map((v) => v?.trim()).filter((v): v is string => Boolean(v)))].sort();

  return { subjects: unique(data.map((row) => row.subject)), topics: unique(data.map((row) => row.topic)) };
}
