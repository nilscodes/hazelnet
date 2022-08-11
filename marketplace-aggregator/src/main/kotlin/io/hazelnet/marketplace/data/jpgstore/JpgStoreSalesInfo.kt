package io.hazelnet.marketplace.data.jpgstore

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import io.hazelnet.marketplace.data.Marketplace
import io.hazelnet.marketplace.data.SalesInfo
import io.hazelnet.marketplace.data.SalesType
import java.util.*

data class JpgStoreSalesInfo @JsonCreator constructor(
    @JsonProperty("asset_id")
    val assetId: String,

    @JsonProperty("display_name")
    val displayName: String,

    @JsonProperty("tx_hash")
    val transactionHash: String,

    @JsonProperty("listing_id")
    val listingId: Long,

    @JsonProperty("confirmed_at")
    val saleDate: Date,

    @JsonProperty("price_lovelace")
    val price: Long,
) {
    fun toSalesInfo() = SalesInfo(
        policyId = assetId.substring(0, 56),
        assetNameHex = assetId.substring(56),
        source = Marketplace.JPGSTORE,
        marketplaceAssetUrl = "https://jpg.store/asset/$assetId",
        price = price,
        saleDate = saleDate,
        type = SalesType.BUY,
    )
}