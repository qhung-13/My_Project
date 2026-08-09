import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]);
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "omexlive/videos",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "avi", "mkv"],
  },
});

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "omexlive/images",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const fileFilterFor = (allowedTypes, label) => (_req, file, callback) => {
  if (allowedTypes.has(file.mimetype)) return callback(null, true);
  const error = new Error(`Unsupported ${label} file type`);
  error.statusCode = 415;
  return callback(error);
};

export const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024, files: 1 },
  fileFilter: fileFilterFor(VIDEO_MIME_TYPES, "video"),
});

export const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: fileFilterFor(IMAGE_MIME_TYPES, "image"),
});

export { cloudinary };
export default configureCloudinary;
