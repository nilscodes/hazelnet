package io.hazelnet.community.persistence

import io.hazelnet.community.data.premium.DiscordPayment
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface DiscordPaymentRepository: CrudRepository<DiscordPayment, Int> {

    @Query(value = "SELECT SUM(payment_amount) FROM discord_payments WHERE discord_server_id=:discordServerId", nativeQuery = true)
    fun getCurrentBalance(@Param("discordServerId") discordServerId: Int): Optional<Long>
}