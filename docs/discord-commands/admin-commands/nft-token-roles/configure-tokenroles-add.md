---
description: Add a new automatic token role
---

# ➕ /configure-tokenroles add

The most important command to add new automatic role-assignments to your Discord server is <mark style="background-color:orange;">/CONFIGURE-TOKENROLES ADD</mark>. It allows you to create a new set of requirements that needs to be fulfilled to be automatically assigned a Discord role. You can then use this Discord role to further enable other features in your Discord and with the Vibrant bot - like whitelists, polls and holder-only channels and giveaways.

Run the command with the respective parameters below. If you just want a simple holder role however, this add command is all you will need! If you want more, you can further refine your newly created role using the <mark style="background-color:orange;">/CONFIGURE-TOKENROLES POLICIES ADD</mark> and <mark style="background-color:orange;">/CONFIGURE-TOKENROLES METADATAFILTER ADD</mark> subcommands, to set up your exact requirements. Make sure to check out the different aggregation-type options in <mark style="background-color:orange;">/CONFIGURE-TOKENROLES UPDATE</mark> for the full range of token role combinations.

You will need Black Edition if you plan to use more than one token role on your server.

### Examples

Some basic parameter examples and what type of roles this will create:

/configure-tokenroles addpolicy-id d5e6bf0500378d4f0da4e8dde6becec7621cd8cbf5cbb9b87013d4ccrole @Spacebudcount 1

The most simple rule of all will simply assign the role @Spacebud to any user in your Discord that has verified their wallet via <mark style="background-color:orange;">/VERIFY ADD</mark> and has at least one NFT of the Spacebudz policy ID in their wallet.

/configure-tokenroles addpolicy-id 1ec85dcee27f2d90ec1f9a1e4ce74a667dc9be8b184463223f9c9601role @PXLZ-Teencount 10max-count 19

When introducing the max-count parameter, we can assign verified holders the @PXLZ-Teen role if they have between ten and nineteen PXLZ in their wallets.

/configure-tokenroles addpolicy-id 20cd68533b47565f3c61efb39c30fdace9963bfa4c0060b613448e3crole @Tokenholdercount 1 000 000asset-fingerprint asset1049lrykcltek029z0hfrzn720hvp8j2mq4zf07

With asset-fingerprint we can target individual tokens - especially helpful if multiple fungible currencies are minted under the same policy. In this case, the role @Tokenholder will be given to any verified holders of one million or more tokens with the defined asset fingerprint from the respective policy ID. Alternatively, one can assign roles for specific NFTs from your collection via the fingerprint.

| Parameter            | Details                                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| policy-id            | Policy ID of the token that will be required to be held to be considered to be assigned the Discord role.                                                                                                   |
| role                 | The Discord role verified users will be assigned if they meet all requirements.                                                                                                                             |
| count                | The minimum token count required to qualify for the role.                                                                                                                                                   |
| \[max-count]         | The optional maximum token count allowed to qualify for the role (owning more tokens than this number will disqualify a user for this role)                                                                 |
| \[asset-fingerprint] | An optional asset fingerprint to be enforced in conjunction with the policy ID. Use with roles for fungible tokens when multiple have been minted on the same policy, or for "1 of 1" NFT role assignments. |



<figure><img src="../../../.gitbook/assets/image (95).png" alt=""><figcaption></figcaption></figure>
