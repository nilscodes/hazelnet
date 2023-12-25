---
description: Remove an official stakepool from this server
---

# 🗑 /configure-stakepool remove

If you no longer want a specific stakepool listed in your Discord, you can use <mark style="background-color:orange;">/CONFIGURE-STAKEPOOL REMOVE</mark> to remove it. You only need to provide the pool ID.

&#x20;You cannot remove pools from your list if they are currently used by any delegation roles (can be listed via <mark style="background-color:orange;">/CONFIGURE-DELEGATORROLES LIST</mark>)

| Parameter | Details                                                                                                                                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pool-id   | The Bech32 (pool1…) or hex-based ID of the stakepool you want to remove. You can use <mark style="background-color:orange;">/CONFIGURE-STAKEPOOL LIST</mark> to get a list of pool IDs you can remove from your server. |

<figure><img src="../../../.gitbook/assets/image (109).png" alt=""><figcaption></figcaption></figure>
