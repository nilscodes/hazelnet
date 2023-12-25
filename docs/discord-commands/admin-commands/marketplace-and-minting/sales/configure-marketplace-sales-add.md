---
description: Add a new sales tracker
---

# 🛒 /configure-marketplace sales add

<mark style="background-color:red;">Black Edition</mark>

Set up a sales tracker for any of your official policy IDs in seconds with <mark style="background-color:orange;">/CONFIGURE-MARKETPLACE SALES ADD</mark>. Simply choose your marketplace, minimum price and channel for the bot to post in, and select your project in the next step. Once the tracker is set up, it will immediately post sales matching the required criteria in the designated channel. Before you can add a tracker, the respective policy and project name must have been added via <mark style="background-color:orange;">/CONFIGURE-POLICY ADD</mark>.

💡 You can add additional criteria like only showing sales of specific traits by adding filters via our famous metadata filter system. Simply use <mark style="background-color:orange;">/CONFIGURE-MARKETPLACE METADATAFILTER ADD</mark> after adding the initial sales tracker and choose your filter settings.

⚠ By default, there is a limit of five sales trackers per server. Should you need more trackers, contact us in our Support Discord and provide your Discord server ID.

| Parameter              | Details                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| marketplace            | Select the marketplace for which want to track sales. If your marketplace of choice is not available, join our Support Discord and let us know - we'll see if we can work with them to integrate their sales.                                                                                                                           |
| channel                | The channel in which you would like to automatically post the sales. The bot will need Send Messages permission on the selected channel.                                                                                                                                                                                                |
| minimum-price          | The minimum price for the sale (in ADA) to be considered for being posted. Any sales below this amount are ignored.                                                                                                                                                                                                                     |
| \[highlight-attribute] | An optional attribute to showcase a specific attribute from your collection. Pass in a attribute path (see [/CONFIGURE-MARKETPLACE METDATAFILTER ADD](https://www.vibrantnet.io/documentation/configure-marketplace-metadatafilter-add)) and the value of the respective metadata field will be included in the sales tracker postings. |
| \[policy-id]           | If you have more than 25 policies on your server, use this optional policy ID to target a policy directly instead of relying on the dropdown that normally comes up in step two of the add process.                                                                                                                                     |

<figure><img src="../../../../.gitbook/assets/image (33).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../../../.gitbook/assets/image (34).png" alt=""><figcaption></figcaption></figure>
