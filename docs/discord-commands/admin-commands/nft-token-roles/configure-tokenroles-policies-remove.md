---
description: Remove a policy from an existing token role
---

# ⚡ /configure-tokenroles policies remove

At any time you can remove all but the last policy ID/asset fingerprint combination from an existing token role using the /CONFIGURE-TOKENROLES POLICIES REMOVE command. Simply provide the parameters matching the existing combination you want to remove and tokens from the respective policy will not be considered for the role any more.

| Parameter            | Details                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| token-role-id        | The token role ID from which you would like to remove a policy. You can find this ID via [/CONFIGURE-TOKENROLES LIST](https://www.vibrantnet.io/documentation/configure-tokenroles-list). |
| policy-id            | Policy ID of the policy you want to remove from the token role.                                                                                                                           |
| \[asset-fingerprint] | If you want to remove a policy/fingerprint combination, you also have to specify the asset fingerprint.                                                                                   |

<figure><img src="../../../.gitbook/assets/image (99).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../../.gitbook/assets/image (100).png" alt=""><figcaption></figcaption></figure>
