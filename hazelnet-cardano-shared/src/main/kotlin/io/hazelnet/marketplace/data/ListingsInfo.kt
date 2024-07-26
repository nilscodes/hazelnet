package io.hazelnet.marketplace.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import java.util.*

data class ListingsInfo @JsonCreator constructor(
    @JsonProperty("policyId")
    val policyId: String,
    @JsonProperty("assetNameHex")
    val assetNameHex: String,
    @JsonProperty("source")
    val source: Marketplace,
    @JsonProperty("marketplaceAssetUrl")
    val marketplaceAssetUrl: String,
    @JsonProperty("imageUrl")
    val imageUrl: String? = null,
    @JsonProperty("price")
    val price: Long,
    @JsonProperty("listingDate")
    val listingDate: Date,
    @JsonProperty("globalMarketplaceTracking")
    val globalMarketplaceTracking: Boolean = false,
)