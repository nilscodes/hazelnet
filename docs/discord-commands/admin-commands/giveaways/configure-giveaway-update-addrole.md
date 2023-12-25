# 🧑 /configure-giveaway update addrole

<mark style="background-color:red;">Black Edition</mark>

During or after creation of a giveaway, you can add additional roles that are allowed to join the giveaway via <mark style="background-color:orange;">/CONFIGURE-GIVEAWAY UPDATE ADDROLE</mark>. Simply choose the role you want to add, and only users that have at least one of the roles designated as required roles for a giveaway will be allowed to participate in it. If no roles are required for a giveaway, it is accessible to everyone.

⚠ If the giveaway is holder-based, ownership of the required token at snapshot time is required in addition to the role.

| Parameter     | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| required-role | If you want to limit the people that can participate in a giveaway, you can add one or more roles that are required to join the giveaway. This role can be manually assigned or can be a token- or delegation- based role managed by Vibrant. Keep in mind, that this is not an replacement for snapshot-based join conditions, but an additional mechanism. This is because roles can change when people trade tokens or redelegate. When using a token-based giveaway, only the data from the snapshot (at giveaway creation time) is considered. |

<figure><img src="../../../.gitbook/assets/image (4).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../../.gitbook/assets/image (5).png" alt=""><figcaption></figcaption></figure>
