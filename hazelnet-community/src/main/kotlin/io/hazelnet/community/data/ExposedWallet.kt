package io.hazelnet.community.data

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import java.util.*
import javax.persistence.*

@Entity
@Table(name = "exposed_wallets")
class ExposedWallet(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exposed_wallet_id")
    var id: Long?,

    @Column(name = "discord_server_id")
    var discordServerId: Int,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "exposed_at", updatable = false)
    var exposedAt: Date?,

    @Column(name = "verification_id")
    var verificationId: Long,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as ExposedWallet

        if (id != other.id) return false
        if (discordServerId != other.discordServerId) return false
        if (exposedAt != other.exposedAt) return false
        if (verificationId != other.verificationId) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + discordServerId
        result = 31 * result + (exposedAt?.hashCode() ?: 0)
        result = 31 * result + verificationId.hashCode()
        return result
    }

    override fun toString(): String {
        return "ExposedWallet(id=$id, discordServerId=$discordServerId, exposedAt=$exposedAt, verificationId=$verificationId)"
    }

}