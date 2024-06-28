package io.hazelnet.community.data.external.oura

import java.util.Date

data class OuraTxOutputAssetEvent(
    val date: Date,
    val transactionHash: String,
    val policyId: String,
    val assetNameHex: String,
    val datumHash: String?,
)