import { timingSafeEqual } from "node:crypto";

const safeCompare = (provided, expected) => {
  const left = Buffer.from(String(provided || ""));
  const right = Buffer.from(String(expected || ""));
  return left.length === right.length && timingSafeEqual(left, right);
};

const requireMediaService = (req, res, next) => {
  const expectedSecret = process.env.MEDIA_SERVICE_SECRET;
  const providedSecret = req.get("x-media-service-secret");

  if (!expectedSecret || !safeCompare(providedSecret, expectedSecret)) {
    return res.status(401).json({ message: "Unauthorized media service request" });
  }

  req.isMediaService = true;
  return next();
};

export default requireMediaService;
