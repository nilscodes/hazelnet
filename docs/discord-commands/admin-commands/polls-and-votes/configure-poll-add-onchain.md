---
description: Add a new Voteaire poll
---

# 🔗 /configure-poll add-onchain

With the <mark style="background-color:orange;">/CONFIGURE-POLL ADD-ONCHAIN</mark> command you can effortlessly incorporate the on-chain voting system [Voteaire ](https://voteaire.io/) into your Discord.

After creating the ballot on the above website, you can present the poll in your community with this command and publish a widget that lets users see the current results and immediately go to the ballot website to cast their vote, if the ballot is still open. To get started, you only need your Voteaire ballot ID, which you can find in the Hyperlink to your ballot.

&#x20;While Voteaire currently supports multiple questions per ballot, the bot can currently only display the first question and its results.

| Parameter          | Details                                                                                                                                                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ballot-id          | The Voteaire ballot ID (in the format of a GUID like _1286a916-a29c-4a41-b2e2-d157c08c1bc5_) to add as a poll in your Discord.                                                                                                                                                                                   |
| \[publish-channel] | Optional: The channel in which you would like to automatically post the announcement and signup widget at the time the poll opens. The bot will need Send Messages permission on the selected channel. If you do not provide a channel, you can always manually publish the results via /CONFIGURE-POLL ANNOUNCE |

<figure><img src="../../../.gitbook/assets/image (120).png" alt=""><figcaption></figcaption></figure>
