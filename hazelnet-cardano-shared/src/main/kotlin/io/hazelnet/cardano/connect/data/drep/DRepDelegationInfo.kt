package io.hazelnet.cardano.connect.data.drep

import com.fasterxml.jackson.annotation.JsonProperty

data class DRepDelegationInfo(
    @get:JsonProperty("dRepHash")
    val dRepHash: String,
    val amount: Long,
    val stakeAddress: String
) {
    override fun toString(): String {
        return "DRepDelegationInfo(dRepHash='$dRepHash', amount=$amount, stakeAddress='$stakeAddress')"
    }
}