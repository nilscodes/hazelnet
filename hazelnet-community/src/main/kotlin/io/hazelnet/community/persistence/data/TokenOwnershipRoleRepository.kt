package io.hazelnet.community.persistence.data

import io.hazelnet.community.data.discord.TokenOwnershipRole
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface TokenOwnershipRoleRepository: CrudRepository<TokenOwnershipRole, Long>