package io.hazelnet.community.data

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import io.hazelnet.shared.data.ExternalAccountType
import org.hibernate.annotations.Type
import javax.persistence.*
import javax.validation.constraints.NotNull
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Entity
@Table(name = "verification_imports")
class VerificationImport(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "verification_import_id")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var id: Long?,

    @Column(name = "external_reference_id")
    @field:NotNull
    @field:Size(min = 1)
    var referenceId: String,

    @Column(name = "account_type")
    @Enumerated(EnumType.STRING)
    @Type(type = "io.hazelnet.community.persistence.data.ExternalAccountTypePostgreSql")
    var type: ExternalAccountType,

    @Column(name = "verified_address")
    @field:Size(min = 10, max = 103)
    @field:Pattern(regexp = "[a-zA-Z0-9]+")
    var address: String,

    @Column(name = "verification_source")
    @field:NotNull
    @field:Size(min = 1, max = 50)
    var source: String,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as VerificationImport

        if (id != other.id) return false
        if (referenceId != other.referenceId) return false
        if (type != other.type) return false
        if (address != other.address) return false
        if (source != other.source) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + referenceId.hashCode()
        result = 31 * result + type.hashCode()
        result = 31 * result + address.hashCode()
        result = 31 * result + source.hashCode()
        return result
    }

    override fun toString(): String {
        return "VerificationImport(id=$id, referenceId='$referenceId', type=$type, address='$address', source='$source')"
    }

}