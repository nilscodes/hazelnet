package io.hazelnet.cardano.connect.persistence.address

import io.blockfrost.sdk_kotlin.api.CardanoAssetsApi
import io.blockfrost.sdk_kotlin.infrastructure.BlockfrostConfig
import io.blockfrost.sdk_kotlin.infrastructure.NotFoundException
import io.hazelnet.cardano.connect.data.address.Handle
import kotlinx.coroutines.runBlocking
import org.springframework.stereotype.Repository
import java.math.BigInteger

@Repository
class HandleDaoBlockfrost(
        private val blockfrostConfig: BlockfrostConfig
) : HandleDao {
    override fun resolveHandle(handlePolicy: String, handleName: String): Handle {
        val api = CardanoAssetsApi(config = blockfrostConfig)
        val handleNameHex = toHex(handleName).lowercase()
        return runBlocking {
            try {
                val details = api.getAssetAddresses("$handlePolicy$handleNameHex")
                if (details.isNotEmpty()) {
                    Handle(handle = handleName, nftTokenNameHex = handleNameHex, address = details[0].address)
                } else {
                    Handle(handle = handleName, nftTokenNameHex = "", resolved = false)
                }
            } catch(nfe: NotFoundException) {
                // Ignore this exception - we'll consider the handle unresolved
                Handle(handle = handleName, nftTokenNameHex = "", resolved = false)
            }
        }
    }

    fun toHex(arg: String): String {
        return String.format("%x", BigInteger(1, arg.toByteArray()))
    }
}