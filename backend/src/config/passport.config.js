import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.model.js";

/**
 * Configure Passport.js with Google OAuth2 strategy
 * Must be called after dotenv.config() to access environment variables
 */
const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.NODE_ENV === "production"
            ? "https://my-project-5bd7.onrender.com/api/users/auth/google/callback"
            : "http://localhost:5000/api/users/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google account
          let user = await User.findOne({ googleId: profile.id });

          // If not, create a new user with Google profile data
          if (!user) {
            // 1. Calculate base username
            const baseUsername = profile.displayName
              .replace(/[^a-zA-Z0-9_]/g, "_")
              .toLowerCase();

            let username = baseUsername;
            let count = 0;

            // 2. Ensure it is unique
            while (await User.findOne({ username })) {
              count++;
              username = `${baseUsername}_${count}`;
            }

            // 3. Create the user using the unique 'username' variable
            user = await User.create({
              googleId: profile.id,
              username: username, // 
              email: profile.emails[0].value,
              avatar: profile.photos[0].value,
              isVerified: true,
            });
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
