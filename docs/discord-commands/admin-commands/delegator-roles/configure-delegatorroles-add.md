---
description: Add a new automatic delegator role
---

# ➕ /configure-delegatorroles add

Manage your automatic Discord roles based on verified delegators to your stakepool(s) by leveraging <mark style="background-color:orange;">/CONFIGURE-DELEGATORROLES ADD</mark>. You need to provide a minimum stake amount and a role to define, and within less than an hour, your verified users will receive a Discord role if any of their verified wallets qualifies for your delegation role requirements.

You will need <mark style="background-color:red;">Black Edition</mark> if you plan to use more than one delegation role on your server, or if you want to add multiple stakepools.

⚠ You can only add delegation roles for pools you have added via <mark style="background-color:orange;">/CONFIGURE-STAKEPOOLS ADD</mark>. If you receive an error that the role cannot be created, make sure you add a supported pool and then try adding the role again.

| Parameter     | Details                                                                                                                                                                                                                                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| role          | The Discord role verified users will be assigned if they meet all delegation requirements.                                                                                                                                                                                                                                                                                    |
| minimum-stake | The minimum delegation amount (in ADA) required to qualify for the role.                                                                                                                                                                                                                                                                                                      |
| \[pool-id]    | Optional: The Bech32 (pool1…) or hex-based ID of the stakepool the user needs to delegate to. This parameter is only useful if you have multiple pools and only want to give the role to delegators of specific pools. Otherwise, it will give the role to delegators to any of the pools listed by <mark style="background-color:orange;">/CONFIGURE-STAKEPOOLS LIST</mark>. |

<figure><img src="../../../.gitbook/assets/image (111).png" alt=""><figcaption></figcaption></figure>
