package io.hazelnet.community.persistence

import io.hazelnet.community.data.claim.PhysicalProduct
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface PhysicalProductRepository: CrudRepository<PhysicalProduct, Int>