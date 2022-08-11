package io.hazelnet.marketplace.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import java.util.*

data class SalesInfo @JsonCreator constructor(
    @JsonProperty("policyId")
    val policyId: String,
    @JsonProperty("assetNameHex")
    val assetNameHex: String,
    @JsonProperty("source")
    val source: Marketplace,
    @JsonProperty("marketplaceAssetUrl")
    val marketplaceAssetUrl: String,
    @JsonProperty("price")
    val price: Long,
    @JsonProperty("saleDate")
    val saleDate: Date,
    @JsonProperty("type")
    val type: SalesType,
)

enum class SalesType {
    BUY,
    OFFER
}