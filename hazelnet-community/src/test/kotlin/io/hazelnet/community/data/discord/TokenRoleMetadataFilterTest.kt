package io.hazelnet.community.data.discord

import io.hazelnet.community.data.AttributeOperatorType
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

const val METADATA_DEADPXLZ_1 = """{
        "image": "ipfs://ipfs/QmRrFYTD2k8LVLkxdmyyqnuAbKBY664mkisEgMzw7rxZTZ",
        "name": "PXL#500",
        "properties": [
          {
            "key": "type",
            "value": "dead"
          },
          {
            "key": "length",
            "value": "long"
          }
        ],
        "src": "ipfs://ipfs/QmVsmMgvn28UxuPecwKSsd2cTnjgkw9ZKtyNoV566UEUXt",
        "tags": [
          "soul patch", "smoking"
        ],
        "type": "text/html"
      }"""

const val METADATA_DEADPXLZ_2 = """{
        "image": "ipfs://ipfs/QmRrFYTD2k8LVLkxdmyyqnuAbKBY664mkisEgMzw7rxZTZ",
        "name": "PXL#5011",
        "properties": [
          {
            "key": "type",
            "value": "dead"
          },
          {
            "key": "length",
            "value": "long"
          }
        ],
        "src": "ipfs://ipfs/QmVsmMgvn28UxuPecwKSsd2cTnjgkw9ZKtyNoV566UEUXt",
        "tags": [
          "soul patch", "not smoking"
        ],
        "type": "text/html"
      }"""

const val METADATA_DEADPXLZ_3 = """{
        "image": "ipfs://ipfs/QmRrFYTD2k8LVLkxdmyyqnuAbKBY664mkisEgMzw7rxZTZ",
        "name": "PXL#500",
        "properties": [
          {
            "key": "type",
            "value": "alien"
          },
          {
            "key": "length",
            "value": "long"
          }
        ],
        "src": "ipfs://ipfs/QmVsmMgvn28UxuPecwKSsd2cTnjgkw9ZKtyNoV566UEUXt",
        "tags": [
          "face mask", "not smoking"
        ],
        "type": "text/html"
      }"""

const val METADATA_DEADPXLZ_4 = """{
        "image": "ipfs://ipfs/QmRrFYTD2k8LVLkxdmyyqnuAbKBY664mkisEgMzw7rxZTZ",
        "name": "PXL#500",
        "properties": [
          {
            "key": "type",
            "value": "vampire"
          },
          {
            "key": "length",
            "value": "long"
          }
        ],
        "src": "ipfs://ipfs/QmVsmMgvn28UxuPecwKSsd2cTnjgkw9ZKtyNoV566UEUXt",
        "tags": [
          "noodles", "potatoes"
        ],
        "type": "text/html"
      }"""

const val METADATA_TAVERNSQUAD_1 = """{
        "attributes": {
          "Armor": "Ice",
          "Back": "None",
          "Background": "Red",
          "Eyes": "Drowsy",
          "Face": "None",
          "Familiar": "None",
          "Head": "Flame",
          "Mouth": "Normal",
          "Race": "Human",
          "Racial": "Clean Shaven",
          "SkinTone": "C"
        },
        "id": 1813,
        "image": "ipfs://QmWcp43o3DguesCN1H5oJnwtZ32GTFM2F8Tb29qA2KsZiQ",
        "name": "Tavern Squad Adventurer #01813",
        "type": "image/png",
        "url": "https://tavernsquad.io"
      }"""

const val METADATA_TAVERNSQUAD_2 = """{
        "attributes": {
          "Armor": "Ice",
          "Back": "None",
          "Background": "Red",
          "Eyes": "Blind",
          "Face": "None",
          "Familiar": "None",
          "Head": "Flame",
          "Mouth": "Normal",
          "Race": "Human",
          "Racial": "Clean Shaven",
          "SkinTone": "C"
        },
        "id": 1813,
        "image": "ipfs://QmWcp43o3DguesCN1H5oJnwtZ32GTFM2F8Tb29qA2KsZiQ",
        "name": "Tavern Squad Adventurer #01813",
        "type": "image/png",
        "url": "https://tavernsquad.io"
      }"""

const val METADATA_ADAGOTCHI_1 = """{
        "Collection": "Alpha",
        "Website": "https://adagotchi.io/",
        "files": [
          {
            "Base": "ElfA",
            "Body": "Body1Red",
            "Head": "RedFauxhawk",
            "mediaType": "image/png",
            "name": "Adagotchi #0662",
            "src": "ipfs://QmbicXPPxrrFErrRdYJzH8jnUbAJ9n9x8wMSJWGKd3fM1W"
          }
        ],
        "image": "ipfs://QmbicXPPxrrFErrRdYJzH8jnUbAJ9n9x8wMSJWGKd3fM1W",
        "mediaType": "image/png",
        "name": "Adagotchi #0662"
      }"""

const val METADATA_HANDLE_1 = """{
        "augmentations": [],
        "core": {
          "handleEncoding": "utf-8",
          "og": 0,
          "prefix": "${'$'}",
          "termsofuse": "https://adahandle.com/tou",
          "version": 0
        },
        "description": "The Handle Standard",
        "image": "ipfs://QmczJUxq6FqURyHv5UGAKDaXchZoneoU2jUuvQfAUmAzBv",
        "name": "${'$'}1982",
        "website": "https://adahandle.com"
      }"""

internal class TokenRoleMetadataFilterTest {
    @Test
    fun testEquals() {
        val matchingSampleFilter = TokenRoleMetadataFilter(0, "type", AttributeOperatorType.EQUALS, "text/html")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter = TokenRoleMetadataFilter(0, "type", AttributeOperatorType.EQUALS, "text/htm")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))

        val matchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.EQUALS, "Drowsy")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.EQUALS, "Drows")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testEqualsIsCaseSensitive() {
        val matchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.EQUALS, "Drowsy")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.EQUALS, "drowsy")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testContains() {
        val matchingSampleFilter = TokenRoleMetadataFilter(0, "type", AttributeOperatorType.CONTAINS, "text/ht")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter = TokenRoleMetadataFilter(0, "type", AttributeOperatorType.CONTAINS, "text\\html")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val matchingSampleFilterIterable = TokenRoleMetadataFilter(0, "tags", AttributeOperatorType.CONTAINS, "smoking")
        assertTrue(matchingSampleFilterIterable.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilterIterable = TokenRoleMetadataFilter(0, "tags", AttributeOperatorType.CONTAINS, "soul")
        assertFalse(nonMatchingSampleFilterIterable.apply(METADATA_DEADPXLZ_1))

        val matchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Head", AttributeOperatorType.CONTAINS, "lame")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Head", AttributeOperatorType.CONTAINS, "lamer")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testNotContains() {
        val matchingSampleFilter = TokenRoleMetadataFilter(0, "type", AttributeOperatorType.NOTCONTAINS, "text\\ht")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter = TokenRoleMetadataFilter(0, "type", AttributeOperatorType.NOTCONTAINS, "text/htm")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val matchingSampleFilterIterable = TokenRoleMetadataFilter(0, "tags", AttributeOperatorType.NOTCONTAINS, "soul")
        assertTrue(matchingSampleFilterIterable.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilterIterable = TokenRoleMetadataFilter(0, "tags", AttributeOperatorType.NOTCONTAINS, "smoking")
        assertFalse(nonMatchingSampleFilterIterable.apply(METADATA_DEADPXLZ_1))

        val matchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Head", AttributeOperatorType.NOTCONTAINS, "lamer")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Head", AttributeOperatorType.NOTCONTAINS, "lame")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testNotEquals() {
        val matchingSampleFilter = TokenRoleMetadataFilter(0, "type", AttributeOperatorType.NOTEQUALS, "text/htm")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter = TokenRoleMetadataFilter(0, "type", AttributeOperatorType.NOTEQUALS, "text/html")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))

        val matchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.NOTEQUALS, "Drows")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.NOTEQUALS, "Drowsy")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testStartsWith() {
        val matchingSampleFilter = TokenRoleMetadataFilter(0, "type", AttributeOperatorType.STARTSWITH, "text")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter = TokenRoleMetadataFilter(0, "type", AttributeOperatorType.STARTSWITH, "ext")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))

        val matchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.STARTSWITH, "Drows")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.STARTSWITH, "rows")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testEndsWith() {
        val matchingSampleFilter = TokenRoleMetadataFilter(0, "type", AttributeOperatorType.ENDSWITH, "html")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter = TokenRoleMetadataFilter(0, "type", AttributeOperatorType.ENDSWITH, "htm")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))

        val matchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.ENDSWITH, "rowsy")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            TokenRoleMetadataFilter(0, "attributes.Eyes", AttributeOperatorType.ENDSWITH, "rows")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testEqualsWithComplexJsonPath() {
        val matchingSampleFilter =
            TokenRoleMetadataFilter(0, "properties[?(@.key==\"type\")].value", AttributeOperatorType.EQUALS, "dead")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter =
            TokenRoleMetadataFilter(0, "properties[?(@.key==\"type\")].value", AttributeOperatorType.EQUALS, "zomato")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))
    }

    @Test
    fun testWithInvalidProperty() {
        val matchingSampleFilter = TokenRoleMetadataFilter(0, "NONEXISTENT", AttributeOperatorType.EQUALS, "dead")
        assertFalse(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
    }

    @Test
    fun testArrayIndex() {
        val matchingSampleFilter =
            TokenRoleMetadataFilter(0, "files[0].Head", AttributeOperatorType.CONTAINS, "Fauxhawk")
        assertTrue(matchingSampleFilter.apply(METADATA_ADAGOTCHI_1))
    }

    @Test
    fun testRegex() {
        val matchingSampleFilter = TokenRoleMetadataFilter(0, "name", AttributeOperatorType.REGEX, "[0-9]{4}$")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_2))
        val matchingSampleFilterHandle = TokenRoleMetadataFilter(0, "name", AttributeOperatorType.REGEX, "^\\$[0-9]{1,4}$")
        assertTrue(matchingSampleFilterHandle.apply(METADATA_HANDLE_1))
        val nonMatchingSampleFilter = TokenRoleMetadataFilter(0, "name", AttributeOperatorType.REGEX, "[0-9]{4}$")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))
    }
}