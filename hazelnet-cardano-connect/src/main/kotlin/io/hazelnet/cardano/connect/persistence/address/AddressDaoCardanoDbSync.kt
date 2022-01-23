package io.hazelnet.cardano.connect.persistence.address

import io.hazelnet.cardano.connect.data.address.AddressDetails
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository

const val GET_STAKE_ADDRESS_FOR_ADDRESS = "SELECT DISTINCT(sa.view) FROM tx_out JOIN stake_address sa ON tx_out.stake_address_id = sa.id WHERE address=?"

@Repository
class AddressDaoCardanoDbSync(
        private val jdbcTemplate: JdbcTemplate
) : AddressDao {
    override fun getDetails(address: String): AddressDetails {
        return try {
            val stakeAddress = jdbcTemplate.queryForObject(
                GET_STAKE_ADDRESS_FOR_ADDRESS,
                String::class.java,
                address
            )
            AddressDetails(stakeAddress)
        } catch(erdae: EmptyResultDataAccessException) {
            AddressDetails(null)
        }
    }
}