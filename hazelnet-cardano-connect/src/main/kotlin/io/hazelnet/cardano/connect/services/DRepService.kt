package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.data.drep.DRepInfo
import io.hazelnet.cardano.connect.persistence.drep.DRepDaoCardanoDbSync
import org.springframework.stereotype.Service

@Service
class DRepService(
    private val dRepDao: DRepDaoCardanoDbSync,
) {
    fun listDReps(dRepView: String?, dRepHash: String?): List<DRepInfo> {
        if (dRepView != null) {
            return dRepDao.findByView(dRepView)
        } else if (dRepHash != null) {
            return dRepDao.findByHash(dRepHash)
        }
        return dRepDao.listDReps()
    }

    fun getActiveDRepDelegation(dRepHash: String, withoutAmount: Boolean) = if (withoutAmount) {
        dRepDao.getActiveDelegationWithoutAmount(dRepHash)
    } else {
        dRepDao.getActiveDelegation(dRepHash)
    }
}