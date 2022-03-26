package io.hazelnet.community.persistence

import io.hazelnet.community.data.premium.IncomingDiscordPayment
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*
import javax.transaction.Transactional

@Repository
interface IncomingDiscordPaymentRepository: CrudRepository<IncomingDiscordPayment, Int> {
    fun findByDiscordServerId(discordServerId: Int): Optional<IncomingDiscordPayment>

    @Transactional
    @Modifying
    @Query("DELETE FROM IncomingDiscordPayment WHERE validBefore<:now") // Cannot use now() or current_timestamp, need to pass the time in as parameter to get the correct time zone
    fun deleteExpired(@Param("now") now : Date)
}