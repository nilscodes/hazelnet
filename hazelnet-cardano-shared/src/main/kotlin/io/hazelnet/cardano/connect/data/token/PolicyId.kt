package io.hazelnet.cardano.connect.data.token

const val GLOBAL_TRACKING_POLICY_ID_PLACEHOLDER = "00000000000000000000000000000000000000000000000000000000"

@JvmInline
value class PolicyId(val policyId: String) {
    init {
        require("^[A-Za-z0-9]{56}\$".toRegex().matches(policyId))
    }
}