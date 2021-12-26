package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.persistence.token.TokenDao
import org.springframework.stereotype.Service

@Service
class TokenService(
        private val tokenDao: TokenDao
) {
    fun getMultiAssetsForStakeAddress(stakeAddress: String, policyIds: List<String>) = tokenDao.getMultiAssetsForStakeAddress(stakeAddress, policyIds)
}