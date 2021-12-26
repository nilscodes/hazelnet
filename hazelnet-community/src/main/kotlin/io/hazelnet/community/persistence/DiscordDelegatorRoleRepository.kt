package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.DelegatorRole
import io.hazelnet.community.data.discord.DiscordServer
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface DiscordDelegatorRoleRepository: CrudRepository<DelegatorRole, Long>