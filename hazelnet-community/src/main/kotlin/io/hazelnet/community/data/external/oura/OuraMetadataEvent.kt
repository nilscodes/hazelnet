package io.hazelnet.community.data.external.oura

import java.util.*

data class OuraMetadataEvent constructor(
    val date: Date,
    val transactionHash: String,
    val metadata: Map<String, Any>,
)
