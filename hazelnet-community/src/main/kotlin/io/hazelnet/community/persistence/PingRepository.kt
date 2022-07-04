package io.hazelnet.community.persistence

import io.hazelnet.community.data.Account
import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.ping.ExternalAccountPing
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*
import javax.transaction.Transactional

@Repository
interface PingRepository : CrudRepository<ExternalAccountPing, Long> {
    @Query("SELECT MAX(sentTime) FROM ExternalAccountPing WHERE sender=:externalAccount")
    fun getLastPingSent(@Param("externalAccount") externalAccount: ExternalAccount): Optional<Date>

    fun findAllBySender(externalAccount: ExternalAccount): List<ExternalAccountPing>
    fun findAllByRecipient(account: Account): List<ExternalAccountPing>

    @Transactional
    @Modifying
    @Query("DELETE FROM ExternalAccountPing WHERE createTime<:expirationDate AND sentTime IS NULL") // Cannot use now() or current_timestamp, need to pass the time in as parameter to get the correct time zone
    fun removeUnsentPings(@Param("expirationDate") expirationDate: Date)

    @Transactional
    @Modifying
    @Query("DELETE FROM ExternalAccountPing WHERE sentTime<:expirationDate") // Cannot use now() or current_timestamp, need to pass the time in as parameter to get the correct time zone
    fun removeSentPings(@Param("expirationDate") expirationDate: Date)
}