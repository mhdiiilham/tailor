-- Tailor only uses Google to sign in, so stored OAuth tokens are cleared. New sign-ins
-- no longer save them (see src/infrastructure/auth/oauthTokens.ts).
UPDATE "account"
SET "access_token" = NULL,
    "refresh_token" = NULL,
    "id_token" = NULL,
    "access_token_expires_at" = NULL,
    "refresh_token_expires_at" = NULL;
