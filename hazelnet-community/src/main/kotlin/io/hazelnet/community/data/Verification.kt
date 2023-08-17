package io.hazelnet.community.data

import com.fasterxml.jackson.annotation.JsonIdentityInfo
import com.fasterxml.jackson.annotation.JsonIdentityReference
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.ObjectIdGenerators
import io.hazelnet.shared.data.BlockchainType
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
        var obsolete: Boolean,

        @Column(name = "succeeded_by")
        var succeededBy: Long? = null,

        @OneToMany(fetch = FetchType.LAZY)
        @JoinColumn(name = "verification_id")
        @JsonIgnore
        var exposedWallets: MutableSet<ExposedWallet> = mutableSetOf(),
) {
        override fun equals(other: Any?): Boolean {
                if (this === other) return true
                if (javaClass != other?.javaClass) return false

                other as Verification

                if (id != other.id) return false
                if (amount != other.amount) return false
                if (blockchain != other.blockchain) return false
                if (address != other.address) return false
                if (cardanoStakeAddress != other.cardanoStakeAddress) return false
                if (transactionHash != other.transactionHash) return false
                if (externalAccount != other.externalAccount) return false
                if (validAfter != other.validAfter) return false
                if (validBefore != other.validBefore) return false
                if (confirmed != other.confirmed) return false
                if (confirmedAt != other.confirmedAt) return false
                if (obsolete != other.obsolete) return false
                if (succeededBy != other.succeededBy) return false
                if (exposedWallets != other.exposedWallets) return false

                return true
        }

        override fun hashCode(): Int {
                var result = id?.hashCode() ?: 0
                result = 31 * result + amount.hashCode()
                result = 31 * result + blockchain.hashCode()
                result = 31 * result + address.hashCode()
                result = 31 * result + (cardanoStakeAddress?.hashCode() ?: 0)
                result = 31 * result + (transactionHash?.hashCode() ?: 0)
                result = 31 * result + externalAccount.hashCode()
                result = 31 * result + validAfter.hashCode()
                result = 31 * result + validBefore.hashCode()
                result = 31 * result + confirmed.hashCode()
                result = 31 * result + (confirmedAt?.hashCode() ?: 0)
                result = 31 * result + obsolete.hashCode()
                result = 31 * result + (succeededBy?.hashCode() ?: 0)
                result = 31 * result + exposedWallets.hashCode()
                return result
        }

        override fun toString(): String {
                return "Verification(id=$id, amount=$amount, blockchain=$blockchain, address='$address', cardanoStakeAddress=$cardanoStakeAddress, transactionHash=$transactionHash, externalAccount=$externalAccount, validAfter=$validAfter, validBefore=$validBefore, confirmed=$confirmed, confirmedAt=$confirmedAt, obsolete=$obsolete, succeededBy=$succeededBy, exposedWallets=$exposedWallets)"
        }

}