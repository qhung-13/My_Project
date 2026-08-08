import jwt from "jsonwebtoken";

export const getAuthCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };
};

export const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });

const createToken = (res, userId) => {
  const token = generateToken(userId);
  res.cookie("jwt", token, {
    ...getAuthCookieOptions(),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return token;
};

export default createToken;
