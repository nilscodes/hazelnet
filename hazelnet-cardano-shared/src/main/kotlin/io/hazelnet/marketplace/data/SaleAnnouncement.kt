package io.hazelnet.marketplace.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import java.util.*

data class SaleAnnouncement @JsonCreator constructor(
    @field:JsonSerialize(using = ToStringSerializer::class)
    val guildId: Long,

    @field:JsonSerialize(using = ToStringSerializer::class)
    val channelId: Long,

    val policyId: String,
    val assetNameHex: String,
    val assetName: String,
    val displayName: String,
    val source: Marketplace,
    val marketplaceAssetUrl: String,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val assetImageUrl: String? = null,

    @field:JsonSerialize(using = ToStringSerializer::class)
    val price: Long,
    val saleDate: Date,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val rarityRank: Int? = null,

    val type: SalesType,
)