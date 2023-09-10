package io.hazelnet.cardano.connect.services

import io.hazelnet.cardano.connect.data.HandleUtil
import io.hazelnet.cardano.connect.data.address.AddressDetails
import io.hazelnet.cardano.connect.data.token.PolicyId
import io.hazelnet.cardano.connect.data.token.TokenOwnershipInfoWithAssetList
import io.hazelnet.cardano.connect.persistence.token.TokenDao
import io.hazelnet.cardano.connect.util.Bech32
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class AddressService(
    @Value("\${io.hazelnet.connect.cardano.handlepolicy}")
    private val handlePolicy: String,
    private val tokenDao: TokenDao,
) {

    fun getAddress(address: String): AddressDetails {
        val stakeKeyView = getStakeKeyViewFromAddress(address)
        return if (stakeKeyView != null) {
            AddressDetails(stakeKeyView)
        } else {
            AddressDetails(null)
        }
    }

    fun getAssetsFromPolicyAtAddress(address: String, policyId: String): List<TokenOwnershipInfoWithAssetList> {
        return tokenDao.getMultiAssetListWithPolicyIdForWalletAddress(
            address,
            listOf(PolicyId(policyId))
        )
    }

    fun getHandlesAtAddress(address: String) = getAssetsFromPolicyAtAddress(address, handlePolicy)
        .map { it.assetList }
        .flatten()
        .map { HandleUtil.getHandle(handlePolicy, it) }

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