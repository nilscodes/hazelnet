---
description: Add a new listing tracker
---

# 💲 /configure-marketplace listings add

<mark style="background-color:red;">Black Edition</mark>

Set up a listing tracker for any of your official policy IDs in seconds with <mark style="background-color:orange;">/CONFIGURE-MARKETPLACE LISTINGS ADD</mark>. Simply choose your marketplace, minimum price and channel for the bot to post in, and select your project in the next step. Once the tracker is set up, it will immediately post any new listings matching the required criteria in the designated channel. Before you can add a tracker, the respective policy and project name must have been added via <mark style="background-color:orange;">/CONFIGURE-POLICY ADD</mark>.

&#x20;You can add additional criteria like only showing listings for specific traits by adding filters via our famous metadata filter system. Simply use <mark style="background-color:orange;">/CONFIGURE-MARKETPLACE METADATAFILTER ADD</mark> after adding the initial listing tracker and choose your filter settings.

&#x20;By default, there is a limit of five listing trackers per server. Should you need more trackers, contact us in our Support Discord and provide your Discord server ID.

| Parameter              | Details                                                                                                                                                                                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| marketplace            | Select the marketplace for which want to track listings. If your marketplace of choice is not available, join our Support Discord and let us know - we'll see if we can work with them to integrate their listings.                                                                                  |
| channel                | The channel in which you would like to automatically post the listings. The bot will need Send Messages permission on the selected channel.                                                                                                                                                          |
| minimum-price          | The minimum price for the listing (in ADA) to be considered for being posted. Any listings below this amount are ignored.                                                                                                                                                                            |
| \[highlight-attribute] | An optional attribute to showcase a specific attribute from your collection. Pass in a attribute path (see <mark style="background-color:orange;">/CONFIGURE-MARKETPLACE METDATAFILTER ADD</mark>) and the value of the respective metadata field will be included in the listings tracker postings. |
| \[policy-id]           | If you have more than 25 policies on your server, use this optional policy ID to target a policy directly instead of relying on the dropdown that normally comes up in step two of the add process.                                                                                                  |

<figure><img src="../../../../.gitbook/assets/image (38).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../../../.gitbook/assets/image (39).png" alt=""><figcaption></figcaption></figure>
