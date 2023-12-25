---
description: Turn a voice channel into an Epoch Clock
---

# ⌚ /configure-info epochclock

If you need to track what Cardano Epoch it is or how much time is left in the current Epoch, you can simply turn any voice channel into an Epoch Clock. Run /CONFIGURE-INFO EPOCHCLOCK and designate which channel, and you are good to go!

💡 The bot will continuously need the View Channel, Manage Channel and Connect permissions to the respective voice channel to be able to update its name. The name change to the currently remaining Epoch time happens every five minutes at most, due to the rate limits that Discord has put in place.

| Parameter | Details                                                                                                                                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| channel   | Choose the channel you want the bot to update with the current Epoch time at a regular interval. It needs to be a Discord voice channel the bot has View Channel, Manage Channel and Connect permissions to.                                          |
| \[status] | Optional: Set the parameter to True if you want the epoch clock feature turned on, or to False if you want to stop tracking the Epoch time. If you do not provide this parameter, the feature will be turned on for the channel provided via channel. |

<figure><img src="../../../.gitbook/assets/image (105).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../../.gitbook/assets/image (106).png" alt=""><figcaption></figcaption></figure>
