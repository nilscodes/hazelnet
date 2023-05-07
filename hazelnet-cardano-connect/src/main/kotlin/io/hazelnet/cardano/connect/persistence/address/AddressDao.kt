package io.hazelnet.cardano.connect.persistence.address

import io.hazelnet.cardano.connect.data.address.AddressDetails

interface AddressDao {
    fun getDetails(address : String) : AddressDetails
}