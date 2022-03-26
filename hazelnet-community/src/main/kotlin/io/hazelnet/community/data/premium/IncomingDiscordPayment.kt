package io.hazelnet.community.data.premium

import com.fasterxml.jackson.annotation.JsonIgnore
import io.hazelnet.community.data.discord.DiscordServer
import java.util.*
import javax.persistence.*
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Entity
@Table(name = "discord_incoming_payments")
class IncomingDiscordPayment(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name ="incoming_payment_id")
    var id: Int?,

    @Column(name = "receiving_address")
    @field:Size(min = 10, max = 103)
    @field:Pattern(regexp = "[a-zA-Z0-9]+")
    var receivingAddress: String,

    @Column(name = "payment_amount")
    var amount: Long,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discord_server_id")
    @JsonIgnore
    var discordServer: DiscordServer,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "valid_after", insertable = true, updatable = false)
    var validAfter: Date,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "valid_before", insertable = true, updatable = false)
    var validBefore: Date,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as IncomingDiscordPayment

        if (id != other.id) return false
        if (receivingAddress != other.receivingAddress) return false
        if (amount != other.amount) return false
        if (discordServer != other.discordServer) return false
        if (validAfter != other.validAfter) return false
        if (validBefore != other.validBefore) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + receivingAddress.hashCode()
        result = 31 * result + amount.hashCode()
        result = 31 * result + discordServer.hashCode()
        result = 31 * result + validAfter.hashCode()
        result = 31 * result + validBefore.hashCode()
        return result
    }

    override fun toString(): String {
        return "IncomingDiscordPayment(id=$id, receivingAddress='$receivingAddress', amount=$amount, discordServer=$discordServer, validAfter=$validAfter, validBefore=$validBefore)"
    }

}