package io.hazelnet.cardano.connect.data.stakepool

data class DelegationInfo(
        val poolHash: String,
        val amount: Long,
        val stakeAddress: String
) {
    override fun toString(): String {
        return "DelegationInfo(poolHash='$poolHash', amount=$amount, stakeAddress='$stakeAddress')"
    }
}