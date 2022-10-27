package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import org.springframework.lang.NonNull
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.validation.constraints.Min

@Embeddable
class DiscordRequiredRole @JsonCreator constructor(
    @Column(name = "discord_role_id")
    @field:NonNull
    @field:Min(1)
    @field:JsonSerialize(using = ToStringSerializer::class)
    var roleId: Long
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordRequiredRole

        if (roleId != other.roleId) return false

        return true
    }

    override fun hashCode(): Int {
        return roleId.hashCode()
    }

    override fun toString(): String {
        return "DiscordRequiredRole(roleId=$roleId)"
    }
}