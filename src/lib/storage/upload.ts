/**
 * Image uploads via Cloudinary (no Firebase Storage / Blaze plan required).
 *
 * Setup (free Cloudinary account):
 * 1. https://cloudinary.com → sign up
 * 2. Dashboard → copy Cloud name
 * 3. Settings → Upload → Add upload preset
 *    - Signing mode: Unsigned
 *    - Folder (optional): kurospace
 * 4. .env.local:
 *    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud
 *    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
 */

export type ImageFolder = "logo" | "cover" | "catalog";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  );
}

/**
 * Upload a vendor image and return a public HTTPS URL.
 * Replaces Firebase Storage for the free-plan constraint.
 */
export async function uploadVendorImage(
  vendorId: string,
  file: File,
  folder: ImageFolder = "catalog"
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Image uploads need Cloudinary. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local (free account — no Firebase Storage)."
    );
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  // Soft client-side cap (Cloudinary free tier is generous; keep payloads reasonable)
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Image must be under 5 MB.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  form.append("folder", `kurospace/vendors/${vendorId}/${folder}`);
  form.append("context", `vendorId=${vendorId}|folder=${folder}`);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const res = await fetch(endpoint, { method: "POST", body: form });
  const data = (await res.json()) as {
    secure_url?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!res.ok || !data.secure_url) {
    const msg = data.error?.message || `Cloudinary upload failed (${res.status})`;
    throw new Error(msg);
  }

  return data.secure_url;
}

/** Best-effort delete — unsigned presets often cannot delete; no-op is fine for MVP. */
export async function deleteStorageURL(_url: string): Promise<void> {
  // Cloudinary destroy requires API secret (server-side). Skip on free client flow.
  return;
}
