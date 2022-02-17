package io.hazelnet.cardano.connect.data.token

data class TokenOwnershipInfo(
        val stakeAddress: String,
        val policyIdWithOptionalAssetFingerprint: String,
        val assetCount: Long
) {
    override fun toString(): String {
        return "TokenOwnershipInfo(stakeAddress='$stakeAddress', policyIdWithOptionalAssetFingerprint='$policyIdWithOptionalAssetFingerprint', assetCount=$assetCount)"
    }
}