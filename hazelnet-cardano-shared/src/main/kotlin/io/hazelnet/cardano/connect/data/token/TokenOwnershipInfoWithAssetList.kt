package io.hazelnet.cardano.connect.data.token

data class TokenOwnershipInfoWithAssetList(
    val stakeAddress: String? = null,
    val walletAddress: String? = null,
    val policyIdWithOptionalAssetFingerprint: String,
    val assetList: Set<String>,
) {
    override fun toString(): String {
        return "TokenOwnershipInfo(stakeAddress='$stakeAddress', walletAddress='$walletAddress', policyIdWithOptionalAssetFingerprint='$policyIdWithOptionalAssetFingerprint', assetList=$assetList)"
    }
}