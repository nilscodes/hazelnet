package io.hazelnet.cardano.connect.data.token

import com.fasterxml.jackson.annotation.JsonCreator

data class PolicyInfo(
    val policyId: PolicyId,
    val tokenCount: Long,
) {
    companion object {
        @JvmStatic
        @JsonCreator
        fun create(
            policyId: String,
            tokenCount: Long,
        ) = PolicyInfo(PolicyId(policyId), tokenCount)
    }
}
