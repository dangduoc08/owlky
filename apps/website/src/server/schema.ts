import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/*
 * The accounts database (ADR-0071 § 5–6), one Drizzle schema for Postgres (Neon in production,
 * PGlite locally and in tests). The Better Auth tables follow what its Drizzle generator writes
 * for this configuration (core, `jwt` and `mcp`; its own sign-in rate limits stay in memory, so
 * no IP address is written); Better Auth checks them
 * at run time and refuses to start on a mismatch. Owlky's own tables come last.
 *
 * Every row that belongs to a person references `user.id` with `on delete cascade`: deleting an
 * account removes its rows (ADR-0071 § 6), never hides them. Migrations: `pnpm db:generate`
 * (drizzle-kit) writes `drizzle/*.sql`; the app applies them at start-up.
 */

const at = (name: string) => timestamp(name, { withTimezone: true });

// ── Better Auth: core ──────────────────────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: at("created_at").defaultNow().notNull(),
  updatedAt: at("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  // Owlky's columns. Better Auth doesn't know them, so nothing a client sends through its
  // endpoints can set them; the account endpoints (account-plugin.ts) do.
  /** Product and marketing email: an unticked opt-in (ADR-0071 § 6). */
  marketingOptIn: boolean("marketing_opt_in").default(false).notNull(),
  /** When the opt-in was last given or withdrawn; null while never given. */
  marketingOptInAt: at("marketing_opt_in_at"),
  /** Features the account may use beyond the free ones (ADR-0071 § 9). Empty for everyone now. */
  entitlements: text("entitlements").array().default([]).notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: at("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: at("created_at").defaultNow().notNull(),
    updatedAt: at("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: at("access_token_expires_at"),
    refreshTokenExpiresAt: at("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: at("created_at").defaultNow().notNull(),
    updatedAt: at("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: at("expires_at").notNull(),
    createdAt: at("created_at").defaultNow().notNull(),
    updatedAt: at("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ── Better Auth: jwt (the keys that sign MCP access tokens) ────────────────────────────────────

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  /** Encrypted with the auth secret by the jwt plugin. */
  privateKey: text("private_key").notNull(),
  createdAt: at("created_at").notNull(),
  expiresAt: at("expires_at"),
  alg: text("alg"),
  crv: text("crv"),
});

// ── Better Auth: mcp (OAuth 2.1 authorization server) ──────────────────────────────────────────

export const oauthClient = pgTable(
  "oauth_client",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret"),
    clientDiscoveryId: text("client_discovery_id"),
    disabled: boolean("disabled").default(false),
    skipConsent: boolean("skip_consent"),
    enableEndSession: boolean("enable_end_session"),
    subjectType: text("subject_type"),
    scopes: text("scopes").array(),
    clientCredentialsScopes: text("client_credentials_scopes").array().default([]),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    createdAt: at("created_at"),
    updatedAt: at("updated_at"),
    name: text("name"),
    uri: text("uri"),
    icon: text("icon"),
    contacts: text("contacts").array(),
    tos: text("tos"),
    policy: text("policy"),
    softwareId: text("software_id"),
    softwareVersion: text("software_version"),
    softwareStatement: text("software_statement"),
    redirectUris: text("redirect_uris").array().notNull(),
    postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
    backchannelLogoutUri: text("backchannel_logout_uri"),
    backchannelLogoutSessionRequired: boolean("backchannel_logout_session_required"),
    tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
    applicationType: text("application_type"),
    jwks: text("jwks"),
    jwksUri: text("jwks_uri"),
    grantTypes: text("grant_types").array(),
    responseTypes: text("response_types").array(),
    requirePKCE: boolean("require_pkce"),
    dpopBoundAccessTokens: boolean("dpop_bound_access_tokens").default(false),
    referenceId: text("reference_id"),
    metadata: jsonb("metadata"),
  },
  (table) => [index("oauthClient_userId_idx").on(table.userId)],
);

export const oauthResource = pgTable("oauth_resource", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  name: text("name").notNull(),
  accessTokenTtl: integer("access_token_ttl"),
  refreshTokenTtl: integer("refresh_token_ttl"),
  signingAlgorithm: text("signing_algorithm"),
  signingKeyId: text("signing_key_id"),
  allowedScopes: text("allowed_scopes").array(),
  customClaims: jsonb("custom_claims"),
  dpopBoundAccessTokensRequired: boolean("dpop_bound_access_tokens_required").default(false),
  disabled: boolean("disabled").default(false),
  createdAt: at("created_at"),
  updatedAt: at("updated_at"),
  policyVersion: integer("policy_version").default(1),
  metadata: jsonb("metadata"),
});

export const oauthClientResource = pgTable(
  "oauth_client_resource",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => oauthResource.identifier, { onDelete: "cascade" }),
    metadata: jsonb("metadata"),
    createdAt: at("created_at"),
  },
  (table) => [
    uniqueIndex("oauthClientResource_clientId_resourceId_uidx").on(
      table.clientId,
      table.resourceId,
    ),
    index("oauthClientResource_clientId_idx").on(table.clientId),
    index("oauthClientResource_resourceId_idx").on(table.resourceId),
  ],
);

export const oauthRefreshToken = pgTable(
  "oauth_refresh_token",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => session.id, { onDelete: "set null" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    authorizationCodeId: text("authorization_code_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    expiresAt: at("expires_at"),
    createdAt: at("created_at"),
    revoked: at("revoked"),
    rotatedAt: at("rotated_at"),
    rotationReplayResponse: text("rotation_replay_response"),
    rotationReplayExpiresAt: at("rotation_replay_expires_at"),
    authTime: at("auth_time"),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    index("oauthRefreshToken_clientId_idx").on(table.clientId),
    index("oauthRefreshToken_sessionId_idx").on(table.sessionId),
    index("oauthRefreshToken_userId_idx").on(table.userId),
    index("oauthRefreshToken_authorizationCodeId_idx").on(table.authorizationCodeId),
  ],
);

export const oauthAccessToken = pgTable(
  "oauth_access_token",
  {
    id: text("id").primaryKey(),
    token: text("token").unique(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => session.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    authorizationCodeId: text("authorization_code_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    refreshId: text("refresh_id").references(() => oauthRefreshToken.id, { onDelete: "cascade" }),
    expiresAt: at("expires_at"),
    createdAt: at("created_at"),
    revoked: at("revoked"),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    index("oauthAccessToken_clientId_idx").on(table.clientId),
    index("oauthAccessToken_sessionId_idx").on(table.sessionId),
    index("oauthAccessToken_userId_idx").on(table.userId),
    index("oauthAccessToken_authorizationCodeId_idx").on(table.authorizationCodeId),
    index("oauthAccessToken_refreshId_idx").on(table.refreshId),
  ],
);

export const oauthConsent = pgTable(
  "oauth_consent",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    scopes: text("scopes").array().notNull(),
    createdAt: at("created_at"),
    updatedAt: at("updated_at"),
  },
  (table) => [
    index("oauthConsent_clientId_idx").on(table.clientId),
    index("oauthConsent_userId_idx").on(table.userId),
  ],
);

export const oauthClientAssertion = pgTable("oauth_client_assertion", {
  id: text("id").primaryKey(),
  expiresAt: at("expires_at").notNull(),
});

// ── Owlky ──────────────────────────────────────────────────────────────────────────────────────

/** Personal access tokens (ADR-0071 § 4): only a SHA-256 hash of the secret is stored. */
export const personalAccessToken = pgTable(
  "personal_access_token",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** The person's label ("Laptop", "CI"). */
    name: text("name").notNull(),
    /** The first characters of the token, shown in the list to tell tokens apart. */
    prefix: text("prefix").notNull(),
    /** Hex SHA-256 of the whole token. */
    hash: text("hash").notNull().unique(),
    /** Space-separated, like OAuth scopes. `mcp` is the only one now. */
    scopes: text("scopes").notNull(),
    createdAt: at("created_at").defaultNow().notNull(),
    lastUsedAt: at("last_used_at"),
    /** Null: never expires. */
    expiresAt: at("expires_at"),
  },
  (table) => [index("personal_access_token_user_idx").on(table.userId)],
);

/**
 * MCP use per account (ADR-0071 § 6–7): the fixed rate-limit window and the last call. One row
 * per account, written by one upsert per request.
 */
export const mcpUsage = pgTable("mcp_usage", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Start of the current window (Unix seconds, a multiple of the window length). */
  windowStart: bigint("window_start", { mode: "number" }).notNull(),
  /** Requests counted in that window. */
  windowCount: integer("window_count").notNull(),
  lastUsedAt: at("last_used_at").notNull(),
});

/** Calls per tool and account: counts and the last call only, never arguments or results. */
export const mcpToolUsage = pgTable(
  "mcp_tool_usage",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tool: text("tool").notNull(),
    calls: integer("calls").notNull(),
    lastUsedAt: at("last_used_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.tool] })],
);

/** Every table, for the Better Auth adapter and drizzle-kit. */
export const schema = {
  user,
  session,
  account,
  verification,
  jwks,
  oauthClient,
  oauthResource,
  oauthClientResource,
  oauthRefreshToken,
  oauthAccessToken,
  oauthConsent,
  oauthClientAssertion,
  personalAccessToken,
  mcpUsage,
  mcpToolUsage,
};
