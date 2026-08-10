import passport from "passport";
import "dotenv/config";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.model.js";

const backendPublicUrl = (
  process.env.BACKEND_PUBLIC_URL ||
  `http://localhost:${process.env.PORT || 5000}`
).replace(/\/+$/, "");

const googleCallbackUrl = `${backendPublicUrl}/api/v1/users/auth/google/callback`;

console.log("[OAuth] Google callback:", googleCallbackUrl);

export const isGoogleOAuthConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const configurePassport = () => {
  if (!isGoogleOAuthConfigured()) {
    console.warn(
      "Google OAuth disabled: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are missing",
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: googleCallbackUrl,
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.trim().toLowerCase();
          const isEmailVerified = profile._json?.email_verified !== false;
          if (!email || !isEmailVerified) {
            return done(
              new Error("Google account did not provide a verified email"),
              null,
            );
          }

          let user = await User.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });
          if (user && !user.isActive) {
            return done(new Error("This account has been disabled"), null);
          }
          if (!user) {
            const rawBase = profile.displayName || email.split("@")[0];
            const baseUsername =
              rawBase
                .replace(/[^a-zA-Z0-9_]/g, "_")
                .toLowerCase()
                .slice(0, 24) || "user";
            let username = baseUsername;
            let count = 0;
            while (await User.exists({ username })) {
              count += 1;
              username = `${baseUsername}_${count}`.slice(0, 30);
            }
            user = await User.create({
              googleId: profile.id,
              username,
              email,
              avatar: profile.photos?.[0]?.value || null,
              isVerified: true,
            });
          } else {
            let changed = false;
            if (!user.googleId) {
              user.googleId = profile.id;
              changed = true;
            }
            if (!user.isVerified) {
              user.isVerified = true;
              changed = true;
            }
            if (changed) await user.save();
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      },
    ),
  );
};

export default configurePassport;
