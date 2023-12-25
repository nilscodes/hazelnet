---
description: Set up a channel for auditing and scam warnings
---

# 👂 /configure-protection auditchannel

Once you have turned on scam protection features, you can enable your community management and moderator teams to act on suspicious messages even easier. Simply turn on auditing via <mark style="background-color:orange;">/CONFIGURE-PROTECTION AUDITCHANNEL</mark>. With this turned on and the right permissions set for the bot (Send Messages), you are now able to see any messages the bot removes, as well as their author. Your team can now easily determine if the user accidentally posted an address or if a malicious person or bot is trying to scam your community and you want to take your banhammer 🔨 to good use.

| Parameter    | Details                                                                                                                                                                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auditchannel | Choose the channel you want the bot to send suspicious messages to. The bot will need the Send Messages permission in that channel.                                                                                                                                         |
| \[status]    | Optional: Set the parameter to True if you want the audit channel feature turned on, or to False if you do not want removed messages to be audited anywhere. If you do not provide the parameter, the feature will be turned on for the channel provided via audit channel. |

<figure><img src="../../../.gitbook/assets/image (31).png" alt=""><figcaption></figcaption></figure>
