package io.hazelnet.cardano.connect.data.other

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import java.util.*

data class EpochDetails(
    val epochNo: Int,
    val blockCount: Int,
    val transactionCount: Int,
    @JsonSerialize(using = ToStringSerializer::class)
    val fees: Long,
    @JsonSerialize(using = ToStringSerializer::class)
    val outSum: Long,
    val startTime: Date,
) {
    fun getSecondsAchieved() = (Date().time - startTime.time) / 1000
    fun getEstimatedSecondsLeft() = ((startTime.time + 432000000L) - Date().time) / 1000
}
