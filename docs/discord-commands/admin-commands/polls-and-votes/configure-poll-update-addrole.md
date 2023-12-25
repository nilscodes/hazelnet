---
description: Add an eligible role to an existing poll
---

# 🧑 /configure-poll update addrole

<mark style="background-color:red;">Black Edition</mark>

During or after creation of a poll, you can add additional roles that are allowed to see the poll via <mark style="background-color:orange;">/CONFIGURE-POLL UPDATE ADDROLE</mark>. Simply choose the role you want to add, and only users that have at least one of the roles designated as required roles for a poll will be allowed to see it or vote in it. If no roles are required for a poll, it is visible to everyone.

⚠ If the poll is holder-based, ownership of the required token at snapshot time is required in addition to the role.

| Parameter     | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| required-role | If you want to limit the people that can participate in a poll, you can add one or more roles that are required to even see or vote in the poll. This role can be manually assigned or can be a token- or delegation- based role managed by Vibrant. Keep in mind, that this is not an replacement for snapshot-based token voting, but an additional mechanism. This is because roles can change when people trade tokens or redelegate. When using a token-based vote, only the data from the snapshot (at poll creation time) is considered. |

<figure><img src="../../../.gitbook/assets/image (123).png" alt=""><figcaption></figcaption></figure>
