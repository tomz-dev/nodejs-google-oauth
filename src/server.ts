import "module-alias/register";
import "dotenv/config";
import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import userModel from "@/models/User";
import mongoose from "mongoose";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import jwt from "jsonwebtoken";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import cookieParser from "cookie-parser";

const {
  PORT = 3000,
  GOOGLE_OAUTH_REDIRECT_URL,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  TOKEN_SECRET_KEY,
} = process.env;

const app = express();

//# middleware
app.use(passport.initialize());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//# extract token from cookie
const extractCookie = (req: express.Request) => {
  let token: string = "";

  if (req.cookies && req.cookies["token"]) {
    token = req.cookies["token"];
  }

  return token;
};

//# set up passport with google
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
      callbackURL: GOOGLE_OAUTH_REDIRECT_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, reFreshToken, profile, done) => {
      const subProfile = profile._json;
      const email = subProfile["email"];

      if (!email) {
        return done("dont exist emai", false);
      }

      const user = await userModel.findOne({ email });

      if (user) {
        done(null, user);
      } else {
        if (!profile!.emails![0].verified) {
          return done("not verified", false);
        }
        //create new user
        const user = await userModel.create({
          ...subProfile,
          googleId: profile.id,
        });
        done(null, user);
      }
    }
  )
);

//# set up passport with JWT
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: extractCookie,
      secretOrKey: TOKEN_SECRET_KEY!,
    },
    async (jwt_payload, done) => {
      const currentUser = await userModel.findById(jwt_payload._id);
      console.log("🚀 ~ currentUser:", currentUser);

      if (!currentUser) {
        return done("Unauthorized", false);
      }

      done(null, currentUser);
    }
  )
);

//# start connect db
mongoose.connect(process.env.MONGO_URI!).then(() => {
  console.log("Connect DB Success");

  //# routes
  app.get(
    "/login/google",
    passport.authenticate("google", {
      scope: ["email", "profile"],
    })
  );

  app.get(
    "/api/sessions/oauth/google",
    passport.authenticate("google", { session: false }),
    async (req, res) => {
      const user: any = req.user;
      if (user) {
        const expiresIn = 60 * 60 * 24;
        const token = jwt.sign(
          {
            email: user.email,
            _id: user._id,
          },
          TOKEN_SECRET_KEY!,
          { expiresIn }
        );

        res.cookie("token", token, {
          maxAge: expiresIn,
          path: "/",
          secure: false,
        });
        res.status(200).json("OK");

        return;
      }
      res.sendStatus(500);
    }
  );

  app.get(
    "/profile",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
      return res.json(req.user);
    }
  );

  app.use((err: any, req: any, res: any, next: any) => {
    res.json(err);
  });

  app.listen(PORT, () => {
    console.log(`Server is running in port ${PORT}`);
  });
});
