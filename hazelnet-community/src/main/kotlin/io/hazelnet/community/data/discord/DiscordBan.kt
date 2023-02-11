package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import org.springframework.lang.NonNull
import java.util.*
import javax.persistence.*
import javax.validation.constraints.Min
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_bans")
class DiscordBan @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name ="discord_ban_id")
    var id: Int?,

    @Column(name = "discord_server_id")
    @JsonIgnore
    var discordServerId: Int?,

    @Column(name = "external_account_id")
    @field:NonNull
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var creator: Long,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "ban_creation", updatable = false)
    var createTime: Date?,

    @Column(name = "ban_type")
    @Enumerated(EnumType.ORDINAL)
    var type: DiscordBanType,

    @Column(name = "ban_response_type")
    @Enumerated(EnumType.ORDINAL)
    var responseType: DiscordBanResponseType,

    @Column(name = "ban_pattern")
    @field:NonNull
    @field:Size(min = 1, max = 256)
    var pattern: String,

    @Column(name = "ban_reason")
    @field:NonNull
    @field:Size(min = 1, max = 256)
    var reason: String,

    @Column(name = "alert_channel")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var alertChannel: Long?,
)
{
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordBan

        if (id != other.id) return false
        if (discordServerId != other.discordServerId) return false
        if (creator != other.creator) return false
        if (createTime != other.createTime) return false
        if (type != other.type) return false
        if (responseType != other.responseType) return false
        if (pattern != other.pattern) return false
        if (reason != other.reason) return false
        if (alertChannel != other.alertChannel) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + (discordServerId ?: 0)
        result = 31 * result + creator.hashCode()
        result = 31 * result + (createTime?.hashCode() ?: 0)
        result = 31 * result + type.hashCode()
        result = 31 * result + responseType.hashCode()
        result = 31 * result + pattern.hashCode()
        result = 31 * result + reason.hashCode()
        result = 31 * result + (alertChannel?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "DiscordBan(id=$id, discordServerId=$discordServerId, creator=$creator, createTime=$createTime, type=$type, responseType=$responseType, pattern='$pattern', reason='$reason', alertChannel=$alertChannel)"
    }

}