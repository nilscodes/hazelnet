package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.DRepDelegatorRole
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface DiscordDRepDelegatorRoleRepository: CrudRepository<DRepDelegatorRole, Long>