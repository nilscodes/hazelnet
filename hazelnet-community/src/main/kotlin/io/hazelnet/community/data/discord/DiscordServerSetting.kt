package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.validation.constraints.NotNull
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Embeddable
class DiscordServerSetting @JsonCreator constructor(
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

        other as DiscordServerSetting

        if (name != other.name) return false
        if (value != other.value) return false

        return true
    }

    override fun hashCode(): Int {
        var result = name.hashCode()
        result = 31 * result + value.hashCode()
        return result
    }

    override fun toString(): String {
        return "DiscordServerSetting(name='$name', value='$value')"
    }

}