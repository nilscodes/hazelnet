package io.hazelnet.community.data.discord

import java.io.Serializable

class DiscordGuildMemberId(
    var discordServerId: Int? = null,
    var discordUserId: Long? = null,
) : Serializable {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordGuildMemberId

        if (discordServerId != other.discordServerId) return false
        if (discordUserId != other.discordUserId) return false

        return true
    }

    override fun hashCode(): Int {
        var result = discordServerId ?: 0
        result = 31 * result + (discordUserId?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "DiscordGuildMemberId(discordServerId=$discordServerId, discordUserId=$discordUserId)"
    }

}