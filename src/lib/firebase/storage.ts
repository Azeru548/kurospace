import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getClientStorage } from "./client";

function extFromFile(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "jpg";
}

export async function uploadVendorImage(
  vendorId: string,
  file: File,
  folder: "logo" | "cover" | "catalog" = "catalog"
): Promise<string> {
  const storage = getClientStorage();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `vendors/${vendorId}/${folder}/${id}.${extFromFile(file)}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
    customMetadata: { vendorId },
  });
  return getDownloadURL(storageRef);
}

export async function deleteStorageURL(url: string): Promise<void> {
  try {
    const storage = getClientStorage();
    // Firebase download URLs contain /o/<path>?
    const match = decodeURIComponent(url).match(/\/o\/(.+?)\?/);
    if (!match) return;
    const path = match[1];
    await deleteObject(ref(storage, path));
  } catch {
    /* ignore missing objects */
  }
}
