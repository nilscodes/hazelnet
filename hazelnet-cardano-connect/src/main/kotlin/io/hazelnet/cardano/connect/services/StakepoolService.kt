package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import io.hazelnet.cardano.connect.persistence.stakepool.StakepoolDaoBlockfrost
import io.hazelnet.cardano.connect.persistence.stakepool.StakepoolDaoCardanoDbSync
import org.springframework.stereotype.Service

@Service
class StakepoolService(
    private val stakepoolDao: StakepoolDaoCardanoDbSync,
    private val stakepoolDaoBlockfrost: StakepoolDaoBlockfrost,
) {
    fun listStakepools(poolView: String?, poolHash: String?): List<StakepoolInfo> {
        if (poolView != null) {
            return stakepoolDao.findByView(poolView)
        } else if (poolHash != null) {
            return stakepoolDao.findByHash(poolHash)
        }
        return stakepoolDao.listStakepools()
    }

    fun getActiveDelegation(poolHash: String, withoutAmount: Boolean) = if (withoutAmount) {
        stakepoolDao.getActiveDelegationWithoutAmount(poolHash)
    } else {
        stakepoolDaoBlockfrost.getActiveDelegation(poolHash)
    }

    fun getDelegationInEpoch(poolHash: String, epochNo: Int) = stakepoolDao.getDelegationInEpoch(poolHash, epochNo)
}