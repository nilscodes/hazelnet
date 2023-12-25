---
description: Remove an existing token role
---

# 🗑 /configure-tokenroles remove

<mark style="background-color:orange;">/CONFIGURE-TOKENROLES REMOVE</mark> provides a simple command to remove existing token roles. All you need to do is call the command with the respective delegator role ID. All policies, asset fingerprints and metadata filters will be removed along with the role itself.

&#x20;If you remove the last token role that is managing a Discord role, all users that currently still have this role in Discord will remain unchanged. Vibrant will not remove any assigned users after this point.

| Parameter     | Details                                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| token-role-id | The token role ID which you would like to remove. You can find this ID via [/CONFIGURE-TOKENROLES LIST](https://www.vibrantnet.io/documentation/configure-tokenroles-list). |

<figure><img src="../../../.gitbook/assets/image (104).png" alt=""><figcaption></figcaption></figure>
