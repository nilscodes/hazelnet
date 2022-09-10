package io.hazelnet.community.persistence

import io.hazelnet.community.data.Account
import io.hazelnet.community.data.ExternalAccount
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface ExternalAccountRepository : CrudRepository<ExternalAccount, Long> {
    fun findByReferenceId(referenceId: String): Optional<ExternalAccount>
    fun findByPremium(premium: Boolean): List<ExternalAccount>
    fun findByAccount(account: Account): List<ExternalAccount>

    @Query(value = "SELECT e FROM ExternalAccount e JOIN Verification v ON e=v.externalAccount WHERE v.cardanoStakeAddress=:stakeAddress AND v.confirmed=true AND v.obsolete=false")
    fun findByVerifiedStakeAddress(@Param("stakeAddress") stakeAddress: String): Optional<ExternalAccount>

    @Query(value = "SELECT DISTINCT MAX(epoch) FROM premium_staked", nativeQuery = true)
    fun getLastSnapshottedEpoch(): Optional<Long>
}