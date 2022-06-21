package io.hazelnet.community.data.ping

import com.fasterxml.jackson.annotation.JsonIdentityInfo
import com.fasterxml.jackson.annotation.JsonIdentityReference
import com.fasterxml.jackson.annotation.ObjectIdGenerators
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import io.hazelnet.community.data.Account
import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.discord.DiscordServer
import java.util.*
import javax.persistence.*

@Entity
@Table(name = "external_account_pings")
class ExternalAccountPing(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ping_id")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var id: Long?,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_external_account_id")
    @JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator::class, property = "id")
    @JsonIdentityReference(alwaysAsId = true)
    var sender: ExternalAccount,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sent_from_server")
    @JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator::class, property = "id")
    @JsonIdentityReference(alwaysAsId = true)
    var sentFromServer: DiscordServer?,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipient_account_id")
    @JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator::class, property = "id")
    @JsonIdentityReference(alwaysAsId = true)
    var recipient: Account,

    @Column(name = "recipient_address", updatable = false)
    var recipientAddress: String,

    @Column(name = "sender_message")
    var senderMessage: String?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "create_time", updatable = false)
    var createTime: Date?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "sent_time")
    var sentTime: Date? = null,

    @Column(name = "reported")
    var reported: Boolean = false,

    ) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as ExternalAccountPing

        if (id != other.id) return false
        if (sender != other.sender) return false
        if (sentFromServer != other.sentFromServer) return false
        if (recipient != other.recipient) return false
        if (recipientAddress != other.recipientAddress) return false
        if (senderMessage != other.senderMessage) return false
        if (createTime != other.createTime) return false
        if (sentTime != other.sentTime) return false
        if (reported != other.reported) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + sender.hashCode()
        result = 31 * result + (sentFromServer?.hashCode() ?: 0)
        result = 31 * result + recipient.hashCode()
        result = 31 * result + recipientAddress.hashCode()
        result = 31 * result + (senderMessage?.hashCode() ?: 0)
        result = 31 * result + (createTime?.hashCode() ?: 0)
        result = 31 * result + (sentTime?.hashCode() ?: 0)
        result = 31 * result + reported.hashCode()
        return result
    }

    override fun toString(): String {
        return "ExternalAccountPing(id=$id, sender=$sender, sentFromServer=$sentFromServer, recipient=$recipient, recipientAddress='$recipientAddress', senderMessage=$senderMessage, createTime=$createTime, sentTime=$sentTime, reported=$reported)"
    }

}