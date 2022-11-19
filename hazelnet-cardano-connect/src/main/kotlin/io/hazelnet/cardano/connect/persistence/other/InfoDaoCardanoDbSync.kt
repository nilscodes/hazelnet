package io.hazelnet.cardano.connect.persistence.other

import io.hazelnet.cardano.connect.data.other.EpochDetails
import io.hazelnet.cardano.connect.data.other.SyncInfo
import org.springframework.cache.annotation.CacheConfig
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Repository
import java.util.*

const val GET_LAST_BLOCK_INFO: String = "select max (time) as last_sync, max(epoch_no) as current_epoch from block"
const val GET_SYNC_PERCENTAGE: String = "select\n" +
        "   100 * (extract (epoch from (max (time) at time zone 'UTC')) - extract (epoch from (min (time) at time zone 'UTC')))\n" +
        "      / (extract (epoch from (now () at time zone 'UTC')) - extract (epoch from (min (time) at time zone 'UTC')))\n" +
        "  from block"

const val GET_CURRENT_EPOCH_INFO: String = "SELECT * FROM epoch ORDER BY no DESC LIMIT 1"

@Repository
@CacheConfig(cacheNames = ["infoCardanoDbSync"])
class InfoDaoCardanoDbSync(
        private val jdbcTemplate: JdbcTemplate
) : InfoDao {
    @Cacheable(key = "\"syncInfo\"")
    override fun getSynchronizationStatus(): SyncInfo {
        val utcCalendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        val (lastBlockDate, currentEpoch) = jdbcTemplate.queryForObject(GET_LAST_BLOCK_INFO) { rs, _ ->
            Pair(rs.getTimestamp("last_sync", utcCalendar), rs.getInt("current_epoch"))
        }!!
        val syncPercentage = jdbcTemplate.queryForObject(GET_SYNC_PERCENTAGE, Double::class.java)!!
        return SyncInfo(currentEpoch, lastBlockDate, syncPercentage)
    }

    @Cacheable(key = "\"epochDetails\"")
    override fun getEpochDetails(): EpochDetails {
        val utcCalendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        return jdbcTemplate.queryForObject(GET_CURRENT_EPOCH_INFO) { rs, _ ->
            EpochDetails(
                epochNo = rs.getInt("no"),
                blockCount = rs.getInt("blk_count"),
                transactionCount = rs.getInt("tx_count"),
                fees = rs.getLong("fees"),
                outSum = rs.getLong("out_sum"),
                startTime = rs.getTimestamp("start_time", utcCalendar)
            )
        }!!
    }

    @Scheduled(fixedDelay = 30000)
    @CacheEvict(allEntries = true)
    fun clearInfoCache() {
        // Annotation-based cache clearing
    }

}