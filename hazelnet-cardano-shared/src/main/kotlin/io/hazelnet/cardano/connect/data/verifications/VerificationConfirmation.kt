package io.hazelnet.cardano.connect.data.verifications

data class VerificationConfirmation(
        val stakeAddress: String,
        val transactionHash: String
) {
    override fun toString(): String {
        return "VerificationConfirmation(stakeAddress='$stakeAddress', transactionHash='$transactionHash')"
    }
}
