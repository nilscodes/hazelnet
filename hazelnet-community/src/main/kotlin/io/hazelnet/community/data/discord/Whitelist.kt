package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import org.springframework.lang.NonNull
import java.util.*
import javax.persistence.*
import javax.validation.constraints.Min
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_whitelists")
class Whitelist @JsonCreator constructor(
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "discord_whitelist_id")
        var id: Long?,

        @Column(name = "whitelist_name")
        @field:NonNull
        @field:Size(min = 1, max = 30)
        @field:Pattern(regexp = "^[-A-Za-z0-9]{1,30}$")
        var name: String,

        @Column(name = "whitelist_displayname")
        @field:NonNull
        @field:Size(min = 1, max = 256)
        var displayName: String,

        @Column(name = "whitelist_signup_after")
        var signupAfter: Date?,

        @Column(name = "whitelist_signup_until")
        var signupUntil: Date?,

        @Column(name = "required_discord_role_id")
        @field:NonNull
        @field:Min(1)
        @field:JsonSerialize(using = ToStringSerializer::class)
        var requiredRoleId: Long,

        @Column(name = "whitelist_max_users")
        var maxUsers: Int?,

        @ElementCollection(fetch = FetchType.EAGER)
        @CollectionTable(name = "discord_whitelists_signup", joinColumns = [JoinColumn(name = "discord_whitelist_id")])
        @field:JsonIgnore
        var signups: MutableSet<WhitelistSignup> = mutableSetOf()
) {
    fun getCurrentUsers(): Int = signups.size

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Whitelist

        if (id != other.id) return false
        if (name != other.name) return false
        if (displayName != other.displayName) return false
        if (signupAfter != other.signupAfter) return false
        if (signupUntil != other.signupUntil) return false
        if (requiredRoleId != other.requiredRoleId) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + name.hashCode()
        result = 31 * result + displayName.hashCode()
        result = 31 * result + (signupAfter?.hashCode() ?: 0)
        result = 31 * result + (signupUntil?.hashCode() ?: 0)
        result = 31 * result + requiredRoleId.hashCode()
        return result
    }

    override fun toString(): String {
        return "Whitelist(id=$id, name='$name', displayName='$displayName', signupAfter=$signupAfter, signupUntil=$signupUntil, requiredRoleId=$requiredRoleId, maxUsers=$maxUsers, signups=$signups)"
    }
}