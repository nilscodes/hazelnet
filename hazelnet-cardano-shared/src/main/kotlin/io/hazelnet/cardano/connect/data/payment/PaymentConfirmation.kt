package io.hazelnet.cardano.connect.data.payment

data class PaymentConfirmation(
    val transactionHash: String
) {
    override fun toString(): String {
        return "PaymentConfirmation(transactionHash='$transactionHash')"
    }
}
