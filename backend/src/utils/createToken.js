import jwt from "jsonwebtoken";

/**
 * Generates a JSON Web Token (JWT) and sets it as a secure HTTP-only cookie
 *
 * @param {Object} res - Express response object
 * @param {string|ObjectId} userId - The unique identifier of the authenticated user
 * @returns {string} The generated JWT string
 */
const createToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  });

  return token;
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export default createToken;
