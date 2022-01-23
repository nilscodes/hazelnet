package io.hazelnet.cardano.connect.persistence.address

import io.hazelnet.cardano.connect.data.address.Handle
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository

const val GET_ADDRESS_FOR_HANDLE = "SELECT u.address FROM ma_tx_out ma JOIN utxo_view u ON ma.tx_out_id=u.id WHERE policy=decode(?, 'hex') AND ma.name=CAST(? AS asset32type)"

@Repository
class HandleDaoCardanoDbSync(
        private val jdbcTemplate: JdbcTemplate
) : HandleDao {
    override fun resolveHandle(handlePolicy: String, handleName: String): Handle {
        return try {
            val handleAddress = jdbcTemplate.queryForObject(GET_ADDRESS_FOR_HANDLE, String::class.java, handlePolicy, handleName)
            Handle(handle = handleName, address = handleAddress)
        } catch (erdae: EmptyResultDataAccessException) {
            Handle(handle = handleName, resolved = false)
        }
    }
}