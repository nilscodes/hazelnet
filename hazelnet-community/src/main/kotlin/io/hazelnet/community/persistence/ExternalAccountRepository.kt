package io.hazelnet.community.persistence

import io.hazelnet.community.data.ExternalAccount
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface ExternalAccountRepository : CrudRepository<ExternalAccount, Long> {
    fun findByReferenceId(referenceId: String): Optional<ExternalAccount>
}