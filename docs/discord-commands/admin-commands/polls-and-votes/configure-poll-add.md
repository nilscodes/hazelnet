---
description: Add a new poll and its details
---

# ➕ /configure-poll add

<mark style="background-color:red;">Black Edition</mark>

With the <mark style="background-color:orange;">/CONFIGURE-POLL ADD</mark> command you can create powerful polls for your community, right within Discord. The polls range from simple questionnaires for everyone on your server to weighted votes based on token ownership for verified wallets with dedicated snapshot dates and hidden results.

⚠ There are multiple steps to create a poll after running the actual command, and these steps have to be done in a specific order, as described below. Ensure that you run these commands in a channel the bot has rights to Read Messages, because certain inputs are typed into the channel. We highly recommend to use a private channel or channel only your moderators have access to.

*   ### 1. Description

    Provide a description to explain what your poll is about

    The description has to be typed into the channel and can contain Discord markup to make it more interesting or readable. There is a 4000 character limit in place for your poll description. The whole description has to be sent in one message. After sending the message, the poll widget will show you a preview of your text and you can click a button to either to start over with another description or to use the one you typed and move on to step 2.
*   ### 2. Poll Choices

    Enter the poll choices

    The widget now asks you to send at least two and at most ten different options as individual messages to the channel. When you send in an option, it will appear in the widget immediately. To complete this step, add a reaction (using Discord reactions!) to each of your options. Only once each choice has a reaction, the bot will allow you to continue. You can then either reset and start again or click _Use these options_ to go to step 3.
*   ### 3. Configuration

    Choose the settings for your poll

    You can now choose your visibility settings (are the poll results visible at all time or only viewable once you manually publish via <mark style="background-color:orange;">/CONFIGURE-POLL ANNOUNCE</mark>). You can also determine if the voter can only select one choice or multiple choices. Lastly, you can determine if only verified token-owners can participate in your poll or if anyone can vote. If you choose _Everyone_, you can immediately create the poll with the _Create poll_ button.

    If you choose to that only token holders can vote (either one vote per holder or weighted based on number of tokens owned), the poll system will let you click _Provide token details_ in an optional 4th step.
*   ### 4. Optional: Token details

    Provide token policy ID and optional asset fingerprint for a voting snapshot

    As the last step, if doing a token-based poll, you can now send a message to the channel with the policy ID that determines who can vote and who cannot. In addition, you can also provide an asset fingerprint, if you are using a policy that has multiple different fungible tokens minted on it and you would just like to allow one of them to be used in the ownership/weighting calculation. If using asset fingerprints, your message should look as follows: policyid+assetfingerprint.

    Once the details have been sent to the channel and the format of the policy ID and asset fingerprint have been verified, you can click _Create Poll_. This will immediately kick off a blockchain snapshot to collect the current owners of tokens for the given policy ID. Only the users that have the respective verified wallet can participate in the poll.

Below are the initial options you can provide to the command, which will further allow you to customize your poll, set up automatic announcements etc.

| Parameter          | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| poll-displayname   | The display name for your poll. It is the official name shown in all announcements and when using the <mark style="background-color:orange;">/VOTE</mark> command.                                                                                                                                                                                                                                                                                                                                                                            |
| poll-name          | The internal name for the poll. It is used for API access and can only contain lower and upper case letters from A-Z, as well as numbers. Your users will never see this name.                                                                                                                                                                                                                                                                                                                                                                |
| poll-opentime      | <p>The exact time at which the poll opens, in the specific format </p><pre><code>2022-01-01T19:00:00Z
</code></pre><p> in UTC time zone (note the T between date and time and the Z at the end). After the poll opens, anyone who fulfills the conditions can vote. If you have designated a publish-channel, this is also the time at which the poll widget will be posted there.</p>                                                                                                                                                        |
| poll-closetime     | <p>The exact time at which the poll closes, in the specific format </p><pre><code>2022-02-05T23:00:00Z
</code></pre><p> in UTC time zone. After this time, no one can vote in the poll any more, even if they fulfill all the conditions. No automatic announcement will be made at poll close time. The poll information can still be accessed via <mark style="background-color:orange;">/VOTE</mark> after this time.</p>                                                                                                                  |
| \[required-role]   | Optional: If you want to limit the people that can participate in a poll, you can set a role that is required to even see or vote in the poll. This role can be manually assigned or can be a token- or delegation- based role managed by Vibrant. Keep in mind, that this is not an replacement for snapshot-based token voting, but an additional mechanism. This is because roles can change when people trade tokens or redelegate. When using a token-based vote, only the data from the snapshot (at poll creation time) is considered. |
| \[publish-channel] | Optional: The channel in which you would like to automatically post the announcement and signup widget at the time the poll opens. The bot will need Send Messages permission on the selected channel. If you do not provide a channel, you can always manually publish the results via <mark style="background-color:orange;">/CONFIGURE-POLL ANNOUNCE</mark>                                                                                                                                                                                |

<figure><img src="../../../.gitbook/assets/image (116).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../../.gitbook/assets/image (118).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../../.gitbook/assets/image (119).png" alt=""><figcaption></figcaption></figure>
