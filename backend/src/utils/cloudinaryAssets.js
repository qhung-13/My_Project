import { v2 as cloudinary } from "cloudinary";

/**
 * Best-effort cleanup for Cloudinary assets. Database operations should not be
 * rolled back merely because a remote cleanup request temporarily fails.
 */
const destroyCloudinaryAsset = async (publicId, resourceType = "image") => {
  if (!publicId) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return result?.result === "ok" || result?.result === "not found";
  } catch (error) {
    console.error(`Cloudinary cleanup failed for ${publicId}:`, error.message);
    return false;
  }
};

export default destroyCloudinaryAsset;
