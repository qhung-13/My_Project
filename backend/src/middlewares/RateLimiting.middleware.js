import rateLimit from "express-rate-limit";

// Rate limit chung cho toàn bộ API
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skip: (req) => /\/coins\/webhook(?:\?|$)/.test(req.originalUrl),
  message: { message: "Quá nhiều request, vui lòng thử lại sau." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit cho Auth — chặn brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Quá nhiều lần đăng nhập, vui lòng thử lại sau." },
});

// Rate limit cho Donate — chặn double-click
export const donateLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 1,
  // This middleware runs after `protect`, so rate-limit the authenticated
  // account instead of every user behind the same NAT/public IP together.
  keyGenerator: (req) => req.user._id.toString(),
  message: { message: "Vui lòng đợi trước khi donate tiếp." },
});

// Rate limit cho Upload — tránh spam upload
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  // Video upload also runs after `protect`; user-based limits avoid unrelated
  // accounts on shared university/corporate Wi-Fi throttling each other.
  keyGenerator: (req) => req.user._id.toString(),
  message: { message: "Quá nhiều lần upload, vui lòng thử lại sau." },
});
