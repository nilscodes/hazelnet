package io.hazelnet.community.data.discord.marketplace

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import io.hazelnet.marketplace.data.Marketplace
import org.springframework.lang.NonNull
import java.util.*
import javax.persistence.*
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

    @Column(name = "policy_id")
    @field:NonNull
    @field:Size(min = 56, max = 56)
    var policyId: String,

    @Column(name = "marketplace")
    @Enumerated(EnumType.ORDINAL)
    @field:NonNull
    var marketplace: Marketplace,

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
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordMarketplaceChannel

        if (id != other.id) return false
        if (discordServerId != other.discordServerId) return false
        if (creator != other.creator) return false
        if (policyId != other.policyId) return false
        if (marketplace != other.marketplace) return false
        if (createTime != other.createTime) return false
        if (channelId != other.channelId) return false
        if (minimumValue != other.minimumValue) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + (discordServerId ?: 0)
        result = 31 * result + creator.hashCode()
        result = 31 * result + policyId.hashCode()
        result = 31 * result + marketplace.hashCode()
        result = 31 * result + (createTime?.hashCode() ?: 0)
        result = 31 * result + channelId.hashCode()
        result = 31 * result + (minimumValue?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "DiscordMarketplaceChannel(id=$id, discordServerId=$discordServerId, creator=$creator, policyId='$policyId', marketplace=$marketplace, createTime=$createTime, channelId=$channelId, minimumValue=$minimumValue)"
    }

}