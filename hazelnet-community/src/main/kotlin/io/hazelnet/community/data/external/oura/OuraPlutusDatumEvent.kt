package io.hazelnet.community.data.external.oura

import java.util.*

data class OuraPlutusDatumEvent(
    val date: Date,
    val transactionHash: String,
    val datumHash: String,
    val plutusData: Map<String, Any>,
)
