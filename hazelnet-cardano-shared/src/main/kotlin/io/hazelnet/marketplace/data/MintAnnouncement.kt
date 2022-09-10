package io.hazelnet.marketplace.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import java.util.*

data class MintAnnouncement @JsonCreator constructor(
    @field:JsonSerialize(using = ToStringSerializer::class)
    val guildId: Long,

    @field:JsonSerialize(using = ToStringSerializer::class)
    val channelId: Long,

    val policyId: String,
    val assetFingerprint: String,
    val assetNameHex: String,
    val assetName: String,
    val displayName: String,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val assetImageUrl: String? = null,

    val mintDate: Date,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    val rarityRank: Int? = null,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    var highlightAttributeDisplayName: String? = null,

    @field:JsonInclude(JsonInclude.Include.NON_NULL)
    var highlightAttributeValue: String? = null,
)