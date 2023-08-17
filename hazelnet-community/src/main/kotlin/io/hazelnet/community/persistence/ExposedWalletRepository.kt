package io.hazelnet.community.persistence

import io.hazelnet.community.data.ExposedWallet
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface ExposedWalletRepository: CrudRepository<ExposedWallet, Long>