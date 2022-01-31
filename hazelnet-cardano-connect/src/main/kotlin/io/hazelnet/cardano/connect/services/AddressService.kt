package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.data.address.AddressDetails
import io.hazelnet.cardano.connect.persistence.address.AddressDaoCardanoDbSync
import io.hazelnet.cardano.connect.util.Bech32
import io.hazelnet.cardano.connect.util.toHex
import org.springframework.stereotype.Service

@Service
class AddressService(
    private val addressDao: AddressDaoCardanoDbSync
) {

    fun getAddress(address: String): AddressDetails {
        val stakeKeyView = getStakeKeyViewFromAddress(address)
        return if (stakeKeyView != null) {
            AddressDetails(stakeKeyView)
        } else {
            AddressDetails(null)
        }
    }

    companion object {
        fun getStakeKeyViewFromAddress(address: String): String? {
            val addressRaw = Bech32.decode(address)
            return if (addressRaw.bytes.size > 29) {
                val networkId = 0xE1
                Bech32.encode("stake", byteArrayOf(networkId.toByte()).plus(addressRaw.bytes.copyOfRange(29, 57)))
            } else {
                null
            }
        }
    }
}