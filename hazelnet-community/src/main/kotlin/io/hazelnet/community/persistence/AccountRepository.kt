package io.hazelnet.community.persistence

import io.hazelnet.community.data.Account
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface AccountRepository: CrudRepository<Account, Long>