---
description: Remove an existing delegator role
---

# 🗑 /configure-delegatorroles remove

<mark style="background-color:orange;">/CONFIGURE-DELEGATORROLES REMOVE</mark> provides a simple command to remove existing delegation roles. All you need to do is call the command with the respective delegator role ID.

💡 If you remove the last delegator role that is managing a Discord role, all users that currently still have this role in Discord will remain unchanged. Vibrant will not remove any assigned users after this point.

| Parameter         | Details                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| delegator-role-id | The delegator role ID which you would like to remove. You can find this ID via <mark style="background-color:orange;">/CONFIGURE-DELEGATORROLES LIST</mark>. |

<figure><img src="../../../.gitbook/assets/image (113).png" alt=""><figcaption></figcaption></figure>
