package io.hazelnet.marketplace.data.jpgstore

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import io.hazelnet.marketplace.data.ListingsInfo
import io.hazelnet.marketplace.data.Marketplace
import java.util.*

data class JpgStoreListingInfo @JsonCreator constructor(
    @JsonProperty("asset_id")
    val assetId: String,

    @JsonProperty("display_name")
    val displayName: String,

    @JsonProperty("tx_hash")
    val transactionHash: String,

    @JsonProperty("listing_id")
    val listingId: Long,

    @JsonProperty("listed_at")
    val listingDate: Date,

    @JsonProperty("price_lovelace")
    val price: Long,
) {
    fun toListingsInfo() = ListingsInfo(
        policyId = assetId.substring(0, 56),
        assetNameHex = assetId.substring(56),
        source = Marketplace.JPGSTORE,
        marketplaceAssetUrl = "https://jpg.store/asset/$assetId",
        price = price,
        listingDate = listingDate,
    )
}