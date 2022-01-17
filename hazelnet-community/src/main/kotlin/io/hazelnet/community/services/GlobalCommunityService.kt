package io.hazelnet.community.services

import io.hazelnet.community.data.GlobalSetting
import io.hazelnet.community.persistence.SettingsRepository
import org.springframework.stereotype.Service

@Service
class GlobalCommunityService(
        private val settingsRepository: SettingsRepository
) {
    fun getSettings() = settingsRepository.findAll().associate { Pair(it.name, it.value) }

    fun updateSetting(globalSetting: GlobalSetting): GlobalSetting {
        val existingSetting = settingsRepository.findByName(globalSetting.name)
        return if (existingSetting.isPresent) {
            existingSetting.get().value = globalSetting.value
            settingsRepository.save(existingSetting.get())
            existingSetting.get()
        } else {
            settingsRepository.save(globalSetting);
        }
    }

    fun deleteSetting(settingName: String) {
        val existingSetting = settingsRepository.findByName(settingName)
        if (existingSetting.isPresent) {
            settingsRepository.deleteById(existingSetting.get().id!!)
        }
    }
}