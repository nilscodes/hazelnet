package io.hazelnet.community.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIdentityInfo
import com.fasterxml.jackson.annotation.JsonIdentityReference
import com.fasterxml.jackson.annotation.ObjectIdGenerators.PropertyGenerator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import io.hazelnet.community.data.cardano.TokenPolicy
import io.hazelnet.community.data.premium.PremiumStakedInfo
import org.hibernate.annotations.Type
import java.util.*
import javax.persistence.*
import javax.validation.Valid
import javax.validation.constraints.NotNull
import javax.validation.constraints.Size

@Entity
@Table(name = "external_accounts")
class ExternalAccount @JsonCreator constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "external_account_id")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var id: Long?,

    @Column(name = "external_reference_id")
    @field:NotNull
    @field:Size(min = 1)
    var referenceId: String,

    @Column(name = "external_reference_name")
    var referenceName: String?,

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "registration_time", updatable = false)
    var registrationTime: Date?,

    @Column(name = "account_type")
    @Enumerated(EnumType.STRING)
    @Type(type = "io.hazelnet.community.persistence.data.ExternalAccountTypePostgreSql")
    var type: ExternalAccountType,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "account_id")
    @JsonIdentityInfo(generator = PropertyGenerator::class, property = "id")
    @JsonIdentityReference(alwaysAsId = true)
    var account: Account?,

    @Column(name = "premium")
    var premium: Boolean = false,

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "premium_staked", joinColumns = [JoinColumn(name = "external_account_id")])
    var stakeInfo: MutableSet<PremiumStakedInfo> = mutableSetOf(),
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as ExternalAccount

        if (id != other.id) return false
        if (referenceId != other.referenceId) return false
        if (referenceName != other.referenceName) return false
        if (registrationTime != other.registrationTime) return false
        if (type != other.type) return false
        if (account != other.account) return false
        if (premium != other.premium) return false
        if (stakeInfo != other.stakeInfo) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + referenceId.hashCode()
        result = 31 * result + (referenceName?.hashCode() ?: 0)
        result = 31 * result + (registrationTime?.hashCode() ?: 0)
        result = 31 * result + type.hashCode()
        result = 31 * result + (account?.hashCode() ?: 0)
        result = 31 * result + premium.hashCode()
        result = 31 * result + stakeInfo.hashCode()
        return result
    }

    override fun toString(): String {
        return "ExternalAccount(id=$id, referenceId='$referenceId', referenceName=$referenceName, registrationTime=$registrationTime, type=$type, account=$account, premium=$premium, stakeInfo=$stakeInfo)"
    }

}
