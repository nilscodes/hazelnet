package io.hazelnet.cardano.connect.persistence.token

import io.hazelnet.cardano.connect.data.address.AddressDetails
import io.hazelnet.cardano.connect.data.token.*

interface TokenDao {
    fun getMultiAssetCountsForStakeAddress(stakeAddress: String): List<TokenOwnershipInfoWithAssetCount>
    fun getMultiAssetCountsWithPolicyIdForStakeAddress(stakeAddress: String, policyIds: List<PolicyId>, excludedAssetFingerprints: List<AssetFingerprint>): List<TokenOwnershipInfoWithAssetCount>
    fun getMultiAssetCountsWithPolicyIdAndAssetFingerprintForStakeAddress(stakeAddress: String, policyIdsWithAssetFingerprint: List<Pair<PolicyId, AssetFingerprint>>): List<TokenOwnershipInfoWithAssetCount>

    fun getMultiAssetListForStakeAddress(stakeAddress: String): List<TokenOwnershipInfoWithAssetList>
    fun getMultiAssetListWithPolicyIdForStakeAddress(stakeAddress: String, policyIds: List<PolicyId>): List<TokenOwnershipInfoWithAssetList>
    fun getMultiAssetListWithPolicyIdAndAssetFingerprintForStakeAddress(stakeAddress: String, policyIdsWithAssetFingerprint: List<Pair<PolicyId, AssetFingerprint>>): List<TokenOwnershipInfoWithAssetList>
    fun getMultiAssetListWithPolicyIdForWalletAddress(walletAddress: String, policyIds: List<PolicyId>): List<TokenOwnershipInfoWithAssetList>

    fun getMultiAssetCountSnapshotForPolicyId(policyIds: List<PolicyId>): List<TokenOwnershipInfoWithAssetCount>
    fun getMultiAssetCountSnapshotForPolicyIdAndAssetFingerprint(policyIdsWithAssetFingerprint: List<Pair<PolicyId, AssetFingerprint>>): List<TokenOwnershipInfoWithAssetCount>

    fun getMultiAssetInfo(policyId: String, assetName: String): MultiAssetInfo
    fun getMultiAssetInfoForAssetFingerprint(assetFingerprint: AssetFingerprint): MultiAssetInfo
    fun getWalletForAsset(assetFingerprint: AssetFingerprint): AddressDetails
    fun getPolicyInfo(policyId: String): PolicyInfo
}