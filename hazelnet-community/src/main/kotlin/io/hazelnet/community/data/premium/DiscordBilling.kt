package io.hazelnet.community.data.premium

import io.hazelnet.community.data.discord.DiscordServer
import java.util.*
import javax.persistence.*

@Entity
@Table(name = "discord_billing")
class DiscordBilling(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name ="billing_id")
    var id: Int?,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discord_server_id")
    var discordServer: DiscordServer,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "billing_time", insertable = true, updatable = false)
    var billingTime: Date,

    @Column(name = "billing_amount")
    var amount: Long,

    @Column(name = "billing_member_count")
    var memberCount: Int,

    @Column(name = "billing_max_delegation")
    var maxDelegation: Long,

    @Column(name = "billing_actual_delegation")
    var actualDelegation: Long,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DiscordBilling

        if (id != other.id) return false
        if (discordServer != other.discordServer) return false
        if (billingTime != other.billingTime) return false
        if (amount != other.amount) return false
        if (memberCount != other.memberCount) return false
        if (maxDelegation != other.maxDelegation) return false
        if (actualDelegation != other.actualDelegation) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + discordServer.hashCode()
        result = 31 * result + billingTime.hashCode()
        result = 31 * result + amount.hashCode()
        result = 31 * result + memberCount
        result = 31 * result + maxDelegation.hashCode()
        result = 31 * result + actualDelegation.hashCode()
        return result
    }

    override fun toString(): String {
        return "DiscordBilling(id=$id, discordServer=$discordServer, billingTime=$billingTime, amount=$amount, memberCount=$memberCount, maxDelegation=$maxDelegation, actualDelegation=$actualDelegation)"
    }

}