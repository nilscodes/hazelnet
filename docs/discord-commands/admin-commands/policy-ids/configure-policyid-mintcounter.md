---
description: Track your mint count in Discord
---

# 🔢 /configure-policyid mintcounter

If you need to track how many items are minted on a specific policy, you can simply turn any voice channel into a counter. Run /CONFIGURE-POLICY MINTCOUNTER and designate which channel and policy ID to track, and you are good to go! Optionally, you can set up the maximum count if you are targeting a number that corresponds to selling out.

&#x20;The bot will continuously need the View Channel, Manage Channel and Connect permissions to the respective voice channel to be able to update its name. The name change to the current mint count happens every five minutes at most, due to the rate limits that Discord has put in place.

| Parameter     | Details                                                                                                                                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| voice-channel | Choose the channel you want the bot to update with the current mint count at a regular interval. It needs to be a Discord voice channel the bot has View Channel, Manage Channel and Connect permissions to.                                              |
| policy-id     | Policy ID to track the mint counts for.                                                                                                                                                                                                                   |
| \[max-count]  | Add a maxmium count to your mint counter if you have an upper limit of items you are minting and want to show it alongside the current count.                                                                                                             |
| \[status]     | Optional: Set the parameter to True if you want the mint counter feature turned on, or to False if you want to stop tracking mint counts. If you do not provide this parameter, the feature will be turned on for the channel provided via voice-channel. |

<figure><img src="../../../.gitbook/assets/image (89).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../../.gitbook/assets/image (90).png" alt=""><figcaption></figcaption></figure>
