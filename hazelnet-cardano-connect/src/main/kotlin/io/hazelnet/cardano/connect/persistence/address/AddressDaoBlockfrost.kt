package io.hazelnet.cardano.connect.persistence.address

import io.blockfrost.sdk_kotlin.api.CardanoAddressesApi
import io.blockfrost.sdk_kotlin.infrastructure.BlockfrostConfig
import io.hazelnet.cardano.connect.data.address.AddressDetails
import kotlinx.coroutines.runBlocking
import org.springframework.stereotype.Repository

@Repository
class AddressDaoBlockfrost(
        private val blockfrostConfig: BlockfrostConfig
) : AddressDao {
    override fun getDetails(address: String): AddressDetails {
        // Use default configuration, mainnet, project_id loaded from BF_PROJECT_ID env var
        val api = CardanoAddressesApi(config = blockfrostConfig)
        return runBlocking {
            val details = api.getAddress(address)
            AddressDetails(details?.stakeAddress)
        }
    }
}