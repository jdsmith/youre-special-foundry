import { getTestOptions, rollTest } from '../test.js';

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class YoureSpecialItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
    const itemData = this.data.data;
    if (this.type === 'weapon') {
      itemData.attackDescriptor = CONFIG.YOURESPECIAL.attributes[itemData.atk].text;
      itemData.dam.descriptor = itemData.dam.modifiedBy ? (
        `${itemData.dam.value} + ${CONFIG.YOURESPECIAL.attributes[itemData.dam.modifiedBy].abbreviation}`
      ) : itemData.dam.value
      // fix old ranges
      if (typeof itemData.range === 'string') {
        itemData.range = { melee: false, close: false, far: false, extreme: false };
      }
    }
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
   getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);

    return rollData;
  }

  getTestAttribute() {
    if (this.type === 'weapon') {
      return this.data.data.atk;
    }
    return null;
  }

  getShortDescription() {
    const itemData = this.data.data;
    if (this.type === 'chem') {
      return `${itemData.effects}; Addiction: ${itemData.addictionTest}; ${itemData.addictionEffects}`;
    }
    if (this.type === 'aid') {
      return item.effects;
    }
    if (this.type === 'armor') {
      return `DR: ${itemData.dr}; -AGL: ${itemData.agilityPenalty}; ${itemData.notes}`
    }
    if (this.type === 'container') {
      return `Increases ENB limit by ${itemData.enbBonus}; ${itemData.notes}`;
    }
    if (this.type === 'perk') {
      return itemData.summary;
    }
    return itemData.notes;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this.data;
    const testAttribute = this.getTestAttribute();

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });

    // If there's no roll data, send a chat message.
    if (!testAttribute) {
      const shortDescription = this.getShortDescription();
      const content = await renderTemplate("systems/yourespecial/templates/chat/item-chat.html", { item, shortDescription });
      ChatMessage.create({
        speaker: speaker,
        content
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      return rollTest(testAttribute, this.actor, this);
    }
  }
}
