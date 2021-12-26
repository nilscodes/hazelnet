package io.hazelnet.cardano.connect.persistence.token

import io.hazelnet.cardano.connect.data.token.TokenOwnershipInfo

interface TokenDao {
    fun getMultiAssetsForStakeAddress(stakeAddress: String, policyIds: List<String>): List<TokenOwnershipInfo>
}