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
@Table(name = "discord_reminders")
class DiscordReminder @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name ="reminder_id")
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
    @Column(name = "reminder_creation", updatable = false)
    var createTime: Date?,

    @Column(name = "reminder_type")
    @Enumerated(EnumType.ORDINAL)
    var type: DiscordReminderType,

    @Column(name = "reminder_seconds_offset")
    var secondsOffset: Int = 0,

    @Column(name = "reminder_channel")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var reminderChannel: Long,

    @Column(name = "reminder_title")
    @field:NonNull
    @field:Size(min = 1, max = 128)
    var title: String,

    @Column(name = "reminder_text")
    @field:NonNull
    @field:Size(min = 1, max = 4096)
    var reminderText: String,

    @Column(name = "last_epoch_sent")
    var lastEpochSent: Int?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "last_time_sent")
    var lastTimeSent: Date?,
    )
{
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordReminder

        if (id != other.id) return false
        if (discordServerId != other.discordServerId) return false
        if (creator != other.creator) return false
        if (createTime != other.createTime) return false
        if (type != other.type) return false
        if (secondsOffset != other.secondsOffset) return false
        if (reminderChannel != other.reminderChannel) return false
        if (title != other.title) return false
        if (reminderText != other.reminderText) return false
        if (lastEpochSent != other.lastEpochSent) return false
        if (lastTimeSent != other.lastTimeSent) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + (discordServerId ?: 0)
        result = 31 * result + creator.hashCode()
        result = 31 * result + (createTime?.hashCode() ?: 0)
        result = 31 * result + type.hashCode()
        result = 31 * result + secondsOffset.hashCode()
        result = 31 * result + reminderChannel.hashCode()
        result = 31 * result + title.hashCode()
        result = 31 * result + reminderText.hashCode()
        result = 31 * result + (lastEpochSent ?: 0)
        result = 31 * result + (lastTimeSent?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "DiscordReminder(id=$id, discordServerId=$discordServerId, creator=$creator, createTime=$createTime, type=$type, secondsOffset=$secondsOffset, reminderChannel=$reminderChannel, title='$title', reminderText='$reminderText', lastEpochSent=$lastEpochSent, lastTimeSent=$lastTimeSent)"
    }

}