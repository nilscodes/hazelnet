---
description: Add an additional policy to an existing token role
---

# 🛡 /configure-tokenroles policies add

All automatic token role assignments require at least one policy ID (and optional asset fingerprint) to be configured. But there are times when you want NFTs from more than one policy ID to be considered for giving a community member a role. This is especially useful for projects that are using many different policies from various editions or seasons, as well as small-batch artists.

With /CONFIGURE-TOKENROLES POLICIES ADD you can easily add additional policies to your token role. Any NFT or FT from the respective policy/asset fingerprint combination will be considered for the role. If you have metadata filters configured, the filter are applied on top of the policy ID.

| Parameter            | Details                                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| token-role-id        | The token role ID for which you would like to add a policy ID. You can find this ID via [/CONFIGURE-TOKENROLES LIST](https://www.vibrantnet.io/documentation/configure-tokenroles-list).                    |
| policy-id            | Policy ID of the token that you want to be allowing for consideration for being assigned this Discord role.                                                                                                 |
| \[asset-fingerprint] | An optional asset fingerprint to be enforced in conjunction with the policy ID. Use with roles for fungible tokens when multiple have been minted on the same policy, or for "1 of 1" NFT role assignments. |

If you want to see the current policies and asset fingerprints associated with your token role, use the [/CONFIGURE-TOKENROLES LIST](https://www.vibrantnet.io/documentation/configure-tokenroles-list) or [/CONFIGURE-TOKENROLES DETAILS](https://www.vibrantnet.io/documentation/configure-tokenroles-details) commands.

&#x20;If you would like to see readable versions of your policy IDs when using these commands, we highly recommend adding your commonly used policy IDs via the [/CONFIGURE-POLICY ADD](https://www.vibrantnet.io/documentation/configure-policy-add) command.

<figure><img src="../../../.gitbook/assets/image (98).png" alt=""><figcaption></figcaption></figure>
