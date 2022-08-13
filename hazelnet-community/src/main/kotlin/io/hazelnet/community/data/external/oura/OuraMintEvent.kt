package io.hazelnet.community.data.external.oura

import java.util.*

data class OuraMintEvent constructor(
    val date: Date,
    val transactionHash: String,
    val policyId: String,
    val assetNameHex: String,
    val quantity: Long,
)