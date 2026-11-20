import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

/** Same bucket and size cap as uploads from the editor (see editorUtils). */
const BLOG_BUCKET_NAME = "Blog";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 15_000;

/** SVG is left out on purpose: it can carry scripts. */
const EXTENSIONS: Record<string, string> = {
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

class ImportError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

/** Loopback, private, link-local and other non-public addresses the server must not be pointed at. */
function isPrivateAddress(address: string) {
  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    if (lower.startsWith("::ffff:")) return isPrivateAddress(lower.slice(7));
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb")
    );
  }

  const [a, b] = address.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ImportError("Only http(s) links can be imported.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true }).catch(() => []);

  if (addresses.length === 0) throw new ImportError("That link's host could not be found.");
  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new ImportError("That link points at a private address.");
  }
}

/** Fetches the link, following redirects by hand so every hop is checked. */
async function fetchImage(link: URL) {
  let url = link;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertPublicUrl(url);

    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8" },
    }).catch(() => {
      throw new ImportError("Couldn't reach that link.", 502);
    });

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }

    if (!response.ok) throw new ImportError(`That link answered with ${response.status}.`, 502);
    return { response, finalUrl: url };
  }

  throw new ImportError("That link redirects too many times.", 502);
}

/** Reads the body, giving up as soon as it passes the size cap. */
async function readCapped(response: Response) {
  const declared = Number(response.headers.get("content-length"));
  if (declared > MAX_IMAGE_BYTES) throw tooLarge();

  const reader = response.body?.getReader();
  if (!reader) throw new ImportError("That link returned an empty response.", 502);

  const chunks: Uint8Array[] = [];
  let size = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw tooLarge();
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

function tooLarge() {
  return new ImportError("That image is over 2MB. Download it and use “upload images” so it gets compressed.", 413);
}

function fileNameFor(url: URL, extension: string) {
  const lastSegment = decodeURIComponent(url.pathname.split("/").pop() ?? "").replace(/\.[^/.]+$/, "");
  const safeBaseName = lastSegment
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

  return `${Date.now()}-${safeBaseName || "linked-image"}.${extension}`;
}

/** Imports an image from a link into the Blog bucket. Body: `{ "url": "https://..." }`. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

  let link: URL;
  try {
    link = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "That isn't a valid link." }, { status: 400 });
  }

  try {
    const { response, finalUrl } = await fetchImage(link);
    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const extension = EXTENSIONS[contentType];

    if (!extension) {
      await response.body?.cancel();
      throw new ImportError(
        contentType === "image/svg+xml"
          ? "SVG links aren't supported."
          : "That link isn't an image. Use the image's own address (right-click → copy image address).",
      );
    }

    const bytes = await readCapped(response);
    const fileName = fileNameFor(finalUrl, extension);

    const { error: uploadError } = await supabase.storage.from(BLOG_BUCKET_NAME).upload(fileName, bytes, {
      cacheControl: "3600",
      contentType,
      upsert: false,
    });

    if (uploadError) throw new ImportError(uploadError.message, 500);

    const { data } = supabase.storage.from(BLOG_BUCKET_NAME).getPublicUrl(fileName);

    return NextResponse.json({ name: fileName, path: fileName, publicUrl: data.publicUrl });
  } catch (cause) {
    if (cause instanceof ImportError) {
      return NextResponse.json({ error: cause.message }, { status: cause.status });
    }

    console.error("Blog image import failed:", cause);
    return NextResponse.json({ error: "Importing that image failed." }, { status: 500 });
  }
}
