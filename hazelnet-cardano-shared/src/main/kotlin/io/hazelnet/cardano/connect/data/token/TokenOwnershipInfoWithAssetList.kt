package io.hazelnet.cardano.connect.data.token

data class TokenOwnershipInfoWithAssetList(
    val stakeAddress: String,
    val policyIdWithOptionalAssetFingerprint: String,
    val assetList: Set<String>,
) {
    override fun toString(): String {
        return "TokenOwnershipInfo(stakeAddress='$stakeAddress', policyIdWithOptionalAssetFingerprint='$policyIdWithOptionalAssetFingerprint', assetList=$assetList)"
    }
}