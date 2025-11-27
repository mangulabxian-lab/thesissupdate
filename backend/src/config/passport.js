// config/passport.js - UPDATED WITH PROFILE PICTURE SUPPORT
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

// Serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log("✅ Initializing Google OAuth strategy...");
  
  const callbackURL = process.env.NODE_ENV === 'production' 
    ? `${process.env.BACKEND_URL}/api/auth/google/callback`
    : `http://localhost:3000/api/auth/google/callback`;
  
  console.log('🔗 Google Callback URL:', callbackURL);
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔄 ========== GOOGLE OAUTH START ==========');
      console.log('🔍 Google OAuth Profile Received - ID:', profile.id);
      console.log('📧 Email from Google:', profile.emails[0].value);
      console.log('👤 Name from Google:', profile.displayName);
      console.log('🖼️ Profile Picture:', profile.photos?.[0]?.value);
      
      // 🚫 CRITICAL FIX: Only allow Gmail accounts
      if (!profile.emails[0].value.endsWith('@gmail.com')) {
        console.log('❌ BLOCKED: Non-Gmail account attempted:', profile.emails[0].value);
        return done(new Error('Only Gmail accounts are allowed'), null);
      }
      
      // 🚫 CRITICAL FIX: Check if user exists with this Google ID
      console.log('🔍 Checking database for Google ID:', profile.id);
      let user = await User.findOne({ googleId: profile.id });
      if (user) {
        console.log('✅ ALLOWED: Existing Google user found:', user.email);
        
        // ✅ UPDATE: Check if profile picture needs updating
        const googleProfilePicture = profile.photos?.[0]?.value;
        if (googleProfilePicture && user.profileImage !== googleProfilePicture) {
          user.profileImage = googleProfilePicture;
          await user.save();
          console.log('✅ Updated profile picture from Google');
        }
        
        console.log('🔄 ========== GOOGLE OAUTH END ==========');
        return done(null, user);
      }
      
      // 🚫 CRITICAL FIX: Check if user exists with this email (already registered)
      console.log('🔍 Checking database for email:', profile.emails[0].value);
      user = await User.findOne({ email: profile.emails[0].value });
      if (user) {
        console.log('✅ ALLOWED: Existing registered user found:', user.email);
        
        // Link Google ID to existing user AND save profile picture
        console.log('🔗 Linking Google ID to existing user');
        user.googleId = profile.id;
        
        // ✅ ADDED: Save Google profile picture
        const googleProfilePicture = profile.photos?.[0]?.value;
        if (googleProfilePicture) {
          user.profileImage = googleProfilePicture;
          console.log('✅ Saved Google profile picture');
        }
        
        await user.save();
        console.log('🔄 ========== GOOGLE OAUTH END ==========');
        return done(null, user);
      }
      
      // 🚫 CRITICAL FIX: DO NOT CREATE NEW USER - User must register first
      console.log('❌ BLOCKED: Unregistered Gmail attempted login:', profile.emails[0].value);
      console.log('💡 User must register first via email/password');
      console.log('🔄 ========== GOOGLE OAUTH END ==========');
      return done(new Error('This Gmail account is not registered. Please register first.'), null);
      
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      console.log('🔄 ========== GOOGLE OAUTH END ==========');
      return done(error, null);
    }
  }
));
  
  console.log("✅ Google OAuth strategy registered successfully");
} else {
  console.warn("⚠️  Google OAuth credentials not found. Google login disabled.");
}

module.exports = passport;