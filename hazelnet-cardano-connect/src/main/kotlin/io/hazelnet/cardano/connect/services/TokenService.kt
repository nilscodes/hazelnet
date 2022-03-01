package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.data.token.AssetFingerprint
import io.hazelnet.cardano.connect.data.token.PolicyId
import io.hazelnet.cardano.connect.data.token.TokenOwnershipInfo
import io.hazelnet.cardano.connect.persistence.token.TokenDao
import io.hazelnet.cardano.connect.util.PolicyTools
import org.springframework.stereotype.Service

@Service
class TokenService(
    private val tokenDao: TokenDao
) {
    fun getMultiAssetsForStakeAddress(
        stakeAddress: String,
        policyIdsWithOptionalAssetFingerprint: List<String>
    ): List<TokenOwnershipInfo> {
        if (policyIdsWithOptionalAssetFingerprint.isEmpty()) {
            return tokenDao.getMultiAssetsForStakeAddress(stakeAddress)
        }
        val (allTokenOwnershipInfo, purePolicyIds, policyIdsWithAssetFingerprint) = extractTokenConstraints(
            policyIdsWithOptionalAssetFingerprint
        )
        if (purePolicyIds.isNotEmpty()) {
            allTokenOwnershipInfo.addAll(
                tokenDao.getMultiAssetsWithPolicyIdForStakeAddress(
                    stakeAddress,
                    purePolicyIds
                )
            )
        }
        if (policyIdsWithAssetFingerprint.isNotEmpty()) {
            allTokenOwnershipInfo.addAll(
                tokenDao.getMultiAssetsWithPolicyIdAndAssetFingerprintForStakeAddress(
                    stakeAddress,
                    policyIdsWithAssetFingerprint
                )
            )
        }

        return allTokenOwnershipInfo
    }

    fun getMultiAssetSnapshot(
        policyIdsWithOptionalAssetFingerprint: List<String>
    ): List<TokenOwnershipInfo> {
        if (policyIdsWithOptionalAssetFingerprint.isEmpty()) {
            throw IllegalArgumentException("Cannot retrieve a multi asset snapshot without providing at least one policy ID")
        }
        val (allTokenOwnershipInfo, purePolicyIds, policyIdsWithAssetFingerprint) = extractTokenConstraints(
            policyIdsWithOptionalAssetFingerprint
        )
        if (purePolicyIds.isNotEmpty()) {
            allTokenOwnershipInfo.addAll(
                tokenDao.getMultiAssetSnapshotForPolicyId(
                    purePolicyIds
                )
            )
        }
        if (policyIdsWithAssetFingerprint.isNotEmpty()) {
            allTokenOwnershipInfo.addAll(
                tokenDao.getMultiAssetSnapshotForPolicyIdAndAssetFingerprint(
                    policyIdsWithAssetFingerprint
                )
            )
        }

        return allTokenOwnershipInfo
    }

    private fun extractTokenConstraints(policyIdsWithOptionalAssetFingerprint: List<String>): Triple<MutableList<TokenOwnershipInfo>, List<PolicyId>, List<Pair<PolicyId, AssetFingerprint>>> {
        val allTokenOwnershipInfo = mutableListOf<TokenOwnershipInfo>()
        val purePolicyIds =
            policyIdsWithOptionalAssetFingerprint.filter { PolicyTools.isPolicyId(it) }.map { PolicyId(it) }
        val policyIdsWithAssetFingerprint =
            policyIdsWithOptionalAssetFingerprint.filter { !PolicyTools.isPolicyId(it) }
                .map { Pair(PolicyId(it.substring(0, 56)), AssetFingerprint(it.substring(56))) }
        return Triple(allTokenOwnershipInfo, purePolicyIds, policyIdsWithAssetFingerprint)
    }
}