package io.hazelnet.community.persistence

import io.hazelnet.community.data.ExternalAccount
import io.hazelnet.community.data.Verification
import org.hibernate.annotations.Type
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.jpa.repository.Temporal
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*
import javax.transaction.Transactional

@Repository
interface VerificationRepository : CrudRepository<Verification, Long> {

    @Transactional
    @Modifying
    @Query("UPDATE Verification SET obsolete=true WHERE confirmed=false AND validBefore<:now") // Cannot use now() or current_timestamp, need to pass the time in as parameter to get the correct time zone
    fun markObsolete(@Param("now") now : Date)

    @Transactional
    @Modifying
    @Query("UPDATE Verification SET validBefore=:newValidity WHERE confirmed=false AND obsolete=false AND validBefore<:now") // Cannot use now() or current_timestamp, need to pass the time in as parameter to get the correct time zone
    fun bumpObsoleteTime(@Param("now") now: Date, @Param("newValidity") newValidity: Date)

    @Transactional
    @Modifying
    @Query("UPDATE Verification SET succeededBy=:successorVerification, obsolete=true WHERE confirmed=true AND obsolete=false AND cardanoStakeAddress=:stakeAddress AND id<>:successorVerification") // Cannot use now() or current_timestamp, need to pass the time in as parameter to get the correct time zone
    fun invalidateOutdatedVerifications(@Param("stakeAddress") stakeAddress: String, @Param("successorVerification") successorVerification: Long)

    @Query("SELECT v FROM Verification v WHERE v.confirmed=false AND v.obsolete=false")
    fun findAllOutstanding() : List<Verification>

    fun findAllByExternalAccount(externalAccount: ExternalAccount): List<Verification>
    fun findAllByCardanoStakeAddress(stakeAddress: String): List<Verification>

    @Query(value = "SELECT DISTINCT v.* FROM discord_server_members d JOIN verifications v on d.external_account_id = v.external_account_id WHERE d.discord_server_id=:discordServerId AND confirmed=true", nativeQuery = true)
    fun getAllCompletedVerificationsForDiscordServer(@Param("discordServerId") discordServerId: Int): List<Verification>

}