package io.hazelnet.marketplace.data.taptools

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import io.hazelnet.cardano.connect.util.toHex
import io.hazelnet.marketplace.data.ListingsInfo
import io.hazelnet.marketplace.data.Marketplace
import io.hazelnet.shared.decodeHex
import java.util.*

data class TapToolsListingInfo @JsonCreator constructor(
    @JsonProperty("image")
    val image: String?,

    @JsonProperty("market")
    val market: String,

    @JsonProperty("name")
    val name: String,

    @JsonProperty("price")
    val price: Double,

    @JsonProperty("time")
    val time: Long,

    val listingDate: Date = Date(time * 1000L)
) {
    fun toListingsInfo(policyId: String) = ListingsInfo(
        policyId = policyId,
        assetNameHex = name.toByteArray(Charsets.UTF_8).toHex(),
        source = getMarketplace(market),
        marketplaceAssetUrl = "",
        imageUrl = image,
        price = (price * 1000000L).toLong(),
        listingDate = listingDate,
    )
}

fun getMarketplace(market: String) = when (market) {
    "jpg.store" -> Marketplace.JPGSTORE
    "plutus.art" -> Marketplace.PLUTUSART
    "SpaceBudz" -> Marketplace.SPACEBUDZ
    "PXLZ.org" -> Marketplace.PXLZ
    "Derp Birds" -> Marketplace.DERPBIRDS
    "cswap" -> Marketplace.CSWAP
    "dropspot" -> Marketplace.DROPSPOT
    else -> Marketplace.OTHER
}