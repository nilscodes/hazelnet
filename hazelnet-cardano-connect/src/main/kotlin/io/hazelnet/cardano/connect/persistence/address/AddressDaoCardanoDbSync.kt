package io.hazelnet.cardano.connect.persistence.address

import io.hazelnet.cardano.connect.data.address.AddressDetails
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository

@Repository
class AddressDaoCardanoDbSync(
        private val jdbcTemplate: JdbcTemplate
) : AddressDao {
    override fun getDetails(address: String): AddressDetails {
        val stakeAddr = jdbcTemplate.queryForObject("SELECT DISTINCT(sa.view) FROM utxo_view JOIN stake_address sa on utxo_view.stake_address_id = sa.id WHERE address=?", String::class.java, address)
        return AddressDetails(stakeAddr)
    }
}