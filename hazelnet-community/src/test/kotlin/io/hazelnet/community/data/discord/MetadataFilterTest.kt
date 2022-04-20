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
          "soul patch", "not smoking"
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

internal class MetadataFilterTest {
    @Test
    fun testEquals() {
        val matchingSampleFilter = MetadataFilter(0, "type", AttributeOperatorType.EQUALS, "text/html")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter = MetadataFilter(0, "type", AttributeOperatorType.EQUALS, "text/htm")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))

        val matchingSampleFilterWithSubAttribute =
            MetadataFilter(0, "attributes.Eyes", AttributeOperatorType.EQUALS, "Drowsy")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            MetadataFilter(0, "attributes.Eyes", AttributeOperatorType.EQUALS, "Drows")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testContains() {
        val matchingSampleFilter = MetadataFilter(0, "type", AttributeOperatorType.CONTAINS, "text/ht")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter = MetadataFilter(0, "type", AttributeOperatorType.CONTAINS, "text\\html")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val matchingSampleFilterIterable = MetadataFilter(0, "tags", AttributeOperatorType.CONTAINS, "smoking")
        assertTrue(matchingSampleFilterIterable.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilterIterable = MetadataFilter(0, "tags", AttributeOperatorType.CONTAINS, "soul")
        assertFalse(nonMatchingSampleFilterIterable.apply(METADATA_DEADPXLZ_1))

        val matchingSampleFilterWithSubAttribute =
            MetadataFilter(0, "attributes.Head", AttributeOperatorType.CONTAINS, "lame")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            MetadataFilter(0, "attributes.Head", AttributeOperatorType.CONTAINS, "lamer")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testNotContains() {
        val matchingSampleFilter = MetadataFilter(0, "type", AttributeOperatorType.NOTCONTAINS, "text\\ht")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter = MetadataFilter(0, "type", AttributeOperatorType.NOTCONTAINS, "text/htm")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val matchingSampleFilterIterable = MetadataFilter(0, "tags", AttributeOperatorType.NOTCONTAINS, "soul")
        assertTrue(matchingSampleFilterIterable.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilterIterable = MetadataFilter(0, "tags", AttributeOperatorType.NOTCONTAINS, "smoking")
        assertFalse(nonMatchingSampleFilterIterable.apply(METADATA_DEADPXLZ_1))

        val matchingSampleFilterWithSubAttribute =
            MetadataFilter(0, "attributes.Head", AttributeOperatorType.NOTCONTAINS, "lamer")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            MetadataFilter(0, "attributes.Head", AttributeOperatorType.NOTCONTAINS, "lame")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testNotEquals() {
        val matchingSampleFilter = MetadataFilter(0, "type", AttributeOperatorType.NOTEQUALS, "text/htm")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter = MetadataFilter(0, "type", AttributeOperatorType.NOTEQUALS, "text/html")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))

        val matchingSampleFilterWithSubAttribute =
            MetadataFilter(0, "attributes.Eyes", AttributeOperatorType.NOTEQUALS, "Drows")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            MetadataFilter(0, "attributes.Eyes", AttributeOperatorType.NOTEQUALS, "Drowsy")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testStartsWith() {
        val matchingSampleFilter = MetadataFilter(0, "type", AttributeOperatorType.STARTSWITH, "text")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter = MetadataFilter(0, "type", AttributeOperatorType.STARTSWITH, "ext")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))

        val matchingSampleFilterWithSubAttribute =
            MetadataFilter(0, "attributes.Eyes", AttributeOperatorType.STARTSWITH, "Drows")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            MetadataFilter(0, "attributes.Eyes", AttributeOperatorType.STARTSWITH, "rows")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testEndsWith() {
        val matchingSampleFilter = MetadataFilter(0, "type", AttributeOperatorType.ENDSWITH, "html")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter = MetadataFilter(0, "type", AttributeOperatorType.ENDSWITH, "htm")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))

        val matchingSampleFilterWithSubAttribute =
            MetadataFilter(0, "attributes.Eyes", AttributeOperatorType.ENDSWITH, "rowsy")
        assertTrue(matchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
        val nonMatchingSampleFilterWithSubAttribute =
            MetadataFilter(0, "attributes.Eyes", AttributeOperatorType.ENDSWITH, "rows")
        assertFalse(nonMatchingSampleFilterWithSubAttribute.apply(METADATA_TAVERNSQUAD_1))
    }

    @Test
    fun testEqualsWithComplexJsonPath() {
        val matchingSampleFilter =
            MetadataFilter(0, "properties[?(@.key==\"type\")].value", AttributeOperatorType.EQUALS, "dead")
        assertTrue(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
        val nonMatchingSampleFilter =
            MetadataFilter(0, "properties[?(@.key==\"type\")].value", AttributeOperatorType.EQUALS, "zomato")
        assertFalse(nonMatchingSampleFilter.apply(METADATA_DEADPXLZ_1))
    }

    @Test
    fun testWithInvalidProperty() {
        val matchingSampleFilter = MetadataFilter(0, "NONEXISTENT", AttributeOperatorType.EQUALS, "dead")
        assertFalse(matchingSampleFilter.apply(METADATA_DEADPXLZ_1))
    }
}