package io.hazelnet.community.data

import io.hazelnet.shared.data.BlockchainType
import java.util.Date

data class VerificationDto(
    val id: Long? = null,
    val externalAccountId: Long,
    val address: String,
    val amount: Long = 0,
    val blockchain: BlockchainType,
    val cardanoStakeAddress: String? = null,
    val transactionHash: String? = null,
    val validAfter: Date,
    val validBefore: Date,
    val confirmed: Boolean,
    val obsolete: Boolean,
    val confirmedAt: Date?,
    val succeededBy: Long? = null,
)
