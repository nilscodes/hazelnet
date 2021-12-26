package io.hazelnet.community.data

import com.fasterxml.jackson.annotation.JsonCreator

data class VerificationRequest @JsonCreator constructor(
    val blockchain: BlockchainType,
    val address: String,
    val externalAccountId: Long
)
