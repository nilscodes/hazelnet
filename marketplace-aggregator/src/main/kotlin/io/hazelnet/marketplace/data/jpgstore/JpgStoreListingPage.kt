package io.hazelnet.marketplace.data.jpgstore

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty

data class JpgStoreListingPage @JsonCreator constructor(
    @JsonProperty("listings")
    val listings: List<JpgStoreListingInfo>,

    @JsonProperty("nextPageCursor")
    val nextPageCursor: String,
)