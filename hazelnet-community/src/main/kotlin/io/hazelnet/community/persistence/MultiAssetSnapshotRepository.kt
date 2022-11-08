package io.hazelnet.community.persistence

import io.hazelnet.community.data.cardano.MultiAssetSnapshot
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface MultiAssetSnapshotRepository : CrudRepository<MultiAssetSnapshot, Int> {
    @Query("SELECT s FROM MultiAssetSnapshot s WHERE s.taken=false AND s.snapshotTime<:now") // Cannot use now() or current_timestamp, need to pass the time in as parameter to get the correct time zone
    fun findAllDueSnapshots(@Param("now") now : Date): List<MultiAssetSnapshot>

    @Query("SELECT s.assetFingerprint FROM MultiAssetSnapshot s WHERE s.id=:snapshotId")
    fun getAssetFingerprintForSnapshot(@Param("snapshotId") snapshotId: Int): String?
}