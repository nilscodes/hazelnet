package io.hazelnet.community.persistence

import io.hazelnet.community.data.claim.ClaimList
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface ClaimListRepository : CrudRepository<ClaimList, Int> {
    @Query(
        value = "SELECT c.* FROM claim_lists c JOIN discord_claim_lists dcl on c.claim_list_id = dcl.claim_list_id WHERE dcl.discord_server_id=:discordServerId",
        nativeQuery = true
    )
    fun findByDiscordServer(@Param("discordServerId") discordServerId: Int): List<ClaimList>
}