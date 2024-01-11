---
description: Delete the current access token (⚠ disables all API access)
---

# 🛡 /configure-api removetoken

If for any reason you do not need your API token any more, or you want to quickly disable any integrations that currently are accessing your Vibrant data, you can run <mark style="background-color:orange;">/CONFIGURE-API REMOVETOKEN</mark> to invalidate the current authentication token.

⚠ Keep in mind: There is only ever one active token available for your Discord server. If you disable the token, any integrations you had set up will not work until provided with a new token generated by the <mark style="background-color:orange;">/CONFIGURE-API GENERATETOKEN</mark> command.

<figure><img src="../../../.gitbook/assets/image (150).png" alt=""><figcaption></figcaption></figure>