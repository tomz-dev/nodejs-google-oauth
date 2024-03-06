export interface ITokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  id_token: string;
  token_type: string;
}

export interface IUserResponse {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}
