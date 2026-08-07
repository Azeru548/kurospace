/**
 * Back-compat re-exports — uploads now use Cloudinary, not Firebase Storage.
 * @see src/lib/storage/upload.ts
 */
export {
  uploadVendorImage,
  deleteStorageURL,
  isCloudinaryConfigured,
  type ImageFolder,
} from "@/lib/storage/upload";
