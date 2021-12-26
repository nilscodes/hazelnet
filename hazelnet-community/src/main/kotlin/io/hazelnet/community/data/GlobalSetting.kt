package io.hazelnet.community.data

import javax.persistence.*
import javax.validation.constraints.NotNull
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Entity
@Table(name = "global_settings")
class GlobalSetting(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "setting_id")
    var id: Int?,

    @Column(name = "setting_name")
    @field:NotNull
    @field:Size(min = 1, max = 64)
    @field:Pattern(regexp = "^[_A-Z0-9]+$")
    var name: String,

    @Column(name = "setting_value")
    @field:NotNull
    @field:Size(min = 0, max = 200)
    var value: String
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as GlobalSetting

        if (id != other.id) return false
        if (name != other.name) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id ?: 0
        result = 31 * result + name.hashCode()
        return result
    }
}