package io.hazelnet.community.data.discord

enum class TokenOwnershipAggregationType {
    ANY_POLICY_FILTERED_AND,
    ANY_POLICY_FILTERED_OR,
    ANY_POLICY_FILTERED_ONE_EACH,
    EVERY_POLICY_FILTERED_OR,
    ANY_POLICY_FILTERED_ALL_MATCHED,
}