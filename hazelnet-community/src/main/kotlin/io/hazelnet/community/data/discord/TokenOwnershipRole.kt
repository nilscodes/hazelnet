package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import org.springframework.lang.NonNull
import javax.persistence.*
import javax.validation.constraints.Min
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_token_roles")
class TokenOwnershipRole @JsonCreator constructor(
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name ="discord_token_role_id")
        var id: Long?,

        @Column(name = "policy_id")
        @field:NonNull
        @field:Size(min = 56, max = 56)
        var policyId: String,

        @Column(name = "minimum_token_quantity")
        @field:NonNull
        @field:Min(1)
        var minimumTokenQuantity: Long,

        @Column(name = "discord_role_id")
        @field:NonNull
        @field:Min(1)
        @field:JsonSerialize(using = ToStringSerializer::class)
        var roleId: Long
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as TokenOwnershipRole

        if (id != other.id) return false
        if (policyId != other.policyId) return false
        if (minimumTokenQuantity != other.minimumTokenQuantity) return false
        if (roleId != other.roleId) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + policyId.hashCode()
        result = 31 * result + minimumTokenQuantity.hashCode()
        result = 31 * result + roleId.hashCode()
        return result
    }

    override fun toString(): String {
        return "TokenOwnershipRole(id=$id, policyId='$policyId', minimumTokenQuantity=$minimumTokenQuantity, roleId=$roleId)"
    }


}