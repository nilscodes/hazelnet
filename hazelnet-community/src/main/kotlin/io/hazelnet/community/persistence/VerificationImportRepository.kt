package io.hazelnet.community.persistence

import io.hazelnet.community.data.ExternalAccountType
import io.hazelnet.community.data.VerificationImport
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface VerificationImportRepository : CrudRepository<VerificationImport, Long> {

    fun findByReferenceIdAndType(referenceId: String, accountType: ExternalAccountType): List<VerificationImport>

}