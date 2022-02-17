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
        val allTokenOwnershipInfo = mutableListOf<TokenOwnershipInfo>()
        val purePolicyIds = policyIdsWithOptionalAssetFingerprint.filter { PolicyTools.isPolicyId(it) }.map { PolicyId(it) }
        val policyIdsWithAssetFingerprint =
            policyIdsWithOptionalAssetFingerprint.filter { !PolicyTools.isPolicyId(it) }.map { Pair(PolicyId(it.substring(0, 56)), AssetFingerprint(it.substring(56))) }
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
}