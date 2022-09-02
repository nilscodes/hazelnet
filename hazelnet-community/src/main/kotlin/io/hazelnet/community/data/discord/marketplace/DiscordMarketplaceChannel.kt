package io.hazelnet.community.data.discord.marketplace

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import com.jayway.jsonpath.JsonPath
import com.jayway.jsonpath.PathNotFoundException
import io.hazelnet.community.data.discord.TokenOwnershipAggregationType
import io.hazelnet.marketplace.data.Marketplace
import org.springframework.lang.NonNull
import java.util.*
import javax.persistence.*
import javax.validation.Valid
import javax.validation.constraints.Min
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_marketplace_channels")
class DiscordMarketplaceChannel @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "marketplace_channel_id")
    var id: Int?,

    @Column(name = "discord_server_id")
    @JsonIgnore
    var discordServerId: Int?,

    @Column(name = "external_account_id")
    @field:NonNull
    @field:Min(1)
    var creator: Long,

    @Column(name = "tracker_type")
    @Enumerated(EnumType.ORDINAL)
    @field:NonNull
    var type: DiscordMarketplaceChannelType,

    @Column(name = "policy_id")
    @field:NonNull
    @field:Size(min = 56, max = 56)
    var policyId: String,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "discord_marketplace_markets", joinColumns = [JoinColumn(name = "marketplace_channel_id")])
    @Column(name = "marketplace")
    @field:Valid
    @field:Size(min = 1)
    var marketplaces: MutableSet<Marketplace> = mutableSetOf(),

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "marketplace_channel_creation", updatable = false)
    var createTime: Date?,

    @Column(name = "discord_channel_id")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var channelId: Long,

    @Column(name = "minimum_value")
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var minimumValue: Long?,

    @Column(name = "maximum_value")
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var maximumValue: Long?,

    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = "marketplace_channel_id")
    @field:Valid
    var filters: MutableSet<TrackerMetadataFilter> = mutableSetOf(),

    @Column(name = "aggregation_type")
    @Enumerated(EnumType.ORDINAL)
    var aggregationType: TokenOwnershipAggregationType = TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND,

    @Column(name = "highlight_attribute_name")
    @field:Size(min = 1, max = 64)
    var highlightAttributeName: String?,

    @Column(name = "highlight_attribute_display_name")
    @field:Size(min = 1, max = 64)
    var highlightAttributeDisplayName: String?,
) {
    fun meetsFilterCriteria(metadata: String): Boolean {
        return when (aggregationType) {
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND -> filters.all { it.apply(metadata) }
            TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR -> filters.isEmpty() || filters.any { it.apply(metadata) }
            else -> throw IllegalArgumentException("Invalid aggregation type for marketplace channel $id")
        }
    }

    fun extractHighlightAttribute(metadata: String): String? {
        return if (highlightAttributeName != null) {
            return findAttribute(metadata, highlightAttributeName!!).toString()
        } else {
            null
        }
    }

    // TODO same method as in MetadataFilter.kt
    private fun findAttribute(
        metadata: String,
        attributeName: String,
    ): Any? {
        return try {
            val attributePath = if (attributeName.startsWith("$.")) attributeName.substring(2) else attributeName
            JsonPath.read<Any>(metadata, "$.${attributePath}")
        } catch (pnfe: PathNotFoundException) {
            null
        }
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordMarketplaceChannel

        if (id != other.id) return false
        if (discordServerId != other.discordServerId) return false
        if (creator != other.creator) return false
        if (type != other.type) return false
        if (policyId != other.policyId) return false
        if (marketplaces != other.marketplaces) return false
        if (createTime != other.createTime) return false
        if (channelId != other.channelId) return false
        if (minimumValue != other.minimumValue) return false
        if (maximumValue != other.maximumValue) return false
        if (filters != other.filters) return false
        if (aggregationType != other.aggregationType) return false
        if (highlightAttributeName != other.highlightAttributeName) return false
        if (highlightAttributeDisplayName != other.highlightAttributeDisplayName) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + (discordServerId ?: 0)
        result = 31 * result + creator.hashCode()
        result = 31 * result + type.hashCode()
        result = 31 * result + policyId.hashCode()
        result = 31 * result + marketplaces.hashCode()
        result = 31 * result + (createTime?.hashCode() ?: 0)
        result = 31 * result + channelId.hashCode()
        result = 31 * result + (minimumValue?.hashCode() ?: 0)
        result = 31 * result + (maximumValue?.hashCode() ?: 0)
        result = 31 * result + filters.hashCode()
        result = 31 * result + aggregationType.hashCode()
        result = 31 * result + (highlightAttributeName?.hashCode() ?: 0)
        result = 31 * result + (highlightAttributeDisplayName?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "DiscordMarketplaceChannel(id=$id, discordServerId=$discordServerId, creator=$creator, type=$type, policyId='$policyId', marketplaces=$marketplaces, createTime=$createTime, channelId=$channelId, minimumValue=$minimumValue, maximumValue=$maximumValue, filters=$filters, aggregationType=$aggregationType, highlightAttributeName=$highlightAttributeName, highlightAttributeDisplayName=$highlightAttributeDisplayName)"
    }

}