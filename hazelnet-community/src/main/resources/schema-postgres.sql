DROP TABLE IF EXISTS "physical_orders_items";
DROP TABLE IF EXISTS "physical_orders";
DROP TABLE IF EXISTS "claim_lists_snapshot_cardano";
DROP TABLE IF EXISTS "discord_claim_lists";
DROP TABLE IF EXISTS "claim_lists";
DROP TABLE IF EXISTS "physical_products";
DROP TABLE IF EXISTS "stake_snapshot_data_cardano";
DROP TABLE IF EXISTS "discord_poll_votes";
DROP TABLE IF EXISTS "discord_poll_options";
DROP TABLE IF EXISTS "discord_poll_required_roles";
DROP TABLE IF EXISTS "discord_polls";
DROP TABLE IF EXISTS "stake_snapshot_cardano";
DROP TABLE IF EXISTS "discord_whitelists_signup";
DROP TABLE IF EXISTS "discord_whitelists";
DROP TABLE IF EXISTS "discord_server_members";
DROP TABLE IF EXISTS "discord_settings";
DROP TABLE IF EXISTS "discord_policy_ids";
DROP TABLE IF EXISTS "discord_token_role_policies";
DROP TABLE IF EXISTS "discord_token_role_filters";
DROP TABLE IF EXISTS "discord_token_roles";
DROP TABLE IF EXISTS "discord_spo_roles";
DROP TABLE IF EXISTS "discord_spo";
DROP TABLE IF EXISTS "discord_payments";
DROP TABLE IF EXISTS "discord_billing";
DROP TABLE IF EXISTS "external_account_pings";
DROP TABLE IF EXISTS "discord_servers";
DROP TABLE IF EXISTS "verification_imports";
DROP TABLE IF EXISTS "verifications";
DROP TABLE IF EXISTS "premium_staked";
DROP TABLE IF EXISTS "external_accounts";
DROP TABLE IF EXISTS "account_settings";
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

CREATE TABLE "account_settings"
(
    "account_id"    bigint,
    "setting_name"  varchar(64),
    "setting_value" varchar(4096),
    UNIQUE ("account_id", "setting_name")
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
    "external_reference_id"   varchar(200)           NOT NULL,
    "external_reference_name" varchar(200),
    "registration_time"       timestamp,
    "account_type"            accounts_external_type NOT NULL,
    "account_id"              bigint,
    "premium"                 boolean                NOT NULL DEFAULT false
);

CREATE TABLE "external_account_pings"
(
    "ping_id"                    BIGSERIAL PRIMARY KEY,
    "sender_external_account_id" bigint       NOT NULL,
    "sent_from_server"           int,
    "recipient_account_id"       bigint       NOT NULL,
    "recipient_address"          varchar(150) NOT NULL,
    "sender_message"             varchar(320),
    "create_time"                timestamp    NOT NULL,
    "sent_time"                  timestamp,
    "reported"                   boolean      NOT NULL DEFAULT false
);

CREATE TABLE "premium_staked"
(
    "external_account_id" bigint    NOT NULL,
    "snapshot_time"       timestamp NOT NULL,
    "epoch"               int       NOT NULL,
    "active_stake"        bigint    NOT NULL,
    "paid_out"            boolean   NOT NULL DEFAULT false
);

CREATE TABLE "verifications"
(
    "verification_id"       BIGSERIAL PRIMARY KEY,
    "verification_amount"   bigint NOT NULL,
    "blockchain"            blockchain_type,
    "address"               varchar(150),
    "cardano_stake_address" varchar(60),
    "transaction_hash"      varchar(66),
    "external_account_id"   bigint,
    "valid_after"           timestamp,
    "valid_before"          timestamp,
    "confirmed"             boolean,
    "confirmed_at"          timestamp,
    "obsolete"              boolean,
    "succeeded_by"          bigint
);

CREATE TABLE "verification_imports"
(
    "verification_import_id" SERIAL PRIMARY KEY,
    "external_reference_id"  varchar(200)           NOT NULL,
    "account_type"           accounts_external_type NOT NULL,
    "verified_address"       varchar(150)           NOT NULL,
    "verification_source"    varchar(50)            NOT NULL
);

CREATE TABLE "discord_servers"
(
    "discord_server_id"   SERIAL PRIMARY KEY,
    "guild_id"            bigint UNIQUE NOT NULL,
    "guild_name"          varchar(100),
    "guild_owner"         bigint,
    "join_time"           timestamp,
    "guild_member_count"  int,
    "guild_member_update" timestamp,
    "owner_account_id"    bigint,
    "premium_until"       timestamp,
    "active"              boolean       NOT NULL DEFAULT true
);

CREATE TABLE "discord_billing"
(
    "billing_id"                SERIAL PRIMARY KEY,
    "discord_server_id"         int,
    "billing_time"              timestamp NOT NULL,
    "billing_amount"            bigint    NOT NULL,
    "billing_member_count"      int       NOT NULL,
    "billing_max_delegation"    bigint    NOT NULL,
    "billing_actual_delegation" bigint    NOT NULL
);

CREATE TABLE "discord_payments"
(
    "payment_id"        SERIAL PRIMARY KEY,
    "discord_server_id" int,
    "payment_time"      timestamp NOT NULL,
    "payment_amount"    bigint    NOT NULL,
    "transaction_hash"  varchar(66),
    "billing_id"        int
);

CREATE TABLE "discord_incoming_payments"
(
    "incoming_payment_id" SERIAL PRIMARY KEY,
    "receiving_address"   varchar(150) NOT NULL,
    "payment_amount"      bigint       NOT NULL,
    "discord_server_id"   int,
    "valid_after"         timestamp    NOT NULL,
    "valid_before"        timestamp    NOT NULL
);

CREATE TABLE "discord_server_members"
(
    "discord_server_id"   int,
    "external_account_id" bigint,
    "join_time"           timestamp,
    "premium_support"     boolean NOT NULL DEFAULT false
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
    "discord_token_role_id"  bigserial primary key,
    "discord_server_id"      int,
    "policy_id"              varchar(56),
    "asset_fingerprint"      varchar,
    "minimum_token_quantity" bigint,
    "maximum_token_quantity" bigint,
    "custom_rule"            varchar(26),
    "owned_for_duration"     int,
    "discord_role_id"        bigint,
    "aggregation_type"       smallint NOT NULL DEFAULT 0
);

CREATE TABLE "discord_token_role_policies"
(
    "discord_token_role_id" bigint,
    "policy_id"             varchar(56) NOT NULL,
    "asset_fingerprint"     varchar(44) NULL,
    UNIQUE ("discord_token_role_id", "policy_id", "asset_fingerprint")
);

CREATE TABLE "discord_token_role_filters"
(
    "metadata_filter_id"    BIGSERIAL PRIMARY KEY,
    "discord_token_role_id" bigint,
    "attribute_name"        varchar(64),
    "operator"              varchar(16),
    "attribute_value"       varchar(128)
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
    "discord_whitelist_id"     BIGSERIAL PRIMARY KEY,
    "discord_server_id"        int          NOT NULL,
    "external_account_id"      bigint       NOT NULL,
    "whitelist_creation"       timestamp    NOT NULL,
    "whitelist_name"           varchar(30)  NOT NULL,
    "whitelist_displayname"    varchar(256) NOT NULL,
    "whitelist_signup_after"   timestamp,
    "whitelist_signup_until"   timestamp,
    "whitelist_launch_date"    timestamp,
    "whitelist_max_users"      int,
    "whitelist_closed"         boolean      NOT NULL DEFAULT false,
    "required_discord_role_id" bigint,
    "shared_with_discord_server" int,
    UNIQUE ("discord_server_id", "whitelist_name")
);

CREATE TABLE "discord_whitelists_signup"
(
    "discord_whitelist_id"      bigint,
    "external_account_id"       bigint,
    "address"                   varchar(150),
    "signup_time"               timestamp NOT NULL,
    UNIQUE("discord_whitelist_id", "external_account_id")
);

CREATE TABLE "discord_polls"
(
    "discord_poll_id"      SERIAL PRIMARY KEY,
    "discord_server_id"    int           NOT NULL,
    "external_account_id"  bigint        NOT NULL,
    "discord_channel_id"   bigint        NULL,
    "discord_message_id"   bigint        NULL,
    "poll_name"            varchar(30)   NOT NULL,
    "poll_displayname"     varchar(256)  NOT NULL,
    "poll_description"     varchar(4096) NOT NULL,
    "poll_creation"        timestamp     NOT NULL,
    "poll_open_after"      timestamp     NOT NULL,
    "poll_open_until"      timestamp     NOT NULL,
    "poll_results_visible" boolean       NOT NULL DEFAULT true,
    "poll_weighted"        boolean       NOT NULL DEFAULT false,
    "poll_multiple_votes"  boolean       NOT NULL DEFAULT false,
    "poll_archived"        boolean       NOT NULL DEFAULT false,
    "poll_snapshot_id"     int,
    UNIQUE ("discord_server_id", "poll_name")
);

CREATE TABLE "discord_poll_required_roles"
(
    "discord_poll_id" int,
    "discord_role_id" bigint NOT NULL
);

CREATE TABLE "discord_poll_options"
(
    "discord_poll_option_id" BIGSERIAL PRIMARY KEY,
    "discord_poll_id"        int,
    "option_reaction_id"     bigint,
    "option_reaction_name"   varchar(256),
    "option_text"            varchar
);

CREATE TABLE "discord_poll_votes"
(
    "external_account_id"    bigint,
    "discord_poll_option_id" bigint,
    "vote_weight"            bigint    NOT NULL,
    "vote_time"              timestamp NOT NULL
);

CREATE TABLE "stake_snapshot_cardano"
(
    "snapshot_id"                SERIAL PRIMARY KEY,
    "snapshot_created"           timestamp,
    "snapshot_time"              timestamp   NOT NULL,
    "snapshot_policy_id"         varchar(56) NOT NULL,
    "snapshot_asset_fingerprint" varchar,
    "snapshot_taken"             boolean     NOT NULL DEFAULT false
);

CREATE TABLE "stake_snapshot_data_cardano"
(
    "snapshot_id"    int,
    "stake_address"  varchar(60) NOT NULL,
    "token_quantity" bigint      NOT NULL,
    UNIQUE("snapshot_id", "stake_address")
);

CREATE TABLE "discord_claim_lists"
(
    "discord_server_id" int,
    "claim_list_id"     int
);

CREATE TABLE "claim_lists"
(
    "claim_list_id"          SERIAL PRIMARY KEY,
    "claim_list_name"        varchar(30)  NOT NULL,
    "claim_list_displayname" varchar(256) NOT NULL,
    "claim_list_description" varchar(2000) NULL,
    "claim_list_creation"    timestamp    NOT NULL
);

CREATE TABLE "physical_orders"
(
    "order_id"            SERIAL PRIMARY KEY,
    "external_account_id" bigint,
    "claim_list_id"       int,
    "order_creation"      timestamp    NOT NULL,
    "ship_to_name"        varchar(200) NOT NULL,
    "country"             varchar(100) NOT NULL,
    "phone"               varchar(30)  NULL,
    "zip"                 varchar(30)  NOT NULL,
    "city"                varchar(200) NOT NULL,
    "street"              varchar(500) NOT NULL,
    "processed"           boolean      NOT NULL DEFAULT false,
    "tracking_number"     varchar(200) NULL
);

CREATE TABLE "physical_orders_items"
(
    "order_id"          int,
    "product_id"        int,
    "product_count"     int NOT NULL DEFAULT 1,
    "product_variation" jsonb
);

CREATE TABLE "claim_lists_snapshot_cardano"
(
    "claim_list_id"           int,
    "stake_address"           varchar(60) NOT NULL,
    "claimable_product_id"    int,
    "claimable_product_count" int,
    "claimed_in_order"        int NULL
);

CREATE TABLE "physical_products"
(
    "product_id"         SERIAL PRIMARY KEY,
    "product_name"       varchar(200) NOT NULL,
    "product_variations" jsonb
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

ALTER TABLE "account_settings" ADD FOREIGN KEY ("account_id") REFERENCES "accounts" ("account_id") ON DELETE CASCADE;

ALTER TABLE "external_accounts" ADD FOREIGN KEY ("account_id") REFERENCES "accounts" ("account_id");

ALTER TABLE "external_account_pings" ADD FOREIGN KEY ("sender_external_account_id") REFERENCES "external_accounts" ("external_account_id") ON DELETE CASCADE;

ALTER TABLE "external_account_pings" ADD FOREIGN KEY ("sent_from_server") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "external_account_pings" ADD FOREIGN KEY ("recipient_account_id") REFERENCES "accounts" ("account_id") ON DELETE CASCADE;

ALTER TABLE "premium_staked" ADD FOREIGN KEY ("external_account_id") REFERENCES "external_accounts" ("external_account_id") ON DELETE CASCADE;

ALTER TABLE "verifications" ADD FOREIGN KEY ("external_account_id") REFERENCES "external_accounts" ("external_account_id") ON DELETE CASCADE;

ALTER TABLE "discord_servers" ADD FOREIGN KEY ("owner_account_id") REFERENCES "accounts" ("account_id");

ALTER TABLE "discord_billing" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE RESTRICT;

ALTER TABLE "discord_payments" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE RESTRICT;

ALTER TABLE "discord_payments" ADD FOREIGN KEY ("billing_id") REFERENCES "discord_billing" ("billing_id") ON DELETE SET NULL;

ALTER TABLE "discord_incoming_payments" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_spo" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_spo_roles" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_token_roles" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_token_role_policies" ADD FOREIGN KEY ("discord_token_role_id") REFERENCES "discord_token_roles" ("discord_token_role_id");

ALTER TABLE "discord_token_role_filters" ADD FOREIGN KEY ("discord_token_role_id") REFERENCES "discord_token_roles" ("discord_token_role_id") ON DELETE CASCADE;

ALTER TABLE "discord_policy_ids" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_settings" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_server_members" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_server_members" ADD FOREIGN KEY ("external_account_id") REFERENCES "external_accounts" ("external_account_id") ON DELETE CASCADE;

ALTER TABLE "discord_whitelists" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_whitelists" ADD FOREIGN KEY ("external_account_id") REFERENCES "external_accounts" ("external_account_id") ON DELETE RESTRICT;

ALTER TABLE "discord_whitelists" ADD FOREIGN KEY ("shared_with_discord_server") REFERENCES "discord_servers" ("discord_server_id");

ALTER TABLE "discord_whitelists_signup" ADD FOREIGN KEY ("discord_whitelist_id") REFERENCES "discord_whitelists" ("discord_whitelist_id") ON DELETE CASCADE;

ALTER TABLE "discord_whitelists_signup" ADD FOREIGN KEY ("external_account_id") REFERENCES "external_accounts" ("external_account_id") ON DELETE CASCADE;

ALTER TABLE "discord_polls" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_polls" ADD FOREIGN KEY ("external_account_id") REFERENCES "external_accounts" ("external_account_id") ON DELETE RESTRICT;

ALTER TABLE "discord_polls" ADD FOREIGN KEY ("poll_snapshot_id") REFERENCES "stake_snapshot_cardano" ("snapshot_id") ON DELETE RESTRICT;

ALTER TABLE "discord_poll_required_roles" ADD FOREIGN KEY ("discord_poll_id") REFERENCES "discord_polls" ("discord_poll_id") ON DELETE CASCADE;

ALTER TABLE "discord_poll_options" ADD FOREIGN KEY ("discord_poll_id") REFERENCES "discord_polls" ("discord_poll_id") ON DELETE CASCADE;

ALTER TABLE "discord_poll_votes" ADD FOREIGN KEY ("external_account_id") REFERENCES "external_accounts" ("external_account_id") ON DELETE RESTRICT;

ALTER TABLE "discord_poll_votes" ADD FOREIGN KEY ("discord_poll_option_id") REFERENCES "discord_poll_options" ("discord_poll_option_id") ON DELETE CASCADE;

ALTER TABLE "stake_snapshot_data_cardano" ADD FOREIGN KEY ("snapshot_id") REFERENCES "stake_snapshot_cardano" ("snapshot_id") ON DELETE CASCADE;

ALTER TABLE "discord_claim_lists" ADD FOREIGN KEY ("discord_server_id") REFERENCES "discord_servers" ("discord_server_id") ON DELETE CASCADE;

ALTER TABLE "discord_claim_lists" ADD FOREIGN KEY ("claim_list_id") REFERENCES "claim_lists" ("claim_list_id") ON DELETE CASCADE;

ALTER TABLE "physical_orders" ADD FOREIGN KEY ("external_account_id") REFERENCES "external_accounts" ("external_account_id") ON DELETE CASCADE;

ALTER TABLE "physical_orders" ADD FOREIGN KEY ("claim_list_id") REFERENCES "claim_lists" ("claim_list_id") ON DELETE CASCADE;

ALTER TABLE "physical_orders_items" ADD FOREIGN KEY ("order_id") REFERENCES "physical_orders" ("order_id") ON DELETE CASCADE;

ALTER TABLE "physical_orders_items" ADD FOREIGN KEY ("product_id") REFERENCES "physical_products" ("product_id") ON DELETE RESTRICT;

ALTER TABLE "claim_lists_snapshot_cardano" ADD FOREIGN KEY ("claim_list_id") REFERENCES "claim_lists" ("claim_list_id") ON DELETE CASCADE;

ALTER TABLE "claim_lists_snapshot_cardano" ADD FOREIGN KEY ("claimable_product_id") REFERENCES "physical_products" ("product_id") ON DELETE RESTRICT;

ALTER TABLE "claim_lists_snapshot_cardano" ADD FOREIGN KEY ("claimed_in_order") REFERENCES "physical_orders" ("order_id") ON DELETE SET NULL;

CREATE INDEX ON "verification_imports" ("external_reference_id");