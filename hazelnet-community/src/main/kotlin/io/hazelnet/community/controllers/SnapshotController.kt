package io.hazelnet.community.controllers

import io.hazelnet.community.data.cardano.MultiAssetSnapshot
import io.hazelnet.community.services.MultiAssetSnapshotService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import javax.validation.Valid

@RestController
@RequestMapping("/snapshots")
class SnapshotController(
    private val multiAssetSnapshotService: MultiAssetSnapshotService
) {

    @PostMapping("/stake")
    @ResponseStatus(HttpStatus.CREATED)
    fun scheduleSnapshot(@RequestBody @Valid multiAssetSnapshot: MultiAssetSnapshot): ResponseEntity<MultiAssetSnapshot> {
        val snapshot = multiAssetSnapshotService.scheduleSnapshot(multiAssetSnapshot)
        return ResponseEntity
            .created(
                ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{snapshotId}")
                    .buildAndExpand(snapshot.id)
                    .toUri()
            )
            .body(snapshot)
    }
}