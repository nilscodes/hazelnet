package io.hazelnet.cardano.connect.data.token

data class TokenOwnershipInfo(
        val stakeAddress: String,
        val policyId: String,
        val assetCount: Long
) {
    override fun toString(): String {
        return "TokenOwnershipInfo(stakeAddress='$stakeAddress', policyId='$policyId', assetCount=$assetCount)"
    }
}