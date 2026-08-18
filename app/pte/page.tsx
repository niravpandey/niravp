import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import PteClient from "./PteClient";
import type { PteTestimonialCard } from "./components/pteContent";

export const metadata: Metadata = {
  title: "PTE Coaching | Nirav Pandey",
  description: "1-on-1 online PTE tutoring with Nirav Pandey.",
};

async function getTestimonials(): Promise<PteTestimonialCard[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("pte_testimonials")
      .select("id,student_name,testimonial_text,rating,image_storage_path")
      .eq("is_featured", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Could not load PTE testimonials", error);
      return [];
    }

    return (data ?? []).map((testimonial) => ({
      id: testimonial.id,
      studentName: testimonial.student_name,
      text: testimonial.testimonial_text,
      rating: testimonial.rating,
      imageUrl: testimonial.image_storage_path
        ? supabase.storage.from("student-image-bucket").getPublicUrl(testimonial.image_storage_path).data.publicUrl
        : null,
    }));
  } catch (error) {
    console.error("Could not load PTE testimonials", error);
    return [];
  }
}

export default async function PtePage() {
  const testimonials = await getTestimonials();

  return <PteClient testimonials={testimonials} />;
}
