package io.hazelnet.cardano.connect.persistence.address

import com.bloxbean.cardano.client.util.AssetUtil
import io.hazelnet.cardano.connect.data.address.Handle
import io.hazelnet.cardano.connect.data.token.Cip67Label
import io.hazelnet.cardano.connect.data.token.Cip68Token
import io.hazelnet.cardano.connect.util.toHex
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository

const val GET_ADDRESS_FOR_HANDLE = "SELECT u.address FROM ma_tx_out mto JOIN multi_asset ma ON mto.ident = ma.id JOIN tx_out u ON mto.tx_out_id=u.id WHERE u.consumed_by_tx_id IS NULL AND policy=decode(?, 'hex') AND ma.fingerprint=?"

@Repository
class HandleDaoCardanoDbSync(
        private val jdbcTemplate: JdbcTemplate
) : HandleDao {
    override fun resolveHandle(handlePolicy: String, handleName: String): Handle {
        return try {
            val cip68Token = Cip68Token(Cip67Label(222), handleName)
            val handleAddress = jdbcTemplate.queryForObject(GET_ADDRESS_FOR_HANDLE, String::class.java, handlePolicy, AssetUtil.calculateFingerPrint(handlePolicy, cip68Token.toHexString()))
            Handle(handle = handleName, nftTokenNameHex = cip68Token.getReferenceToken().toHexString(), address = handleAddress, resolved = true)
        } catch (erdae: EmptyResultDataAccessException) {
            try {
                val handleAddress = jdbcTemplate.queryForObject(GET_ADDRESS_FOR_HANDLE, String::class.java, handlePolicy, AssetUtil.calculateFingerPrint(handlePolicy, handleName.toByteArray(Charsets.UTF_8).toHex()))
                Handle(handle = handleName, nftTokenNameHex = handleName.toByteArray(Charsets.UTF_8).toHex(), address = handleAddress, resolved = true)
            } catch (erdae: EmptyResultDataAccessException) {
                Handle(handle = handleName, nftTokenNameHex = "", resolved = false)
            }
        }
    }
}