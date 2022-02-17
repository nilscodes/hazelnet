package io.hazelnet.cardano.connect.persistence.token

import io.hazelnet.cardano.connect.data.token.AssetFingerprint
import io.hazelnet.cardano.connect.data.token.PolicyId
import io.hazelnet.cardano.connect.data.token.TokenOwnershipInfo

interface TokenDao {
    fun getMultiAssetsForStakeAddress(stakeAddress: String): List<TokenOwnershipInfo>
    fun getMultiAssetsWithPolicyIdForStakeAddress(stakeAddress: String, policyIds: List<PolicyId>): List<TokenOwnershipInfo>
    fun getMultiAssetsWithPolicyIdAndAssetFingerprintForStakeAddress(stakeAddress: String, policyIdsWithAssetFingerprint: List<Pair<PolicyId, AssetFingerprint>>): List<TokenOwnershipInfo>
}