package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.persistence.address.HandleDaoCardanoDbSync
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class HandleService(
        @Value("\${io.hazelnet.connect.cardano.handlepolicy}")
        private val handlePolicy: String,
        private val handleDao: HandleDaoCardanoDbSync
) {
    fun resolveHandle(handleName: String) = handleDao.resolveHandle(handlePolicy, handleName)
}