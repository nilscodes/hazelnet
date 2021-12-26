package io.hazelnet.community.data

import com.fasterxml.jackson.annotation.JsonIdentityInfo
import com.fasterxml.jackson.annotation.JsonIdentityReference
import com.fasterxml.jackson.annotation.ObjectIdGenerators
import org.hibernate.annotations.Type
import java.util.*
import javax.persistence.*
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Entity
@Table(name = "verifications")
class Verification(
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "verification_id")
        var id: Long?,

        @Column(name = "verification_amount")
        var amount: Long,

        @Column(name = "blockchain")
        @Enumerated(EnumType.STRING)
        @Type(type = "io.hazelnet.community.persistence.data.BlockchainTypePostgreSql")
        var blockchain: BlockchainType,

        @Column(name = "address")
        @field:Size(min = 10, max = 103)
        @field:Pattern(regexp = "[a-zA-Z0-9]+")
        var address: String,

        @Column(name = "cardano_stake_address")
        @field:Size(min = 10, max = 60)
        @field:Pattern(regexp = "[a-zA-Z0-9]+")
        var cardanoStakeAddress: String?,

        @Column(name = "transaction_hash")
        var transactionHash: String?,

        @ManyToOne(fetch = FetchType.EAGER)
        @JoinColumn(name = "external_account_id")
        @JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator::class, property = "id")
        @JsonIdentityReference(alwaysAsId = true)
        var externalAccount: ExternalAccount,

        @Temporal(TemporalType.TIMESTAMP)
        @Column(name = "valid_after", insertable = true, updatable = false)
        var validAfter: Date,

        @Temporal(TemporalType.TIMESTAMP)
        @Column(name = "valid_before", insertable = true, updatable = false)
        var validBefore: Date,

        @Column(name = "confirmed")
        var confirmed: Boolean,

        @Temporal(TemporalType.TIMESTAMP)
        @Column(name = "confirmed_at", insertable = true, updatable = true)
        var confirmedAt: Date?,

        @Column(name = "obsolete")
        var obsolete: Boolean
) {
        override fun toString(): String {
                return "Verification(id=$id, amount=$amount, blockchain=$blockchain, address='$address', cardanoStakeAddress=$cardanoStakeAddress, transactionHash=$transactionHash, externalAccount=$externalAccount, validAfter=$validAfter, validBefore=$validBefore, confirmed=$confirmed, confirmedAt=$confirmedAt, obsolete=$obsolete)"
        }
}