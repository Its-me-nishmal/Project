const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Students = require('../model/Students');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.CLIND_ID,
    clientSecret: process.env.CLINT_SECRET,
    callbackURL: process.env.CALL_BACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log("this" + profile);
        const exituser = await Students.findOne({ googleId: profile.id });
        if (exituser) {
            return done(null, exituser);
        }
        const name = profile.name.givenName;
        const newStudent = new Students({
            googleId: profile.id,
            name: name,
            email: profile.emails[0].value
        });
        const savedStudent = await newStudent.save();
        done(null, savedStudent);
    } catch (error) {
        console.error('Error in Google OAuth strategy:', error);
        done(error, false);
    }
}));

passport.serializeUser((user, done) => {
    console.log('Serializing user:', user);
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    Students.findById(id)
        .then((student) => {
            if (!student) {
                // Handle the case where the student is not found
                return done(null, false); // Pass null as the first argument to indicate no error
            }
            console.log(student);
            done(null, student);
        })
        .catch((error) => {
            // Handle any errors, including cast errors
            console.error('Error in deserialization:', error);
            done(error, false); // Pass the error as the first argument to indicate an error
        });
});

module.exports = passport;
