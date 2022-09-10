package io.hazelnet.cardano.connect.services

import com.jayway.jsonpath.JsonPath
import com.jayway.jsonpath.PathNotFoundException
import io.hazelnet.cardano.connect.data.address.Handle
import io.hazelnet.cardano.connect.persistence.address.HandleDaoCardanoDbSync
import io.hazelnet.cardano.connect.persistence.token.TokenDao
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class HandleService(
        @Value("\${io.hazelnet.connect.cardano.handlepolicy}")
        private val handlePolicy: String,
        @Value("\${io.hazelnet.connect.ipfslink}")
        private val ipfslink: String,
        private val handleDao: HandleDaoCardanoDbSync,
        private val tokenDao: TokenDao,
) {
    fun resolveHandle(handleName: String): Handle {
        val handle = handleDao.resolveHandle(handlePolicy, handleName)
        val handleInfo = tokenDao.getMultiAssetInfo(handlePolicy, handleName)
        val handleImage = try {
            val ipfsHash = JsonPath.read<String>(handleInfo.metadata, "$.image").replace("ipfs://", "", true)
            String.format(ipfslink, ipfsHash)
        } catch(pnfe: PathNotFoundException) {
            ""
        }
        return handle.augmentWithImage(handleImage)
    }
}