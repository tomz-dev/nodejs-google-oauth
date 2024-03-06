import "module-alias/register";
import "dotenv/config";
import express from "express";
import axios from "axios";
import UserService from "@/services/user.service";
import bodyParser from "body-parser";
import userModel from "@/models/User";
import mongoose from "mongoose";

mongoose.connect(process.env.MONGO_URI!).then(() => {
  console.log("Connect DB Success");

  const userService = new UserService();

  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  const {
    PORT = 3000,
    GOOGLE_OAUTH_REDIRECT_URL,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CLIENT_ID,
  } = process.env;

  app.get("/login/google", (req, res) => {
    const ROOT_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      response_type: "code",

      redirect_uri: GOOGLE_OAUTH_REDIRECT_URL!,
      client_id: GOOGLE_CLIENT_ID!,
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
    };

    const qs = new URLSearchParams(options);

    const url = `${ROOT_URL}?${qs.toString()}`;
    res.send(url);
  });

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
