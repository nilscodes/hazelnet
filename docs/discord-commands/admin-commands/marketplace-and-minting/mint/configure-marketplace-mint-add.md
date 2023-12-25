---
description: Add a new mint tracker
---

# 🧱 /configure-marketplace mint add

<mark style="background-color:red;">Black Edition</mark>

Set up a mint tracker for any of your official policy IDs in seconds with <mark style="background-color:orange;">/CONFIGURE-MARKETPLACE MINT ADD</mark>. Simply choose your channel for the bot to post in, and select your project in the next step. Once the tracker is set up, it will immediately post new mints under the given policy in the designated channel. Before you can add a tracker, the respective policy and project name must have been added via <mark style="background-color:orange;">/CONFIGURE-POLICY ADD</mark>.

&#x20;You can add additional criteria like only showing mints of specific traits by adding filters via our famous metadata filter system. Simply use <mark style="background-color:orange;">/CONFIGURE-MARKETPLACE METADATAFILTER ADD</mark> after adding the initial mint tracker and choose your filter settings.

&#x20;By default, there is a limit of one mint tracker per server. Should you need more trackers, contact us in our Support Discord and provide your Discord server ID.

| Parameter              | Details                                                                                                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| channel                | The channel in which you would like to automatically post the mints. The bot will need Send Messages permission on the selected channel.                                                                                                                                                         |
| \[highlight-attribute] | An optional attribute to showcase a specific attribute from your collection. Pass in a attribute path (see <mark style="background-color:orange;">/CONFIGURE-MARKETPLACE METDATAFILTER ADD</mark>) and the value of the respective metadata field will be included in the mint tracker postings. |
| \[policy-id]           | If you have more than 25 policies on your server, use this optional policy ID to target a policy directly instead of relying on the dropdown that normally comes up in step two of the add process.                                                                                              |

<figure><img src="../../../../.gitbook/assets/image (137).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../../../.gitbook/assets/image (138).png" alt=""><figcaption></figcaption></figure>
