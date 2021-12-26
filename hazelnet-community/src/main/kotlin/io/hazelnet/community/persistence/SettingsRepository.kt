package io.hazelnet.community.persistence

import io.hazelnet.community.data.GlobalSetting
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface SettingsRepository : CrudRepository<GlobalSetting, Int> {
    fun findByName(name: String): Optional<GlobalSetting>
}