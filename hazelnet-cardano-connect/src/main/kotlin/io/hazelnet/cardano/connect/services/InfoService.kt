package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.data.other.SyncInfo
import io.hazelnet.cardano.connect.persistence.other.InfoDao
import org.springframework.stereotype.Service


@Service
class InfoService(
        private val infoDao: InfoDao,
) {
    fun getSynchronizationStatus() = infoDao.getSynchronizationStatus()

    fun getEpochDetails() = infoDao.getEpochDetails()
}
