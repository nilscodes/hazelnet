package io.hazelnet.community.data.discord.whitelists

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import java.util.*
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.validation.constraints.Min
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Embeddable
class WhitelistSignup @JsonCreator constructor(
        @Column(name = "external_account_id")
        @field:Min(1)
        @field:JsonSerialize(using = ToStringSerializer::class)
        var externalAccountId: Long,

        @Column(name = "address")
        @field:Size(min = 10, max = 103)
        @field:Pattern(regexp = "[a-zA-Z0-9]+")
        var address: String?,

        @Column(name = "signup_time", updatable = false)
        var signupTime: Date?
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as WhitelistSignup

        if (externalAccountId != other.externalAccountId) return false
        if (address != other.address) return false
        if (signupTime != other.signupTime) return false

        return true
    }

    override fun hashCode(): Int {
        var result = externalAccountId.hashCode()
        result = 31 * result + (address?.hashCode() ?: 0)
        result = 31 * result + (signupTime?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "WhitelistSignup(externalAccountId=$externalAccountId, address='$address', signupTime=$signupTime)"
    }
}