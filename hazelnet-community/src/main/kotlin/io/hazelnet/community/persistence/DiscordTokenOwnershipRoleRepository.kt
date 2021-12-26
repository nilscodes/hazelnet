package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.TokenOwnershipRole
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface DiscordTokenOwnershipRoleRepository: CrudRepository<TokenOwnershipRole, Long>