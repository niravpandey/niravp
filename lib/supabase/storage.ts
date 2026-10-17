const ASSETS_BASE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Assets`;

/** Public URL for a file in the "Assets" storage bucket, e.g. "icons/GitHub.png". */
export function getAssetUrl(path: string) {
  return encodeURI(`${ASSETS_BASE_URL}/${path}`);
}

/** Same as getAssetUrl, but passes through a missing path as null. */
export function getOptionalAssetUrl(path: string | null | undefined) {
  return path ? getAssetUrl(path) : null;
}
