package io.hazelnet.cardano.connect.persistence.stakepool

import io.hazelnet.cardano.connect.data.stakepool.DelegationInfo
import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo

interface StakepoolDao {
    fun listStakepools(): List<StakepoolInfo>
    fun getActiveDelegation(poolHash: String): List<DelegationInfo>
    fun getDelegationInEpoch(poolHash: String, epochNo: Int): List<DelegationInfo>
}