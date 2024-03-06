import {
  ITokenResponse,
  IUserResponse,
} from "@/interfaces/oauth-google.interface";
import axios from "axios";
import qs from "qs";

class UserService {
  private GOOGLE_OAUTH_REDIRECT_URL: string =
    process.env.GOOGLE_OAUTH_REDIRECT_URL!;
  private GOOGLE_CLIENT_SECRET: string = process.env.GOOGLE_CLIENT_SECRET!;
  private GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID!;

  getGoogleOAuthToken = async (code: string) => {
    const url = "https://oauth2.googleapis.com/token";

    const values = {
      code,
      client_id: this.GOOGLE_CLIENT_ID,
      client_secret: this.GOOGLE_CLIENT_SECRET,
      redirect_uri: this.GOOGLE_OAUTH_REDIRECT_URL,
      grant_type: "authorization_code",
    };

    const { data } = await axios.post<ITokenResponse>(url, values, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return data;
  };

  getGoogleUser = async (id_token: string, access_token: string) => {
    const { data } = await axios.get<IUserResponse>(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bear ${id_token}`,
        },
      }
    );
    return data;
  };
}

export default UserService;
