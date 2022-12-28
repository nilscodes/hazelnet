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

const val METADATA_HUNKS_1 = """{
        "Base": "Nude",
        "Cigarette": "None",
        "Earring": "None",
        "Eyes": "Raised",
        "Facial Hair": "None",
        "Hair": "Mid Parting (peach)",
        "Headwear": "None",
        "Mouth": "Pout (nude)",
        "Top": "Turtleneck (yellow)",
        "Top Secondary": "None",
        "files": [
          {
            "mediaType": "image/png",
            "name": "hunk3888",
            "src": [
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlYAAAJWCAYAAACapc",
              "kfAAAMvUlEQVR4nO3YsYvXdRzH8cpviH/AhQ7uTjoEDdEgNAgO4mygyyGIBE2SBw",
              "eGkI4tNYhLDjc1SNsJQoO0ORgNzS1FLm5xONheQ/Hr+bnP/e4ejz/gzYvvd3nyef",
              "vGoydv3gIA4H97Z/YAAIDDQlgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAE",
              "SEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQ",
              "BARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARF",
              "gBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAE",
              "SEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQ",
              "BARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARF",
              "gBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAE",
              "SEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQ",
              "BARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBAZJk9APinjd2d2R",
              "NWcvPk69kTOOLunLs2ewJHnBcrAICIsAIAiAgrAICIsAIAiAgrAICIsAIAiAgrAI",
              "CIsAIAiAgrAICIsAIAiAgrAICIsAIAiAgrAICIsAIAiAgrAICIsAIAiAgrAICIsA",
              "IAiAgrAICIsAIAiAgrAICIsAIAiLx949GTN7NHwCgbuzuzJ6zk5snXsycAf3Pn3L",
              "XZE1gDXqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCg",
              "AgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIq",
              "wAACLCCgAgssweABu7O7MnAPyrOy++HXf73LVht9lfXqwAACLCCgAgIqwAACLCCg",
              "AgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIq",
              "wAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgsswewHrY2N2ZPYEj7u",
              "vf3509YSU3T76ePeHAGfkvfW9m82IFABARVgAAEWEFABARVgAAEWEFABARVgAAEW",
              "EFABARVgAAEWEFABARVgAAEWEFABARVgAAEWEFABARVgAAEWEFABARVgAAEWEFAB",
              "ARVgAAEWEFABARVgAAEWEFABARVgAAkWX2AODweO/q5WG3vxh2eaw/Hj2ePWEl6/",
              "ov1/V7c3h4sQIAiAgrAICIsAIAiAgrAICIsAIAiAgrAICIsAIAiAgrAICIsAIAiA",
              "grAICIsAIAiAgrAICIsAIAiAgrAICIsAIAiAgrAICIsAIAiAgrAICIsAIAiAgrAI",
              "CIsAIAiAgrAIDIMnsAwGH23tXLsycA+8iLFQBARFgBAESEFQBARFgBAESEFQBARF",
              "gBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAE",
              "SEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQ",
              "BARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARF",
              "gBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBAZJk9ADg8rm/enz1hJQ",
              "8efj57AmvgzrlrsyewBrxYAQBEhBUAQERYAQBEhBUAQERYAQBEhBUAQERYAQBEhB",
              "UAQERYAQBEhBUAQERYAQBEhBUAQERYAQBEhBUAQERYAQBEhBUAQERYAQBEhBUAQE",
              "RYAQBEhBUAQERYAQBEhBUAQGSZPQA2z58ddvvhDz8Nuz3S3pn3h90+/svzYbefv/",
              "p12O3Ht24Pu3198/6w2w8efj7s9kgjv8lIy6f3Zk/giPNiBQAQEVYAABFhBQAQEV",
              "YAABFhBQAQEVYAABFhBQAQEVYAABFhBQAQEVYAABFhBQAQEVYAABFhBQAQEVYAAB",
              "FhBQAQEVYAABFhBQAQEVYAABFhBQAQEVYAABFhBQAQEVYAAJFl9gAYafP82dkTDp",
              "y9M+8Pu/144O2Rtq9/MnvCgfP81a/Dbj++dXvY7XvDLsN/48UKACAirAAAIsIKAC",
              "AirAAAIsIKACAirAAAIsIKACAirAAAIsIKACAirAAAIsIKACAirAAAIsIKACAirA",
              "AAIsIKACAirAAAIsIKACAirAAAIsIKACAirAAAIsIKACAirAAAIsvsAcDhcfqD07",
              "MnEHn+3TezJ6zmxewBHHVerAAAIsIKACAirAAAIsIKACAirAAAIsIKACAirAAAIs",
              "IKACAirAAAIsIKACAirAAAIsIKACAirAAAIsIKACAirAAAIsIKACAirAAAIsIKAC",
              "AirAAAIsIKACAirAAAIsIKACCyzB7Aenh54cqw2w93d4bdHmnz/NnZEwA4YLxYAQ",
              "BEhBUAQERYAQBEhBUAQERYAQBEhBUAQERYAQBEhBUAQERYAQBEhBUAQERYAQBEhB",
              "UAQERYAQBEhBUAQERYAQBEhBUAQERYAQBEhBUAQERYAQBEhBUAQERYAQBEhBUAQG",
              "SZPQBeXrgy7PbG7s6w2wDwd16sAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAA",
              "AiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAAAiwg",
              "oAICKsAAAiwgoAICKsAAAiwgoAILLMHgAjvbxwZdzxvZ/H3YbJfvv+x2G3T136cN",
              "htmM2LFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAE",
              "SEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQ",
              "BARFgBAESW2QMAOHhOXfpw9gRYS16sAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAIC",
              "KsAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAA",
              "AiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAAAiwg",
              "oAICKsAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAIC",
              "KsAAAiwgoAICKsAAAiwgoAICKsAAAiwgoAICKsAAAiy+wBsK6+erYze8JKPvvoyu",
              "wJAIeWFysAgIiwAgCICCsAgIiwAgCICCsAgIiwAgCICCsAgIiwAgCICCsAgIiwAg",
              "CICCsAgIiwAgCICCsAgIiwAgCICCsAgIiwAgCICCsAgIiwAgCICCsAgIiwAgCICC",
              "sAgIiwAgCILLMHAPvrq2c7444/G3ea/fXnx1/OngBryYsVAEBEWAEARIQVAEBEWA",
              "EARIQVAEBEWAEARIQVAEBEWAEARIQVAEBEWAEARIQVAEBEWAEARIQVAEBEWAEARI",
              "QVAEBEWAEARIQVAEBEWAEARIQVAEBEWAEARIQVAEBEWAEARJbZA4DDY+visdkTiG",
              "zvzV4A68mLFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARF",
              "gBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAE",
              "SEFQBARFgBAESW2QPgxNOt2RMAIOHFCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAAC",
              "LCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCg",
              "AgIqwAACLCCgAgIqwAACLCCgAgIqwAACLL7AF0Tjzdmj2ByNbFY7MncMTdPb49e8",
              "JKtvfuzp7AEefFCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCg",
              "AgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIqwAACLCCgAgIq",
              "wAACLCCgAgIqwAACLL7AEH0YmnW7MnENm6eGz2BGAf3T2+PXvCSrb37s6eQMSLFQ",
              "BARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARF",
              "gBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAESEFQBARFgBAE",
              "T+AtUsaX2LddfKAAAAAElFTkSuQmCC"
            ]
          }
        ],
        "image": [
          "data:image/png;base64,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",
          "L+AkCdZ0GZNr71AAAAAElFTkSuQmCC"
        ],
        "mediaType": "image/png",
        "name": "hunk3888"
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