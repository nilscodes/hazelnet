package io.hazelnet.marketplace.data.taptools

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import io.hazelnet.cardano.connect.util.toHex
import io.hazelnet.marketplace.data.ListingsInfo
import io.hazelnet.marketplace.data.Marketplace
import io.hazelnet.marketplace.data.SalesInfo
import io.hazelnet.marketplace.data.SalesType
import io.hazelnet.shared.decodeHex
import java.util.*

data class TapToolsSalesInfo @JsonCreator constructor(
    @JsonProperty("image")
    val image: String?,

    @JsonProperty("name")
    val name: String,

    @JsonProperty("collectionName")
    val collectionName: String?,

    @JsonProperty("hash")
    val hash: String?,

    @JsonProperty("sellerAddress")
    val sellerAddress: String?,

    @JsonProperty("buyerAddress")
    val buyerAddress: String?,

    @JsonProperty("policy")
    val policy: String,

    @JsonProperty("price")
    val price: Double,

    @JsonProperty("time")
    val time: Long,

    val saleDate: Date = Date(time * 1000L)
) {
    fun toSalesInfo() = SalesInfo(
        policyId = policy,
        assetNameHex = name.toByteArray(Charsets.UTF_8).toHex(),
        source = Marketplace.JPGSTORE, // Actually we do not know as it is not included by TapTools, but if we say other, most tracking will be lost
        marketplaceAssetUrl = "",
        imageUrl = image,
        price = (price * 1000000L).toLong(),
        saleDate = saleDate,
        type = SalesType.BUY,
    )
}
