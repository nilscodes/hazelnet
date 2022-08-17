package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.TokenRoleMetadataFilter
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface DiscordTokenRoleMetadataFilterRepository: CrudRepository<TokenRoleMetadataFilter, Long>