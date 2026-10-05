import { describe, expect, it } from "vitest";
import { withoutOAuthTokens } from "./oauthTokens";

describe("withoutOAuthTokens", () => {
  it("drops every Google token but keeps what identifies the account", () => {
    const account = {
      id: "a1",
      userId: "alice",
      providerId: "google",
      accountId: "1234",
      scope: "openid email profile",
      accessToken: "ya29.secret",
      refreshToken: "1//refresh",
      idToken: "eyJ.id.token",
      accessTokenExpiresAt: new Date(),
      refreshTokenExpiresAt: new Date(),
    };

    expect(withoutOAuthTokens(account)).toEqual({
      id: "a1",
      userId: "alice",
      providerId: "google",
      accountId: "1234",
      scope: "openid email profile",
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    });
  });

  it("also blanks tokens in a partial update", () => {
    expect(withoutOAuthTokens({ accessToken: "ya29.new", updatedAt: "now" })).toMatchObject({
      accessToken: null,
      refreshToken: null,
      updatedAt: "now",
    });
  });
});
