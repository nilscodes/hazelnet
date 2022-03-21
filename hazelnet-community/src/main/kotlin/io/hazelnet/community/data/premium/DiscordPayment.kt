package io.hazelnet.community.data.premium

import io.hazelnet.community.data.discord.DiscordServer
import java.util.*
import javax.persistence.*

@Entity
@Table(name = "discord_payments")
class DiscordPayment(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name ="payment_id")
    var id: Int?,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discord_server_id")
    var discordServer: DiscordServer,

    @Column(name = "transaction_hash")
    var transactionHash: String?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "payment_time", insertable = true, updatable = false)
    var paymentTime: Date,

    @Column(name = "payment_amount")
    var amount: Long,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "billing_id")
    var billing: DiscordBilling?,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordPayment

        if (id != other.id) return false
        if (discordServer != other.discordServer) return false
        if (transactionHash != other.transactionHash) return false
        if (paymentTime != other.paymentTime) return false
        if (amount != other.amount) return false
        if (billing != other.billing) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + discordServer.hashCode()
        result = 31 * result + (transactionHash?.hashCode() ?: 0)
        result = 31 * result + paymentTime.hashCode()
        result = 31 * result + amount.hashCode()
        result = 31 * result + (billing?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "DiscordPayment(id=$id, discordServer=$discordServer, transactionHash=$transactionHash, paymentTime=$paymentTime, amount=$amount, billing=$billing)"
    }

}