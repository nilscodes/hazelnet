DROP TABLE IF EXISTS "discord_whitelists_signup";
DROP TABLE IF EXISTS "discord_whitelists";
DROP TABLE IF EXISTS "discord_server_members";
DROP TABLE IF EXISTS "discord_settings";
DROP TABLE IF EXISTS "discord_policy_ids";
DROP TABLE IF EXISTS "discord_token_roles";
DROP TABLE IF EXISTS "discord_spo_roles";
DROP TABLE IF EXISTS "discord_spo";
DROP TABLE IF EXISTS "discord_servers";
DROP TABLE IF EXISTS "verifications";
DROP TABLE IF EXISTS "external_accounts";
DROP TABLE IF EXISTS "accounts";
DROP TABLE IF EXISTS "global_settings";
DROP TABLE IF EXISTS "oauth2_authorization";

DROP TYPE IF EXISTS "accounts_external_type";
DROP TYPE IF EXISTS "blockchain_type";

CREATE TYPE "accounts_external_type" AS ENUM (
    'DISCORD'
);

CREATE TYPE "blockchain_type" AS ENUM (
    'CARDANO',
    'ETHEREUM'
);

CREATE TABLE "accounts"
(
    "account_id" BIGSERIAL PRIMARY KEY
);

CREATE TABLE "global_settings"
(
    "setting_id"    SERIAL PRIMARY KEY,
    "setting_name"  varchar(64) UNIQUE,
    "setting_value" varchar(4096)
);

CREATE TABLE "external_accounts"
(
    "external_account_id"     BIGSERIAL PRIMARY KEY,
    "external_reference_id"   varchar(200) NOT NULL,
    "external_reference_name" varchar(200),
    "registration_time"       timestamp,
    "account_type"            accounts_external_type NOT NULL,
    "account_id"              bigint
);


CREATE TABLE "verifications"
(
    "verification_id"     BIGSERIAL PRIMARY KEY,
    "verification_amount" bigint NOT NULL,
    "blockchain"          blockchain_type,
    "address"             varchar(150),
    "cardano_stake_address"       varchar(60),
    "transaction_hash"    varchar(66),
    "external_account_id" bigint,
    "valid_after"         timestamp,
    "valid_before"        timestamp,
    "confirmed"           boolean,
    "confirmed_at"        timestamp,
    "obsolete"            boolean
);

CREATE TABLE "discord_servers"
(
    "discord_server_id"  SERIAL PRIMARY KEY,
    "guild_id"           bigint UNIQUE NOT NULL,
    "guild_name"         varchar(100),
    "guild_owner"        bigint,
    "join_time"          timestamp,
    "guild_member_count" int,
    "owner_account_id"   bigint
);

CREATE TABLE "discord_server_members"
(
    "discord_server_id"   int,
    "external_account_id" bigint,
    "join_time"           timestamp
);

CREATE TABLE "discord_spo"
(
    "discord_server_id" int,
    "stakepool_hash"      varchar(56),
    UNIQUE ("discord_server_id", "stakepool_hash")
);

CREATE TABLE "discord_spo_roles"
(
    "discord_spo_role_id"   bigserial primary key,
    "discord_server_id" int,
    "stakepool_hash"    varchar(56),
    "minimum_stake"     bigint not null,
    "discord_role_id"   bigint not null,
    UNIQUE ("discord_server_id", "discord_role_id", "stakepool_hash")
);

CREATE TABLE "discord_token_roles"
(
    "discord_token_role_id"   bigserial primary key,
    "discord_server_id"      int,
    "policy_id"              varchar(56),
    "minimum_token_quantity" bigint,
    "custom_rule"            varchar(26),
    "owned_for_duration"     int,
    "discord_role_id"        bigint,
    UNIQUE ("discord_server_id", "policy_id", "discord_role_id")
);

CREATE TABLE "discord_policy_ids"
(
    "discord_server_id" int,
    "policy_id"         varchar(56),
    "project_name"      varchar(256),
    UNIQUE ("discord_server_id", "policy_id")
);

CREATE TABLE "discord_settings"
(
    "discord_server_id" int,
    "setting_name"      varchar(64),
    "setting_value"     varchar(4096),
    UNIQUE ("discord_server_id", "setting_name")
);

CREATE TABLE "discord_whitelists"
(
    "discord_whitelist_id" BIGSERIAL PRIMARY KEY,
    "discord_server_id"         int,
    "whitelist_name"            varchar(30) NOT NULL,
    "whitelist_displayname"     varchar(256) NOT NULL,
    "whitelist_signup_after"    timestamp,
    "whitelist_signup_until"    timestamp,
    "whitelist_max_users"       int,
    "required_discord_role_id"  bigint,
    UNIQUE("discord_server_id", "whitelist_name", "required_discord_role_id")
);

CREATE TABLE "discord_whitelists_signup"
(
    "discord_whitelist_id"      bigint,
    "external_account_id"       bigint,
    "address"                   varchar(150),
    "signup_time"               timestamp NOT NULL,
    UNIQUE("discord_whitelist_id", "external_account_id")
);

CREATE TABLE "oauth2_authorization"
(
    id                            varchar(100) NOT NULL PRIMARY KEY,
    registered_client_id          varchar(100) NOT NULL,
    principal_name                varchar(200) NOT NULL,
    authorization_grant_type      varchar(100) NOT NULL,
    attributes                    varchar(4000) DEFAULT NULL,
    state                         varchar(500)  DEFAULT NULL,
    authorization_code_value      bytea          DEFAULT NULL,
    authorization_code_issued_at  timestamp     DEFAULT NULL,
    authorization_code_expires_at timestamp     DEFAULT NULL,
    authorization_code_metadata   varchar(2000) DEFAULT NULL,
    access_token_value            bytea          DEFAULT NULL,
    access_token_issued_at        timestamp     DEFAULT NULL,
    access_token_expires_at       timestamp     DEFAULT NULL,
    access_token_metadata         varchar(2000) DEFAULT NULL,
    access_token_type             varchar(100)  DEFAULT NULL,
    access_token_scopes           varchar(1000) DEFAULT NULL,
    oidc_id_token_value           bytea          DEFAULT NULL,
    oidc_id_token_issued_at       timestamp     DEFAULT NULL,
    oidc_id_token_expires_at      timestamp     DEFAULT NULL,
    oidc_id_token_metadata        varchar(2000) DEFAULT NULL,
    refresh_token_value           bytea          DEFAULT NULL,
    refresh_token_issued_at       timestamp     DEFAULT NULL,
    refresh_token_expires_at      timestamp     DEFAULT NULL,
    refresh_token_metadata        varchar(2000) DEFAULT NULL
);

ALTER TABLE "external_accounts" ADD FOREIGN KEY ("account_id") REFERENCES "accounts" ("account_id");

ALTER TABLE "verifications" ADD FOREIGN KEY ("external_account_id") REFERENCES "external_accounts" ("external_account_id") ON DELETE CASCADE;

ALTER TABLE "discord_servers" ADD FOREIGN KEY ("owner_account_id") REFERENCES "accounts" ("account_id");

ALTER TABLE "discord_spo" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_spo_roles" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_token_roles" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_policy_ids" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_settings" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_server_members" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_server_members" ADD FOREIGN KEY ("external_account_id") REFERENCES "external_accounts" ("external_account_id") ON DELETE CASCADE;

ALTER TABLE "discord_whitelists" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_whitelists_signup" ADD FOREIGN KEY ("discord_whitelist_id") REFERENCES "discord_whitelists" ("discord_whitelist_id") ON DELETE CASCADE;

ALTER TABLE "discord_whitelists_signup" ADD FOREIGN KEY ("external_account_id") REFERENCES "external_accounts" ("external_account_id") ON DELETE CASCADE;