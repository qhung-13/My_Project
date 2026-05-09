import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

/**
 * Configure Cloudinary with environment variables
 * Must be called after dotenv.config()
 */
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

// Storage cho video
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "omexlive/videos",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "avi", "mkv"],
  },
});

// Storage cho thumbnail/avatar
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "omexlive/images",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

export const uploadVideo = multer({ storage: videoStorage });
export const uploadImage = multer({ storage: imageStorage });
export const uploadVideoWithThumbnail = multer({
  storage: multer.memoryStorage(),
}).fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);
export default configureCloudinary;
