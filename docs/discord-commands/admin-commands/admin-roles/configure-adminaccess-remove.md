---
description: Remove a role that is currently allowed to administer the bot
---

# 🔓 /configure-adminaccess remove

You can remove Vibrant administrators by running the <mark style="background-color:orange;">/CONFIGURE-ADMINACCESS REMOVE</mark> command and passing the role you want to remove permissions from as a parameter. The users will immediately not be able to use /CONFIGURE-… commands any more, even if these commands are still executable for them due to Discord permissions

💡 To improve your moderators user experience, we recommend also denying them permissions from the commands via the Discord permission system. This way the commands do not pollute their command autocompletes when they interact with your server. To update their permissions, go to Server Settings ➡ Integrations ➡ Vibrant Community System and remove their permissions for all administrative command by unassigning the role you have just removed.

| Parameter  | Details                                                            |
| ---------- | ------------------------------------------------------------------ |
| admin-role | The Discord role you want to remove administrator privileges from. |

<figure><img src="../../../.gitbook/assets/image (148).png" alt=""><figcaption></figcaption></figure>
