---
description: Adds a role that is allowed to administer the bot
---

# 🔒 /configure-adminaccess add

If you want to add additional roles to your Vibrant administrators, you can simply add them via <mark style="background-color:orange;">/CONFIGURE-ADMINACCESS ADD</mark>. The role will immediately be able to use any of the <mark style="background-color:orange;">/CONFIGURE-…</mark> commands, provided you have also given them command permissions.

⚠ If a user reports that they cannot use the administrative commands even though you have their role assigned as administrator, make sure they also have the Discord-based command permissions. Go to **Server Settings ➡ Integrations ➡ Vibrant Community System** and find the commands they need access to. In that User Interface, you can now enable their individual permissions based on the role they have.

<table><thead><tr><th width="215">Parameter</th><th>Details</th></tr></thead><tbody><tr><td><strong><code>admin-role</code></strong></td><td>The Discord role you want to give administrator privileges to.</td></tr></tbody></table>

<figure><picture><source srcset="../../../.gitbook/assets/configure-adminaccess-add.webp" media="(prefers-color-scheme: dark)"><img src="../../../.gitbook/assets/image.png" alt=""></picture><figcaption></figcaption></figure>
