"use server";

import { isAdminEmail } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { HEADSHOTS_FOLDER, headshotFileName, headshotPosition, orderHeadshotFiles } from "@/lib/headshots";
import { MAX_HOME_BLOG_LIMIT } from "@/lib/site-settings";
import { revalidatePath } from "next/cache";

const ASSETS_BUCKET = "Assets";

async function getVerifiedAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    throw new Error("You are not authorized to change portfolio content.");
  }

  return createAdminClient();
}

async function removeAssets(paths: Array<string | null | undefined>) {
  const cleanPaths = paths.filter((path): path is string => Boolean(path));
  if (cleanPaths.length === 0) return;

  const admin = createAdminClient();
  const { error } = await admin.storage.from(ASSETS_BUCKET).remove(cleanPaths);
  if (error) throw new Error(`Could not delete the linked asset: ${error.message}`);
}

function requiredString(value: FormDataEntryValue | null, label: string) {
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) throw new Error(`${label} is required.`);
  return result;
}

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function numericValue(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function uploadExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
}

async function uploadAsset(
  file: File,
  folder: "skill-icons" | "project-images" | "experience-logos" | "author-headshots" | "headshots",
  maxBytes: number,
  fileName?: string,
) {
  if (!file.type.startsWith("image/")) throw new Error("Only image files can be uploaded.");
  if (file.size > maxBytes) throw new Error(`The image must be ${Math.floor(maxBytes / 1024 / 1024)}MB or smaller.`);

  const path = `${folder}/${fileName ?? `${crypto.randomUUID()}.${uploadExtension(file)}`}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from(ASSETS_BUCKET).upload(path, await file.arrayBuffer(), {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Could not upload the image: ${error.message}`);
  return path;
}

export async function saveSkillCategoryAction(input: {
  id: string | null;
  name: string;
  sortOrder: number;
}) {
  const admin = await getVerifiedAdminClient();
  const payload = { name: input.name.trim(), sort_order: input.sortOrder };
  if (!payload.name) throw new Error("Category name is required.");

  if (input.id) {
    const { error, count } = await admin
      .from("skill_categories")
      .update(payload, { count: "exact" })
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    if (count !== 1) throw new Error("The category was not updated.");
    return;
  }

  const { error } = await admin.from("skill_categories").insert(payload);
  if (error) throw new Error(error.message);
}

export async function saveHomeBlogLimitAction(formData: FormData) {
  const admin = await getVerifiedAdminClient();
  const value = Number(formData.get("homeBlogLimit"));

  if (!Number.isInteger(value) || value < 0 || value > MAX_HOME_BLOG_LIMIT) {
    throw new Error(`Choose a whole number between 0 and ${MAX_HOME_BLOG_LIMIT}.`);
  }

  const { error } = await admin.from("site_settings").upsert(
    { key: "home_blog_limit", value },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/settings");
}

/**
 * Adds one picture to the home page headshot rotation. Called once per file so each request stays small.
 * With a "replaces" path (an adjusted picture), the new file takes that picture's place and the old one is removed.
 */
export async function uploadHeadshotAction(formData: FormData) {
  await getVerifiedAdminClient();
  const image = formData.get("headshot");
  if (!(image instanceof File) || image.size === 0) throw new Error("Choose an image to upload.");

  const replaces = formData.get("replaces");
  if (typeof replaces === "string" && replaces) {
    if (!/^headshots\/[^/]+$/.test(replaces)) throw new Error("That file is not a headshot.");
    // Older un-numbered files stay un-numbered (they sort by upload time after the numbered ones).
    const position = headshotPosition(replaces.slice(HEADSHOTS_FOLDER.length + 1));
    const fileName = Number.isFinite(position) ? headshotFileName(position, uploadExtension(image)) : undefined;
    await uploadAsset(image, "headshots", 1024 * 1024, fileName);
    await removeAssets([replaces]);
    revalidatePath("/", "page");
    revalidatePath("/admin/settings", "page");
    return;
  }

  // New pictures go to the end of the order.
  const files = await listHeadshotFiles();
  const lastPosition = files.reduce((max, file) => {
    const position = headshotPosition(file.name);
    return Number.isFinite(position) ? Math.max(max, position) : max;
  }, 0);
  const nextPosition = Math.max(lastPosition, files.length) + 1;
  await uploadAsset(image, "headshots", 1024 * 1024, headshotFileName(nextPosition, uploadExtension(image)));

  revalidatePath("/", "page");
  revalidatePath("/admin/settings", "page");
}

async function listHeadshotFiles() {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(ASSETS_BUCKET)
    .list(HEADSHOTS_FOLDER, { limit: 100, sortBy: { column: "created_at", order: "asc" } });
  if (error) throw new Error(`Could not list headshots: ${error.message}`);
  return orderHeadshotFiles(data ?? []);
}

/** Saves a new headshot order by renaming each file with its position. `paths` must list every headshot once. */
export async function reorderHeadshotsAction(paths: string[]) {
  await getVerifiedAdminClient();

  const current = (await listHeadshotFiles()).map((file) => `${HEADSHOTS_FOLDER}/${file.name}`);
  const sameSet = paths.length === current.length && new Set(paths).size === paths.length && paths.every((path) => current.includes(path));
  if (!sameSet) throw new Error("The headshots changed since this page loaded. Refresh and try again.");

  const admin = createAdminClient();
  for (const [index, path] of paths.entries()) {
    const name = path.slice(HEADSHOTS_FOLDER.length + 1);
    if (headshotPosition(name) === index + 1) continue;
    const extension = name.split(".").pop() ?? "jpg";
    const { error } = await admin.storage.from(ASSETS_BUCKET).move(path, `${HEADSHOTS_FOLDER}/${headshotFileName(index + 1, extension)}`);
    if (error) throw new Error(`Could not reorder headshots: ${error.message}`);
  }

  revalidatePath("/", "page");
  revalidatePath("/admin/settings", "page");
}

/** Removes a picture from the home page headshot rotation. */
export async function deleteHeadshotAction(path: string) {
  await getVerifiedAdminClient();
  if (!/^headshots\/[^/]+$/.test(path)) throw new Error("That file is not a headshot.");

  await removeAssets([path]);

  revalidatePath("/", "page");
  revalidatePath("/admin/settings", "page");
}

export async function saveAuthorProfileAction(formData: FormData) {
  const admin = await getVerifiedAdminClient();
  const bio = requiredString(formData.get("authorBio"), "Author bio");
  const image = formData.get("authorHeadshot");

  const { data: current, error: readError } = await admin
    .from("author_profile")
    .select("headshot_path")
    .eq("id", 1)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  let uploadedPath: string | null = null;
  let headshotPath = current?.headshot_path ?? "headshot.png";

  try {
    if (image instanceof File && image.size > 0) {
      uploadedPath = await uploadAsset(image, "author-headshots", 2 * 1024 * 1024);
      headshotPath = uploadedPath;
    }

    const { error } = await admin.from("author_profile").upsert(
      { id: 1, bio, headshot_path: headshotPath },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);

    if (current?.headshot_path && current.headshot_path !== headshotPath && current.headshot_path !== "headshot.png") {
      await removeAssets([current.headshot_path]);
    }
  } catch (cause) {
    if (uploadedPath) await removeAssets([uploadedPath]);
    throw cause;
  }

  revalidatePath("/", "page");
  revalidatePath("/blog", "page");
  revalidatePath("/admin/settings", "page");
}

export async function saveSkillAction(formData: FormData) {
  const admin = await getVerifiedAdminClient();
  const skillId = optionalString(formData.get("id"));
  const removeIcon = formData.get("removeIcon") === "true";
  const icon = formData.get("icon");

  let previousIconPath: string | null = null;
  if (skillId) {
    const { data, error } = await admin.from("skills").select("icon_path").eq("id", skillId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("That skill no longer exists.");
    previousIconPath = data.icon_path;
  }

  let uploadedPath: string | null = null;
  let nextIconPath = removeIcon ? null : previousIconPath;

  try {
    if (icon instanceof File && icon.size > 0) {
      uploadedPath = await uploadAsset(icon, "skill-icons", 1024 * 1024);
      nextIconPath = uploadedPath;
    }

    const payload = {
      name: requiredString(formData.get("name"), "Skill name"),
      category_id: requiredString(formData.get("categoryId"), "Category"),
      sort_order: numericValue(formData.get("sortOrder")),
      icon_path: nextIconPath,
    };

    if (skillId) {
      const { error, count } = await admin.from("skills").update(payload, { count: "exact" }).eq("id", skillId);
      if (error) throw new Error(error.message);
      if (count !== 1) throw new Error("The skill was not updated.");
    } else {
      const { error } = await admin.from("skills").insert(payload);
      if (error) throw new Error(error.message);
    }

    if (previousIconPath && previousIconPath !== nextIconPath) await removeAssets([previousIconPath]);
  } catch (cause) {
    if (uploadedPath) await removeAssets([uploadedPath]);
    throw cause;
  }
}

export async function saveProjectAction(formData: FormData) {
  const admin = await getVerifiedAdminClient();
  const projectId = optionalString(formData.get("id"));
  const removeImage = formData.get("removeImage") === "true";
  const image = formData.get("image");
  const rawSkillIds = optionalString(formData.get("skillIds"));
  const rawTags = optionalString(formData.get("tags"));

  const skillIds: string[] = rawSkillIds ? JSON.parse(rawSkillIds) : [];
  const tags: string[] = rawTags ? JSON.parse(rawTags) : [];
  if (!Array.isArray(skillIds) || !skillIds.every((id) => typeof id === "string")) {
    throw new Error("The selected skills are invalid.");
  }

  let previousImagePath: string | null = null;
  if (projectId) {
    const { data, error } = await admin.from("projects").select("image_path").eq("id", projectId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("That project no longer exists.");
    previousImagePath = data.image_path;
  }

  let uploadedPath: string | null = null;
  let nextImagePath = removeImage ? null : previousImagePath;

  try {
    if (image instanceof File && image.size > 0) {
      uploadedPath = await uploadAsset(image, "project-images", 2 * 1024 * 1024);
      nextImagePath = uploadedPath;
    }

    const payload = {
      title: requiredString(formData.get("title"), "Title"),
      org: requiredString(formData.get("org"), "Organisation"),
      description: requiredString(formData.get("description"), "Description"),
      link: requiredString(formData.get("link"), "Project URL"),
      sort_order: numericValue(formData.get("sortOrder")),
      image_alt: optionalString(formData.get("imageAlt")),
      image_path: nextImagePath,
      tags,
    };

    let savedProjectId = projectId;
    if (savedProjectId) {
      const { error, count } = await admin.from("projects").update(payload, { count: "exact" }).eq("id", savedProjectId);
      if (error) throw new Error(error.message);
      if (count !== 1) throw new Error("The project was not updated.");
    } else {
      const { data, error } = await admin.from("projects").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      savedProjectId = data.id;
    }

    const { error: clearError } = await admin.from("project_skills").delete().eq("project_id", savedProjectId);
    if (clearError) throw new Error(clearError.message);
    if (skillIds.length > 0) {
      const { error: linkError } = await admin
        .from("project_skills")
        .insert(skillIds.map((skillId) => ({ project_id: savedProjectId, skill_id: skillId })));
      if (linkError) throw new Error(linkError.message);
    }

    if (previousImagePath && previousImagePath !== nextImagePath) await removeAssets([previousImagePath]);
  } catch (cause) {
    if (uploadedPath) await removeAssets([uploadedPath]);
    throw cause;
  }
}

export async function deleteSkillAction(skillId: string) {
  const admin = await getVerifiedAdminClient();
  const { data: skill, error: readError } = await admin
    .from("skills")
    .select("icon_path")
    .eq("id", skillId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!skill) throw new Error("That skill no longer exists.");

  await removeAssets([skill.icon_path]);
  const { error, count } = await admin
    .from("skills")
    .delete({ count: "exact" })
    .eq("id", skillId);

  if (error) throw new Error(error.message);
  if (count !== 1) throw new Error("The skill was not deleted.");
}

export async function deleteSkillCategoryAction(categoryId: string) {
  const admin = await getVerifiedAdminClient();
  const { data: skills, error: readError } = await admin
    .from("skills")
    .select("icon_path")
    .eq("category_id", categoryId);

  if (readError) throw new Error(readError.message);
  await removeAssets((skills ?? []).map((skill) => skill.icon_path));

  const { error, count } = await admin
    .from("skill_categories")
    .delete({ count: "exact" })
    .eq("id", categoryId);

  if (error) throw new Error(error.message);
  if (count !== 1) throw new Error("The category was not deleted.");
}

export async function deleteProjectAction(projectId: string) {
  const admin = await getVerifiedAdminClient();
  const { data: project, error: readError } = await admin
    .from("projects")
    .select("image_path")
    .eq("id", projectId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!project) throw new Error("That project no longer exists.");

  await removeAssets([project.image_path]);
  const { error, count } = await admin
    .from("projects")
    .delete({ count: "exact" })
    .eq("id", projectId);

  if (error) throw new Error(error.message);
  if (count !== 1) throw new Error("The project was not deleted.");
}

// Accepts "#rrggbb" from the colour picker; anything else (including blank) means the default white tile.
function hexColor(value: FormDataEntryValue | null) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
}

export async function saveExperienceAction(formData: FormData) {
  const admin = await getVerifiedAdminClient();
  const experienceId = optionalString(formData.get("id"));
  const removeLogo = formData.get("removeLogo") === "true";
  const logo = formData.get("logo");

  let previousLogoPath: string | null = null;
  if (experienceId) {
    const { data, error } = await admin.from("experiences").select("logo_path").eq("id", experienceId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("That experience no longer exists.");
    previousLogoPath = data.logo_path;
  }

  let uploadedPath: string | null = null;
  let nextLogoPath = removeLogo ? null : previousLogoPath;

  try {
    if (logo instanceof File && logo.size > 0) {
      uploadedPath = await uploadAsset(logo, "experience-logos", 2 * 1024 * 1024);
      nextLogoPath = uploadedPath;
    }

    const payload = {
      title: requiredString(formData.get("title"), "Title"),
      subtitle: optionalString(formData.get("subtitle")),
      organization: optionalString(formData.get("organization")),
      date_range: optionalString(formData.get("dateRange")),
      description: optionalString(formData.get("description")),
      sort_order: numericValue(formData.get("sortOrder")),
      logo_path: nextLogoPath,
      logo_bg: hexColor(formData.get("logoBg")),
    };

    if (experienceId) {
      const { error, count } = await admin.from("experiences").update(payload, { count: "exact" }).eq("id", experienceId);
      if (error) throw new Error(error.message);
      if (count !== 1) throw new Error("The experience was not updated.");
    } else {
      const { error } = await admin.from("experiences").insert(payload);
      if (error) throw new Error(error.message);
    }

    if (previousLogoPath && previousLogoPath !== nextLogoPath) await removeAssets([previousLogoPath]);
  } catch (cause) {
    if (uploadedPath) await removeAssets([uploadedPath]);
    throw cause;
  }
}

export async function deleteExperienceAction(experienceId: string) {
  const admin = await getVerifiedAdminClient();
  const { data: experience, error: readError } = await admin.from("experiences").select("logo_path").eq("id", experienceId).maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!experience) throw new Error("That experience no longer exists.");

  const { error, count } = await admin.from("experiences").delete({ count: "exact" }).eq("id", experienceId);
  if (error) throw new Error(error.message);
  if (count !== 1) throw new Error("The experience was not deleted.");
  await removeAssets([experience.logo_path]);
}
