package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.persistence.stakepool.StakepoolDao
import org.springframework.stereotype.Service

@Service
class StakepoolService(
        private val stakepoolDao: StakepoolDao
) {
    fun listStakepools() = stakepoolDao.listStakepools()
    fun getActiveDelegation(poolHash: String) = stakepoolDao.getActiveDelegation(poolHash)
    fun getDelegationInEpoch(poolHash: String, epochNo: Int) = stakepoolDao.getDelegationInEpoch(poolHash, epochNo)
}