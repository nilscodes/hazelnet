---
description: Turn on/off autoremoval of address-containing messages
---

# 💂‍♀️ /configure-protection addressremove

The /CONFIGURE-PROTECTION ADDRESSREMOVE command lets you toggle one of the most important security mechanisms: Protection from addr1-addresses being publicly posted in your Discord. This is a mechanism to protect from both scams and your community members accidentally revealing their own addresses. If this feature is turned on, the bot will remove messages that contain _addr1_ from any channels the bot has the Read Messages and Manage Messages permission in.

💡 This feature is best used in conjunction with <mark style="background-color:orange;">/CONFIGURE-PROTECTION AUDITCHANNEL</mark>. If both are set up at the same time, any suspicious messages will not only be removed, but also reported in the configured channel, for your moderators to assess and take appropriate action. If a scammer tries to hijack your mint, simply ban them.

| Parameter | Details                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| status    | Set the parameter to True if you want the feature turned on, or to False if you want address protection to be off. |

<figure><img src="../../../.gitbook/assets/image (30).png" alt=""><figcaption></figcaption></figure>
