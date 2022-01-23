package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.data.address.AddressDetails
import io.hazelnet.cardano.connect.persistence.address.AddressDaoCardanoDbSync
import org.springframework.stereotype.Service

@Service
class AddressService(
        private val addressDao: AddressDaoCardanoDbSync
) {

    fun getAddress(address : String) : AddressDetails = addressDao.getDetails(address)
}