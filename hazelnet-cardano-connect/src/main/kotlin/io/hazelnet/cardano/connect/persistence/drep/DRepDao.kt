package io.hazelnet.cardano.connect.persistence.drep

import io.hazelnet.cardano.connect.data.drep.DRepDelegationInfo
import io.hazelnet.cardano.connect.data.drep.DRepInfo
import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo

interface DRepDao {
    fun listDReps(): List<DRepInfo>
    fun getActiveDelegation(dRepHash: String): List<DRepDelegationInfo>
    fun getActiveDelegationWithoutAmount(dRepHash: String): List<DRepDelegationInfo>
    fun findByView(dRepView: String): List<DRepInfo>
    fun findByHash(dRepHash: String): List<DRepInfo>
}