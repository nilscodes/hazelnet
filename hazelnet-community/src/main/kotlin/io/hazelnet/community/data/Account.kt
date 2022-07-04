package io.hazelnet.community.data

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import javax.persistence.*
import javax.validation.Valid

@Entity
@Table(name = "accounts")
class Account(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="account_id")
    @field:JsonSerialize(using = ToStringSerializer::class)
    var id: Long?,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "account_settings", joinColumns = [JoinColumn(name = "account_id")])
    @field:Valid
    @field:JsonSerialize(using = EmbeddableSettingSerializer::class)
    var settings: MutableSet<EmbeddableSetting> = mutableSetOf(),
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Account

        if (id != other.id) return false
        if (settings != other.settings) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id?.hashCode() ?: 0
        result = 31 * result + settings.hashCode()
        return result
    }

    override fun toString(): String {
        return "Account(id=$id, settings=$settings)"
    }

}