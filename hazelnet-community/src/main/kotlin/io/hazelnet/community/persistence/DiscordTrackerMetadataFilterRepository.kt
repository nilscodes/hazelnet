package io.hazelnet.community.persistence

import io.hazelnet.community.data.discord.marketplace.TrackerMetadataFilter
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface DiscordTrackerMetadataFilterRepository: CrudRepository<TrackerMetadataFilter, Long>