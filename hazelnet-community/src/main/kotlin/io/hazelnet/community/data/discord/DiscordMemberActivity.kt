package io.hazelnet.community.data.discord

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import java.util.*
import javax.persistence.*

@Entity
@Table(name = "discord_activity")
@IdClass(DiscordGuildMemberId::class)
class DiscordMemberActivity(
    @Id
    @Column(name = "discord_server_id")
    var discordServerId: Int?,

    @Id
    @Column(name = "discord_user_id")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var discordUserId: Long?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "last_activity_time", updatable = true)
    var lastActivityTime: Date?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "last_reminder_time", updatable = true)
    var lastReminderTime: Date? = null,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordMemberActivity

        if (discordServerId != other.discordServerId) return false
        if (discordUserId != other.discordUserId) return false
        if (lastActivityTime != other.lastActivityTime) return false
        if (lastReminderTime != other.lastReminderTime) return false

        return true
    }

    override fun hashCode(): Int {
        var result = discordServerId ?: 0
        result = 31 * result + (discordUserId?.hashCode() ?: 0)
        result = 31 * result + (lastActivityTime?.hashCode() ?: 0)
        result = 31 * result + (lastReminderTime?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "DiscordMemberActivity(discordServerId=$discordServerId, discordUserId=$discordUserId, lastActivityTime=$lastActivityTime, lastReminder=$lastReminderTime)"
    }

}