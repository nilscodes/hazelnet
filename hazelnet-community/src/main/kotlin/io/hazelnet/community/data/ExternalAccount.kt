package io.hazelnet.community.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIdentityInfo
import com.fasterxml.jackson.annotation.JsonIdentityReference
import com.fasterxml.jackson.annotation.ObjectIdGenerators.PropertyGenerator
import org.hibernate.annotations.Type
import java.util.*
import javax.persistence.*
import javax.validation.constraints.NotNull
import javax.validation.constraints.Size

@Entity
@Table(name = "external_accounts")
class ExternalAccount @JsonCreator constructor(
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "external_account_id")
        var id: Long?,

        @Column(name = "external_reference_id")
        @field:NotNull
        @field:Size(min = 1)
        var referenceId: String,

        @Column(name = "external_reference_name")
        var referenceName: String?,

        @Temporal(TemporalType.TIMESTAMP)
        @Column(name = "registration_time", updatable = false, )
        var registrationTime: Date?,

        @Column(name = "account_type")
        @Enumerated(EnumType.STRING)
        @Type(type = "io.hazelnet.community.persistence.data.ExternalAccountTypePostgreSql")
        var type: ExternalAccountType,

        @ManyToOne(fetch = FetchType.EAGER)
        @JoinColumn(name = "account_id")
        @JsonIdentityInfo(generator = PropertyGenerator::class, property = "id")
        @JsonIdentityReference(alwaysAsId = true)
        var account: Account?
) {
        override fun toString(): String {
                return "ExternalAccount(id=$id, referenceId='$referenceId', referenceName=$referenceName, registrationTime=$registrationTime, type=$type, account=$account)"
        }
}
