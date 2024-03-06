import "module-alias/register";
import "dotenv/config";
import express from "express";
import axios from "axios";
import UserService from "@/services/user.service";
import bodyParser from "body-parser";
import userModel from "@/models/User";
import mongoose from "mongoose";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport = require("passport");
const {
  PORT = 3000,
  GOOGLE_OAUTH_REDIRECT_URL,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
} = process.env;

const app = express();

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
      callbackURL: GOOGLE_OAUTH_REDIRECT_URL,
      passReqToCallback: true,
    },
    (req, accessToken, reFreshToken, profile, done) => {
      console.log("running");
      console.log("accessToken", accessToken);
    }
  )
);

app.use(passport.initialize());

mongoose.connect(process.env.MONGO_URI!).then(() => {
  console.log("Connect DB Success");

  const userService = new UserService();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get(
    "/login/google",
    passport.authenticate("google", {
      scope: ["email", "profile"],
    }),
    (req, res) => {
      res.json("ok");
    }
  );

  app.get("/api/sessions/oauth/google", async (req, res) => {
    try {
      const code = req.query["code"] as string;
      const { id_token, access_token } = await userService.getGoogleOAuthToken(
        code
      );
      const user = await userService.getGoogleUser(id_token, access_token);

      if (!user["verified_email"]) {
        res.status(403).json("Email is not verified");
      }

      await userModel.create(user);
      res.sendStatus(201);
    } catch (err) {
      res.json(err);
    }
  });

  app.get("/users", async (req, res) => {
    const result = await userModel.find();
    res.json(result);
  });

  app.listen(PORT, () => {
    console.log(`Server is running in port ${PORT}`);
  });
});
