package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import org.springframework.lang.NonNull
import javax.persistence.*
import javax.validation.constraints.Min
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_spo_roles")
class DelegatorRole @JsonCreator constructor(
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name ="discord_spo_role_id")
        var id: Long?,

        @Column(name = "stakepool_hash")
        @field:Size(min = 56, max = 56)
        var poolHash: String?,

        @Column(name = "minimum_stake")
        @field:NonNull
        @field:Min(0)
        @field:JsonSerialize(using = ToStringSerializer::class)
        var minimumStake: Long,

        @Column(name = "discord_role_id")
        @NonNull
        @field:Min(1)
        @field:JsonSerialize(using = ToStringSerializer::class)
        var roleId: Long
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DelegatorRole

        if (id != other.id) return false
        if (poolHash != other.poolHash) return false
        if (minimumStake != other.minimumStake) return false
        if (roleId != other.roleId) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + (poolHash?.hashCode() ?: 0)
        result = 31 * result + minimumStake.hashCode()
        result = 31 * result + roleId.hashCode()
        return result
    }

    override fun toString(): String {
        return "DelegatorRole(id=$id, poolHash=$poolHash, minimumStake=$minimumStake, roleId=$roleId)"
    }
}