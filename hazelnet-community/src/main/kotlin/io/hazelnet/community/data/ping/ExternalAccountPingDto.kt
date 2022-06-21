package io.hazelnet.community.data.ping

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import java.util.*
import javax.validation.constraints.NotNull
import javax.validation.constraints.Size

data class ExternalAccountPingDto @JsonCreator constructor(
    @field:JsonSerialize(using = ToStringSerializer::class)
    val id: Long?,

    @field:NotNull
    @field:JsonSerialize(using = ToStringSerializer::class)
    var sender: Long,

    @field:JsonSerialize(using = ToStringSerializer::class)
    val senderLocal: Long?,

    val sentFromServer: Int?,

    @field:NotNull
    @field:JsonSerialize(using = ToStringSerializer::class)
    val recipient: Long,

    @field:JsonSerialize(using = ToStringSerializer::class)
    val recipientLocal: Long?,

    @field:NotNull
    @field:Size(min = 1, max = 150)
    val recipientAddress: String,

    @field:Size(min = 1, max = 320)
    val senderMessage: String?,

    val createTime: Date?,
    val sentTime: Date? = null,
    val reported: Boolean = false
)