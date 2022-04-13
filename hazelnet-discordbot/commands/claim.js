const NodeCache = require('node-cache');
const { SlashCommandBuilder } = require('@discordjs/builders');
const i18n = require('i18n');
const {
  MessageActionRow, MessageSelectMenu, MessageButton,
} = require('discord.js');
const embedBuilder = require('../utility/embedbuilder');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  getCommandData(locale) {
    const ci18n = new CommandTranslations('claim', locale);
    return new SlashCommandBuilder()
      .setName('claim')
      .setDescription(ci18n.description())
      .setDefaultPermission(false);
  },
  commandTags: ['claimphysical'],
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);

      const availableClaimLists = await interaction.client.services.claimlists.getAvailableClaimLists(interaction.guild.id, externalAccount.id);

      const claimLists = availableClaimLists.claimLists
        .sort((claimListA, claimListB) => claimListA.displayName.localeCompare(claimListB.displayName));
      if (claimLists.length) {
        this.cache.set(`${interaction.user.id}-claimlists`, availableClaimLists);
        this.cache.set(`${interaction.user.id}-order`, {
          externalAccountId: externalAccount.id,
          guildId: interaction.guild.id,
        });
        const claimListFields = [{
          name: i18n.__({ phrase: 'claim.availableClaimListsTitle', locale }),
          value: i18n.__({ phrase: 'claim.availableClaimLists', locale }),
        }];
        if (discordServer.settings?.HELP_CHANNEL) {
          claimListFields.unshift({
            name: i18n.__({ phrase: 'claim.helpChannelTitle', locale }),
            value: i18n.__({ phrase: 'claim.helpChannel', locale }, { helpChannel: discordServer.settings?.HELP_CHANNEL }),
          });
        }

        const components = [new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId('claim/start')
              .setPlaceholder(i18n.__({ phrase: 'claim.chooseClaimList', locale }))
              .addOptions(claimLists.map((claimList) => ({
                label: claimList.displayName,
                description: (claimList.description ? (claimList.description.substr(0, 90) + (claimList.description.length > 90 ? '...' : '')) : ''),
                value: `claimlist-${claimList.id}`,
              }))),
          ),
        ];
        const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'claim.messageTitle', locale }), i18n.__({ phrase: 'claim.purpose', locale }), 'claim', claimListFields);
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      } else {
        const noClaimListFields = [{
          name: i18n.__({ phrase: 'claim.noClaimListsTitle', locale }),
          value: i18n.__({ phrase: 'claim.noClaimLists', locale }),
        }];
        const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'claim.messageTitle', locale }), i18n.__({ phrase: 'claim.purpose', locale }), 'claim', noClaimListFields);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting information on claimable items. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId) {
      switch (interaction.customId) {
        case 'claim/reset': {
          this.resetCart(interaction);
          break;
        }
        case 'claim/enteraddress': {
          this.selectShippingType(interaction);
          break;
        }
        case 'claim/finish': {
          this.finishOrder(interaction);
          break;
        }
        default:
          break;
      }
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId) {
      switch (interaction.customId) {
        case 'claim/start': {
          const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
          const locale = discordServer.getBotLanguage();
          try {
            await interaction.update({ components: [] });
            const claimListId = +interaction.values[0].substr(interaction.values[0].lastIndexOf('-') + 1);
            const existingOrder = await interaction.client.services.claimlists.getExistingOrderForClaimList(interaction.guild.id, this.getCurrentOrder(interaction.user.id).externalAccountId, claimListId);
            const claimList = this.getFromAvailableClaimLists(interaction.user.id, claimListId);
            const description = claimList.description ?? i18n.__({ phrase: 'claim.noDescription', locale });
            if (existingOrder) {
              await this.existingOrderDirectMessage(interaction, discordServer, existingOrder);
              const claimListFields = [{
                name: i18n.__({ phrase: 'claim.existingOrderTitle', locale }),
                value: i18n.__({ phrase: 'claim.existingOrder', locale }, { botUser: interaction.client.application.id }),
              }];
              const embed = embedBuilder.buildForUser(discordServer, claimList.displayName, description, 'claim', claimListFields);
              await interaction.followUp({ embeds: [embed], components: [], ephemeral: true });
            } else {
              await this.startOrderDirectMessage(interaction, discordServer, claimListId);
              const claimListFields = [{
                name: i18n.__({ phrase: 'claim.orderStartedTitle', locale }),
                value: i18n.__({ phrase: 'claim.orderStarted', locale }, { botUser: interaction.client.application.id }),
              }];
              const embed = embedBuilder.buildForUser(discordServer, claimList.displayName, description, 'claim', claimListFields);
              await interaction.followUp({ embeds: [embed], components: [], ephemeral: true });
            }
          } catch (error) {
            if (error.constructor?.name === 'DiscordAPIError') {
              const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'claim.noDirectMessageTitle', locale }), i18n.__({ phrase: 'claim.noDirectMessage', locale }), 'claim');
              await interaction.followUp({ embeds: [embed], components: [], ephemeral: true });
            } else {
              interaction.client.logger.error(error);
              await interaction.followUp({ content: 'Error while getting information on claimable items. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
            }
          }
          break;
        }
        case 'claim/addtocart': {
          const item = interaction.values[0];
          await this.addToCart(interaction, item);
          break;
        }
        case 'claim/chooseshippingmethod': {
          await this.startEnterShippingAddress(interaction);
          break;
        }
        default:
          break;
      }
    }
  },
  async processDirectMessage(message) {
    const userId = message.author.id;
    const currentOrder = this.getCurrentOrder(userId);
    let discordServer = await message.client.services.discordserver.makeDiscordServerObject({});
    if (currentOrder?.guildId) {
      discordServer = await message.client.services.discordserver.getDiscordServer(currentOrder.guildId);
    }
    const locale = discordServer.getBotLanguage();
    if (currentOrder?.claimListId) {
      let phase = this.getEnterAddressPhaseFromOrder(currentOrder);
      const components = [];
      const fields = [];
      const newData = message.content.trim();
      if (newData.length) {
        currentOrder[phase] = newData;
        phase = this.getEnterAddressPhaseFromOrder(currentOrder);
        this.updateOrder(userId, currentOrder);
        if (phase === 'complete') {
          const availableProducts = this.getAvailableProductsForClaimList(userId, currentOrder.claimListId);
          const { cartField } = this.getProductChoices(currentOrder, locale, availableProducts);
          fields.push(cartField);
          components.push(
            new MessageActionRow()
              .addComponents(
                new MessageButton()
                  .setCustomId('claim/finish')
                  .setLabel(i18n.__({ phrase: 'claim.submitOrder', locale }))
                  .setStyle('PRIMARY'),
                new MessageButton()
                  .setCustomId('claim/reset')
                  .setLabel(i18n.__({ phrase: 'claim.clearShoppingCart', locale }))
                  .setStyle('DANGER'),
              ),
          );
        }
      }
      const phrase = this.getPhraseForEnterAddressPhase(phase);
      fields.push({
        name: i18n.__({ phrase: 'claim.orderStartedTitle', locale }),
        value: i18n.__({ phrase, locale }),
      });
      const addressData = this.getCurrentAddressField(currentOrder, locale);
      const embed = embedBuilder.buildForUser(discordServer, addressData.name, addressData.value, 'claim', fields);
      await message.author.send({ embeds: [embed], components });
    } else {
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'claim.noCurrentOrderProcessTitle', locale }), i18n.__({ phrase: 'claim.noCurrentOrderProcess', locale }), 'claim');
      await message.author.send({ embeds: [embed], ephemeral: true });
    }
  },
  getCurrentAddressField(currentOrder, locale) {
    return {
      name: i18n.__({ phrase: 'claim.currentAddress', locale }),
      value: i18n.__({ phrase: 'claim.currentAddressData', locale }, currentOrder),
    };
  },
  getPhraseForEnterAddressPhase(phase) {
    switch (phase) {
      case 'city':
        return 'claim.enterCity';
      case 'street':
        return 'claim.enterStreet';
      case 'zipCode':
        return 'claim.enterZipCode';
      case 'country':
        return 'claim.enterCountry';
      case 'phone':
        return 'claim.enterPhone';
      case 'complete':
        return 'claim.addressEntryComplete';
      default:
        return 'claim.enterShipTo';
    }
  },
  getEnterAddressPhaseFromOrder(order) {
    if (!order.shipTo) {
      return 'shipTo';
    }
    if (!order.country) {
      return 'country';
    }
    if (order.country !== 'USA' && !order.phone) {
      return 'phone';
    }
    if (!order.street) {
      return 'street';
    }
    if (!order.zipCode) {
      return 'zipCode';
    }
    if (!order.city) {
      return 'city';
    }
    return 'complete';
  },
  async existingOrderDirectMessage(interaction, discordServer, existingOrder) {
    const locale = discordServer.getBotLanguage();
    const availableProducts = this.getAvailableProductsForClaimList(interaction.user.id, existingOrder.claimListId);
    const { cartField } = this.getProductChoices(existingOrder, locale, availableProducts);
    const orderFields = [
      cartField,
      this.getCurrentAddressField(existingOrder, locale),
    ];
    if (existingOrder.trackingNumber) {
      orderFields.push({
        name: i18n.__({ phrase: 'claim.trackingNumberTitle', locale }),
        value: i18n.__({ phrase: 'claim.trackingNumberDetails', locale }, existingOrder),
      });
    }
    const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'claim.existingOrderTitle', locale }), i18n.__({ phrase: 'claim.checkoutComplete', locale }), 'claim', orderFields);
    await interaction.user.send({ embeds: [embed], ephemeral: true });
  },
  async startOrderDirectMessage(interaction, discordServer, claimListId) {
    const locale = discordServer.getBotLanguage();
    const currentOrder = this.updateOrder(interaction.user.id, { claimListId });
    const availableProducts = this.getAvailableProductsForClaimList(interaction.user.id, claimListId);
    const productFields = availableProducts.map((product) => ({
      name: product.name,
      value: i18n.__({ phrase: 'claim.claimProductDetails', locale }, product),
    }));
    const { cartField, productChoices } = this.getProductChoices(currentOrder, locale, availableProducts);
    productFields.push(cartField);
    if (productChoices.length) {
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'claim.checkoutTitle', locale }), i18n.__({ phrase: 'claim.checkout', locale }), 'claim', productFields);
      await interaction.user.send({ embeds: [embed], components: productChoices, ephemeral: true });
    }
  },
  async selectShippingType(interaction) {
    const currentOrder = this.getCurrentOrder(interaction.user.id);
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(currentOrder.guildId);
    const locale = discordServer.getBotLanguage();
    const components = [new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId('claim/chooseshippingmethod')
          .setPlaceholder(i18n.__({ phrase: 'claim.chooseShippingType', locale }))
          .addOptions([{
            label: i18n.__({ phrase: 'claim.shippingTypeUSA', locale }),
            value: 'USA',
          }, {
            label: i18n.__({ phrase: 'claim.shippingTypeInternational', locale }),
            value: 'Other',
          }]),
      )];
    await interaction.update({ components });
  },
  async startEnterShippingAddress(interaction) {
    const currentOrder = this.getCurrentOrder(interaction.user.id);
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(currentOrder.guildId);
    const locale = discordServer.getBotLanguage();
    await interaction.update({ components: [] });
    if (interaction.values[0] === 'USA') {
      this.updateOrder(interaction.user.id, { country: 'USA' });
    }
    const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'claim.checkoutTitle', locale }), i18n.__({ phrase: 'claim.enterShipTo', locale }), 'claim');
    await interaction.user.send({ embeds: [embed] });
  },
  async finishOrder(interaction) {
    const fullOrder = this.getCurrentOrder(interaction.user.id);
    if (fullOrder.guildId) {
      const { guildId, ...currentOrder } = fullOrder;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guildId);
      const locale = discordServer.getBotLanguage();
      try {
        await interaction.client.services.claimlists.submitPhysicalOrder(guildId, currentOrder.externalAccountId, currentOrder.claimListId, currentOrder);
        await interaction.update({ components: [] });
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'claim.submitOrder', locale }), i18n.__({ phrase: 'claim.checkoutComplete', locale }), 'claim');
        await interaction.user.send({ embeds: [embed] });
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'claim.submitOrder', locale }), i18n.__({ phrase: 'claim.checkoutError', locale }), 'claim');
        await interaction.user.send({ embeds: [embed] });
      }
    } else {
      this.messageTimeout(interaction);
    }
  },
  async messageTimeout(interaction) {
    const discordServer = await interaction.client.services.discordserver.makeDiscordServerObject({});
    const locale = discordServer.getBotLanguage();
    const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'claim.submitOrder', locale }), i18n.__({ phrase: 'claim.noCurrentOrderProcess', locale }), 'claim');
    await interaction.user.send({ embeds: [embed] });
  },
  async resetCart(interaction) {
    const userId = interaction.user.id;
    const currentOrder = this.getCurrentOrder(userId);
    if (currentOrder) {
      const updatedOrder = this.updateOrder(userId, {
        items: [],
        shipTo: null,
        country: null,
        zipCode: null,
        street: null,
        city: null,
      });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(updatedOrder.guildId);
      const locale = discordServer.getBotLanguage();
      const availableProducts = this.getAvailableProductsForClaimList(userId, updatedOrder.claimListId);
      const productFields = availableProducts.map((product) => ({
        name: product.name,
        value: i18n.__({ phrase: 'claim.claimProductDetails', locale }, product),
      }));
      const { cartField, productChoices } = this.getProductChoices(updatedOrder, locale, availableProducts);
      productFields.push(cartField);
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'claim.checkoutTitle', locale }), i18n.__({ phrase: 'claim.checkout', locale }), 'claim', productFields);
      await interaction.update({ embeds: [embed], components: productChoices, ephemeral: true });
    } else {
      this.messageTimeout(interaction);
    }
  },
  async addToCart(interaction, itemToAdd) {
    const userId = interaction.user.id;
    const currentOrder = this.getCurrentOrder(userId);
    if (currentOrder && currentOrder.guildId) {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(currentOrder.guildId);
      const locale = discordServer.getBotLanguage();
      currentOrder.items = currentOrder.items ?? [];
      const itemDetails = itemToAdd.substr(1).split('-');
      const newItem = {
        productId: +itemDetails[0],
        count: 1,
      };
      if (itemDetails.length > 1) {
        newItem.variation = {
          size: itemDetails[1],
        };
      }
      currentOrder.items.push(newItem);
      this.updateOrder(userId, currentOrder);
      const availableProducts = this.getAvailableProductsForClaimList(userId, currentOrder.claimListId);

      const productFields = availableProducts.map((product) => ({
        name: product.name,
        value: i18n.__({ phrase: 'claim.claimProductDetails', locale }, product),
      }));
      const { cartField, productChoices } = this.getProductChoices(currentOrder, locale, availableProducts);
      productFields.push(cartField);
      if (productChoices.length) {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'claim.checkoutTitle', locale }), i18n.__({ phrase: 'claim.checkout', locale }), 'claim', productFields);
        await interaction.update({ embeds: [embed], components: productChoices, ephemeral: true });
      } else {
        const finish = [
          new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setCustomId('claim/enteraddress')
                .setLabel(i18n.__({ phrase: 'claim.enterShippingData', locale }))
                .setStyle('PRIMARY'),
              new MessageButton()
                .setCustomId('claim/reset')
                .setLabel(i18n.__({ phrase: 'claim.clearShoppingCart', locale }))
                .setStyle('DANGER'),
            ),
        ];
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'claim.checkoutTitle', locale }), i18n.__({ phrase: 'claim.checkout', locale }), 'claim', productFields);
        await interaction.update({ embeds: [embed], components: finish, ephemeral: true });
      }
    } else {
      this.messageTimeout(interaction);
    }
  },
  getAvailableProductsForClaimList(userId, claimListId) {
    const claimList = this.getFromAvailableClaimLists(userId, claimListId);
    if (claimList) {
      const availableProductCounts = claimList.claims?.reduce(
        (map, claim) => {
          const { claimableProduct, claimableCount } = claim;
          const currentCount = map.get(claimableProduct);
          if (currentCount) {
            map.set(claimableProduct, currentCount + claimableCount);
          } else {
            map.set(claimableProduct, claimableCount);
          }
          return map;
        },
        new Map(),
      );
      const availableProductIds = Array.from(availableProductCounts.keys());
      const products = this.getClaimableProducts(userId);
      return products
        .filter((product) => availableProductIds.includes(product.id))
        .map((product) => ({
          id: product.id,
          name: product.name,
          variations: product.variations,
          available: availableProductCounts.get(product.id),
        }));
    }
    return {};
  },
  getProductChoices(order, locale, availableProducts) {
    const productsInCart = this.getProductsInCart(order);
    const cartField = this.buildCartField(order.items, availableProducts, locale);
    const productChoices = [];
    availableProducts.forEach((availableProduct) => {
      const remaining = availableProduct.available - (productsInCart.get(availableProduct.id) ?? 0);
      if (!productChoices.length && remaining > 0) {
        productChoices.push(new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId('claim/addtocart')
              .setPlaceholder(i18n.__({ phrase: 'claim.chooseClaimList', locale }))
              .addOptions(this.getProductOptions(availableProduct)),
          ));
      }
    });
    return {
      cartField,
      productChoices,
    };
  },
  getProductsInCart(currentOrder) {
    return currentOrder.items?.reduce(
      (map, item) => {
        const { productId, count } = item;
        const currentCount = map.get(productId);
        if (currentCount) {
          map.set(productId, currentCount + count);
        } else {
          map.set(productId, count);
        }
        return map;
      },
      new Map(),
    ) ?? new Map();
  },
  getProductOptions(product) {
    const sizes = product.variations?.sizes;
    if (sizes) {
      return sizes.map((size) => ({
        label: `${product.name} (${size})`,
        value: `p${product.id}-${size}`,
      }));
    }
    return [{
      label: product.name,
      value: `p${product.id}`,
    }];
  },
  buildCartField(itemsInCart, availableProducts, locale) {
    if (!itemsInCart?.length) {
      return {
        name: i18n.__({ phrase: 'claim.shoppingCart', locale }),
        value: i18n.__({ phrase: 'claim.shoppingCartEmpty', locale }),
      };
    }
    const items = itemsInCart.map((item) => {
      const productInfo = availableProducts.find((product) => product.id === item.productId);
      const name = this.getProductNameWithVariation(productInfo, item.variation);
      return `${item.count} × ${name}`;
    });
    return {
      name: i18n.__({ phrase: 'claim.shoppingCart', locale }),
      value: items.join('\n'),
    };
  },
  getProductNameWithVariation(productInfo, variation) {
    if (variation && variation.size) {
      return `${productInfo.name} (${variation.size})`;
    }
    return productInfo.name;
  },
  getClaimableProducts(userId) {
    const claimListData = this.cache.get(`${userId}-claimlists`);
    return claimListData.claimableProducts;
  },
  getFromAvailableClaimLists(userId, claimListId) {
    const claimListData = this.cache.get(`${userId}-claimlists`);
    return claimListData.claimLists.find((claimList) => claimList.id === +claimListId);
  },
  getCurrentOrder(userId) {
    return this.cache.get(`${userId}-order`);
  },
  updateOrder(userId, newOrderData) {
    const order = this.cache.take(`${userId}-order`);
    const updatedOrder = { ...order, ...newOrderData };
    this.cache.set(`${userId}-order`, updatedOrder);
    return updatedOrder;
  },
};
