---
description: Announce poll in a channel
---

# 📢 /configure-poll announce

<mark style="background-color:red;">Black Edition</mark>

When you want to announce polls for which you have not scheduled an announcement at creation time, or if you want to publish results for polls with hidden results, you can use <mark style="background-color:orange;">/CONFIGURE-POLL ANNOUNCE</mark>. You need to provide the target channel in your Discord, to which the bot needs Send Messages permission. The bot will then post an announcement widget that includes the poll details, options, open and close times, and if you choose to publish results via the optional parameter or if the poll is public, it will also include the results.

Along with the information, the widget will also post a Cast your vote button that users can click to initiate the voting process, as well as a Verify Wallet button that guides users to wallet verification, if your poll is token-based.

&#x20;When announcing a still-running and public poll, the widget will automatically update the widget with current poll results! If the poll is private, it will post the current results only (or the final results, if posted after poll end time).

| Parameter         | Details                                                                                                                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| channel           | The channel in which you would like to post the announcement and voting widget. The bot will need Send Messages permission on the selected channel.                                                                                                                 |
| \[publishresults] | An optional parameter that will let you announce results for a non-public poll. Set the parameter to _True_ to include results, even if your poll commonly does not have public results. This comes in handy for publishing poll results after the poll has closed. |

<figure><img src="../../../.gitbook/assets/image (121).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../../.gitbook/assets/image (122).png" alt=""><figcaption></figcaption></figure>
