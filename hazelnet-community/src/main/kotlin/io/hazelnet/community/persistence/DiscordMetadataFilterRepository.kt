package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.MetadataFilter
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface DiscordMetadataFilterRepository: CrudRepository<MetadataFilter, Long>