---
description: Get details on a specific token role
---

# 🔤 /configure-tokenroles details

If you need to see the detailed settings for a token role, you can use the /CONFIGURE-TOKENROLES DETAILS command. It will show all the conditions that need to be fulfilled for someone to be assigned this role. Simple run the command with the respective token role ID.

| Parameter     | Details                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| token-role-id | The token role ID for which you would like to see details. You can find this ID via <mark style="background-color:orange;">/CONFIGURE-TOKENROLES LIST.</mark> |

<figure><img src="../../../.gitbook/assets/image (93).png" alt=""><figcaption></figcaption></figure>

💡 The following settings are visible on your token role details page and help explain to whom the Discord role will be assigned and to whom not.

|   | Minimum count                 | The minimum count of tokens required to receive the role. Anyone with less tokens matching the requirements will not receive the associated Discord role.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| - | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   | Maximum count (optional)      | <p>The maximum count of tokens required to receive the role. Anyone with more tokens matching the requirements will not receive the associated Discord role.</p><p>This is a useful parameter to build role-ladders, where for example a user with 1-4 tokens gets a different role than a user with 5-10 etc and you do not want the owner of five or more to receive the lower role.</p>                                                                                                                                                                                                                                                                                       |
|   | Policies                      | At least one policy ID is required for your token role. Via the <mark style="background-color:orange;">/CONFIGURE-TOKENROLES POLICIES ADD</mark> you can add additional policy IDs. Any NFT that belongs to the policy IDs of the token role is considered for the assignment. If you define three policies and a user owns one of each policy, their NFT count for this role will be 3 (unless additional metadata filters apply - see below)                                                                                                                                                                                                                                   |
|   | Asset Fingerprints (optional) | Asset fingerprints can only be added in connection with a policy ID (see above). Only use them if you are using fungible tokens and have multiple FTs within one policy ID or if you want to identify "1 of 1" NFTs. You can find the asset fingerprint of your token on a blockchain explorer of your choice or pool.pm. If you add an asset fingerprint, only tokens that match the exact fingerprint will be considered towards the minimum and maximum counts.                                                                                                                                                                                                               |
|   | Metadata Filters (optional)   | <p>Metadata filters give you ultimate control over which tokens are considered for a role and which do not. The filter only apply to the JSON metadata under the "721" attribute, as defined in <a href="https://developers.cardano.org/docs/governance/cardano-improvement-proposals/CIP-0025">CIP-0025 </a></p><p>Use the command <mark style="background-color:orange;">/CONFIGURE-TOKENROLES METADATAFILTER ADD</mark> to add up to three filters to your existing role. All added filter conditions must be met by an NFT to be considered for the minimum/maximum token count, in addition to matching one of the configured policy ID/asset fingerprint combinations.</p> |
