package io.hazelnet.marketplace.data

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer

data class ReminderInfo @JsonCreator constructor(
    @field:JsonSerialize(using = ToStringSerializer::class)
    val guildId: Long,
    val reminderId: Int,
)
