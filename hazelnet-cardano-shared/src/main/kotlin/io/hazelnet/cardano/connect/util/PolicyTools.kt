package io.hazelnet.cardano.connect.util

object PolicyTools {
    fun isPolicyId(policyId: String): Boolean {
        val policyIdRegex = "^[A-Za-z0-9]{56}\$".toRegex()
        return policyIdRegex.matches(policyId)
    }
}