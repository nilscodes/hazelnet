package io.hazelnet.community.persistence

import io.hazelnet.community.data.premium.DiscordBilling
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface DiscordBillingRepository: CrudRepository<DiscordBilling, Int> {
    fun findFirstByDiscordServerIdOrderByBillingTimeDesc(discordServerId: Int): Optional<DiscordBilling>
}