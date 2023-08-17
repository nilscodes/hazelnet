package io.hazelnet.external.data

import com.fasterxml.jackson.annotation.JsonCreator
import io.hazelnet.shared.data.BlockchainType
import java.util.*

data class VerificationDto @JsonCreator constructor(
    val id: Long,
    val blockchain: BlockchainType,
    val address: String,
    val cardanoStakeAddress: String?,
    val transactionHash: String?,
    val externalAccount: Long,
    val validAfter: Date,
    val validBefore: Date,
    val confirmed: Boolean,
    val confirmedAt: Date?,
    val obsolete: Boolean,
    val succeededBy: Long? = null,
)
