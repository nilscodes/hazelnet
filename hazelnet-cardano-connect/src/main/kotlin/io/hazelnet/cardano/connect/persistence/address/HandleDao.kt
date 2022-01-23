package io.hazelnet.cardano.connect.persistence.address

import io.hazelnet.cardano.connect.data.address.Handle

interface HandleDao {
    fun resolveHandle(handlePolicy: String, handleName: String): Handle
}