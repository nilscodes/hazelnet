---
description: Generates a new token to access the API
---

# 🚪 /configure-api generatetoken

Certain features of Vibrant require you to access our REST API to retrieve data, as this data would not be safely provided via Discord or could not be used in automatic workflows and integrations with minting tools and websites otherwise. For this purposes, we are provided a unique authorization token you can use with our public REST API. Run the <mark style="background-color:orange;">/CONFIGURE-API GENERATETOKEN</mark> command to create this token for your developers.

The documentation for our API is currently only available as OpenAPI 3.0 specification at the following URL: [https://github.com/nilscodes/hazelnet/blob/main/hazelnet-external/src/main/resources/hazelnet-external-api.yml ](https://github.com/nilscodes/hazelnet/blob/main/hazelnet-external/src/main/resources/hazelnet-external-api.yml)

💡 When you generate the token, make sure to write it down in a password manager or other safe location. The token will never be displayed again, unless you generate a new one.

⚠ Keep in mind: There is only ever one active token available for your Discord server. This means if you lose the token and generate a new one, all your integrations will have to be provided with the new token. If your token gets compromised, simply generating a new token will ensure that only you have access again.

<figure><img src="../../../.gitbook/assets/image (149).png" alt=""><figcaption></figcaption></figure>
