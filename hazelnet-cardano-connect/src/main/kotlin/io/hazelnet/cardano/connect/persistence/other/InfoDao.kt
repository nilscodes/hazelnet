package io.hazelnet.cardano.connect.persistence.other

import io.hazelnet.cardano.connect.data.other.EpochDetails
import io.hazelnet.cardano.connect.data.other.SyncInfo

interface InfoDao {
    fun getSynchronizationStatus(): SyncInfo
    fun getEpochDetails(): EpochDetails
}