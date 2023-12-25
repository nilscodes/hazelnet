---
description: Add a metadata filter to an existing token role
---

# ➕ /configure-tokenroles metadatafilter add

The /CONFIGURE-TOKENROLES METADATAFILTER ADD command is possibly one of the most powerful commands in the arsenal of an NFT project. It enables you to assign roles based on individual traits of NFTs for all of your verified holders. You can have none, one or multiple filters active at the same time and combine them in powerful ways, to target exactly the population of your holders you would like to. You can use it to exclude certain traits, find 1/1s, or give a role to those that own the _Green underwear_ NFTs.

To get a metadata filter role working, simply start with the normal process of adding a token role via [/CONFIGURE-TOKENROLE ADD](https://www.vibrantnet.io/documentation/configure-tokenroles-add). After adding the role, you can add metadata filters via /CONFIGURE-TOKENROLES METADATAFILTER ADD. When adding a filter, you will be asked for four things. The token-role-id (which you can retrieve from [/CONFIGURE-TOKENROLES LIST](https://www.vibrantnet.io/documentation/configure-tokenroles-list)) is the first one and indicates which role the filter will be applied to. The attribute path is the second parameter and determines where in your metadata we will search for the specific attribute you would like to include or exclude. The operator specifies how we search for data in your retrieved attribute. Lastly, we ask for an attribute-value, meaning the content you want to include or exclude. A detailed explanation of all parameters is provided below our examples.

&#x20;If you are not sure how to build the correct attribute-path or attribute-value, you can leverage our [Metadata filter builder](https://www.vibrantnet.io/metadata-filter-builder) to help you out.

&#x20;It is important to note that both attribute-path and attribute-value are case sensitive and need to exactly match your metadata. If your metadata attribute is Rarity, using an attribute-path rarity will NOT work.

&#x20;When having special characters and whitespace in your attribute path, you may have to wrap your attribute names in double quotes or use a native JSONpath expression. Please see our examples below for specifics.

### Examples

Here are a few detailed examples with prototype metadata and how to set up a filter for that specific case.

/configure-tokenroles metadatafilter addtoken-role-id 13attribute-path typeoperator equalsattribute-value Cat

With this metadata filter applied to token role ID 13 (which we have set up to include the Spacebudz policy and a count of 1), everyone will get the respective Discord role @BudzCat if they have a Spacebudz cat. The metadata that goes with this filter is as follows and our attribute-path is simply a first-level attribute.

### Sample Metadata

```
{
  "arweaveId": "Bqt7gfA8AbD2O5oQC_PG8yYdIQj9wQD3SUVP4rhw_uA",
  "image": "ipfs://QmVYZPT3WWfeBzzYhEamneAFvTe85hPF4QH1qFJBwjfwHA",
  "name": "SpaceBud #2729",
  "traits": [
    "Chestplate",
    "Belt",
    "Covered Helmet",
    "Axe",
    "Pistol"
  ],
  "type": "Cat"
}
```

/configure-tokenroles metadatafilter addtoken-role-id 14attribute-path traitsoperator containsattribute-value Axe

With this metadata filter applied to token role ID 14 (which we have set up to include the Spacebudz policy and a count of 1), everyone will get the respective Discord role @AxeBud if they have a Spacebudz with "Axe" in the list of traits. With the attribute-path referencing a list of attributes (denoted by the \[ ] brackets around the traits attribute content), we use the contains operator to match our text with the items in the list.

### Sample Metadata

```
{
  "arweaveId": "Bqt7gfA8AbD2O5oQC_PG8yYdIQj9wQD3SUVP4rhw_uA",
  "image": "ipfs://QmVYZPT3WWfeBzzYhEamneAFvTe85hPF4QH1qFJBwjfwHA",
  "name": "SpaceBud #2729",
  "traits": [
    "Chestplate",
    "Belt",
    "Covered Helmet",
    "Axe",
    "Pistol"
  ],
  "type": "Cat"
}
```

/configure-tokenroles metadatafilter addtoken-role-id 14attribute-path traitsoperator containsattribute-value Axe/configure-tokenroles metadatafilter addtoken-role-id 14attribute-path traitsoperator containsattribute-value Pistol

In this case, we are applying TWO filters to our existing role for the Spacebudz policy. A user will now get the respective Discord role @DualWielder only if they have a Spacebudz that has both an "Axe" and a "Pistol" in the list of traits.

&#x20;Alternative 1: By running [/CONFIGURE-TOKENROLES UPDATE](https://www.vibrantnet.io/documentation/configure-tokenroles-update) and changing the aggregation-type to OR, everyone who either has a Spacebud with an Axe or a Spacebud with a Pistol will be considered.

&#x20;Alternative 2: By running [/CONFIGURE-TOKENROLES UPDATE](https://www.vibrantnet.io/documentation/configure-tokenroles-update) and changing the aggregation-type to ONE OF EACH, users only receive the role if they have one NFT matching each attribute. This means only people that own two Spacebudz, one with an Axe and one with a Pistol, would be assigned the role. This can be used to create roles for people that own "one of each type".

### Sample Metadata

```
{
  "arweaveId": "Bqt7gfA8AbD2O5oQC_PG8yYdIQj9wQD3SUVP4rhw_uA",
  "image": "ipfs://QmVYZPT3WWfeBzzYhEamneAFvTe85hPF4QH1qFJBwjfwHA",
  "name": "SpaceBud #2729",
  "traits": [
    "Chestplate",
    "Belt",
    "Covered Helmet",
    "Axe",
    "Pistol"
  ],
  "type": "Cat"
}
```

/configure-tokenroles metadatafilter addtoken-role-id 15attribute-path attributes.Armoroperator starts withattribute-value Ice

If you have nested attributes like in this Tavern Squad NFT, you can simply access subattributes via a period. In our example we use _attributes.Armor_ (not the case sensitive attribute names). In this case, we are filtering for any NFT where the Armor subattribute starts with the text Ice. This would include an Armor of the type Ice Chainmail but also any NFT with the Armor Ice Platemail or just Ice.

### Sample Metadata

```
{
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
}
```

/configure-tokenroles metadatafilter addtoken-role-id 16attribute-path properties\[?(@.key=="type")].valueoperator equalsattribute-value dead

For a more complicated attribute-path, we are using the DEADPXLZ project as an example. In this case, the attribute path value is _properties\[?(@.key=="type")].value_, which means in the list of properties, we find the entry where the key attribute is type, and of that object, we then ask for the value attribute and check if it equals dead.

&#x20;Vibrant allows for very complex attribute paths and leverages the power of JSONpath to query any part of your metadata. Find more information in one of the many [JsonPath documentation pages ](https://goessner.net/articles/JsonPath/). You can play around and test your attribute-path with our [Metadata filter builder](https://www.vibrantnet.io/metadata-filter-builder).

### Sample Metadata

```
{
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
    "soul patch",
    "smoking"
  ],
  "type": "text/html"
}
```

/configure-tokenroles metadatafilter addtoken-role-id 17attribute-path \["Jaw & Teeth"]operator equalsattribute-value Gold

When your attribute-path contains special characters or whitespace, you will need to use special square bracket expressions to match it. You will need to wrap your attribute name in brackets and double quotes, like in the above example. For your attribute path you would then use \["Attribute with Space"]. If you are nesting deeper and you have non-whitespace attributes in between, you can either use the same syntax or the dot-notation: \["Jaw & Teeth"].color\["hue amount"] and \["Jaw & Teeth"]\["color"]\["hue amount"] are the same. Note there is no dot behind color in the first version.

&#x20;We highly recommend to test your attribute-path with our [Metadata filter builder](https://www.vibrantnet.io/metadata-filter-builder) first in this case.

### Sample Metadata

```
{
  "Accessory": "Cross Bones",
  "Artist": "twitter.com/xjoshuajones",
  "Background": "Mint",
  "Base Skull": "Gold",
  "Eyes": "Robot Eyes",
  "Jaw & Teeth": "Gold",
  "Nemonium": "twitter.com/_nemonium",
  "Website": "nemo.global",
  "description": "Calvaria ",
  "name": "Skull_3439"
}
```

/configure-tokenroles metadatafilter addtoken-role-id 14attribute-path typeoperator equalsattribute-value Cattoken-weight 5/configure-tokenroles metadatafilter addtoken-role-id 14attribute-path typeoperator does not equalattribute-value Cattoken-weight 1

In this case, we are applying two filters with different token-weight to our existing role for the Spacebudz policy. A user will now get the respective Discord role @TenOrMore only if they have either two cats, ten non-cats or one cat and five non-cats (or anything else that adds up to ten or more).

&#x20;Configuration: By running [/CONFIGURE-TOKENROLES UPDATE](https://www.vibrantnet.io/documentation/configure-tokenroles-update) on our main role and changing the count to 10 and the aggregation-type to _Any policy of the role, each NFT must match at least one filter_, users only receive the role if they have a combined filtered token count of ten or more. This is best used with filters that are mutually exclusive, to enable weighted token roles based on metadata.

### Sample Metadata

```
{
  "arweaveId": "Bqt7gfA8AbD2O5oQC_PG8yYdIQj9wQD3SUVP4rhw_uA",
  "image": "ipfs://QmVYZPT3WWfeBzzYhEamneAFvTe85hPF4QH1qFJBwjfwHA",
  "name": "SpaceBud #2729",
  "traits": [
    "Chestplate",
    "Belt",
    "Covered Helmet",
    "Axe",
    "Pistol"
  ],
  "type": "Cat"
}
```

### Parameters

| Parameter       | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| token-role-id   | The token role ID to which you would like to add a metadata filter. You can find this ID via [/CONFIGURE-TOKENROLES LIST](https://www.vibrantnet.io/documentation/configure-tokenroles-list).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| attribute-path  | The attribute name or JSON path within your NFT metadata that you would like to filter values for. See below for some common examples of attributes and respective metadata.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| operator        | <p>Once the attribute has been extracted, what operator would you like to compare the value to. The operator can be one of the following:</p><h3>equals</h3><p>The text extracted from attribute-path must exactly match (case sensitive) the attribute-value. Use this only when the targeted attribute is a number or text.</p><h3>does not equal</h3><p>The text extracted from attribute-path may not be exactly the same (case sensitive) as the text provided via the attribute-value. Use this only when the targeted attribute is a number or text.</p><h3>contains</h3><p>The contains operator works with both text and list attributes (see examples below). If the data extracted from attribute-path is a text, the filter condition is met if it contains the text (case sensitive) provided via attribute-value.</p><p>If the data extracted from attribute-path is a list, the filter condition is met if any one of the items in the list exactly matches (case sensitive) the text from the attribute-value parameter.</p><h3>does not contain</h3><p>The does not contain operator works with both text and list attributes (see examples below). If the data extracted from attribute-path is a text, the filter condition is met if it does not contain the text (case sensitive) provided via attribute-value.</p><p>If the data extracted from attribute-path is a list, the filter condition is met if none one of the items in the list matches (case sensitive) the text from the attribute-value parameter.</p><h3>starts with</h3><p>The text extracted from attribute-path must start with the same (case sensitive) as the text provided via the attribute-value. Use this only when the targeted attribute is a number or text.</p><h3>ends with</h3><p>The text extracted from attribute-path must end with the same (case sensitive) as the text provided via the attribute-value. Use this only when the targeted attribute is a number or text.</p> |
| attribute-value | The attribute value is what the filter will compare the content found via the attribute-path with. For more details, see examples and the explanation within the operator parameter above.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| \[token-weight] | An optional weight to give to tokens when using the aggregation-type  _Any policy of the role, each NFT must match at least one filter_. A token matching this specific filter will count as this number of tokens towards the minimum count. If not provided, defaults to 1, which means it counts as one token.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

<figure><img src="../../../.gitbook/assets/image (101).png" alt=""><figcaption></figcaption></figure>
