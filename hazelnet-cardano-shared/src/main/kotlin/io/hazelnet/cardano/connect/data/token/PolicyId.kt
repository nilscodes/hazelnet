package io.hazelnet.cardano.connect.data.token

@JvmInline
value class PolicyId(val policyId: String) {
    init {
        require("^[A-Za-z0-9]{56}\$".toRegex().matches(policyId))
    }
}