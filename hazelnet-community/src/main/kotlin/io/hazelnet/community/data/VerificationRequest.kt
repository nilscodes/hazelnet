package io.hazelnet.community.data

import com.fasterxml.jackson.annotation.JsonCreator
import io.hazelnet.shared.data.BlockchainType

data class VerificationRequest @JsonCreator constructor(
    val blockchain: BlockchainType,
    val address: String,
    val externalAccountId: Long,
)
