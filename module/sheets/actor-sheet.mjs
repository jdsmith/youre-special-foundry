import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import { rollTest } from "../test.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class YoureSpecialActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["yourespecial", "sheet", "actor"],
      template: "systems/yourespecial/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
    });
  }

  /** @override */
  get template() {
    return `systems/yourespecial/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.data.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    const effects = [];
    if(context.data.exhaustion.level) {
      for (let i=1; i<=context.data.exhaustion.level && i<CONFIG.YOURESPECIAL.exhaustionLevels.length; i++) {
        effects.push(CONFIG.YOURESPECIAL.exhaustionLevels[i]);
      }
    }
    context.data.exhaustion.effects = effects;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const weapons = [];
    const chems = [];
    const aid = [];
    const armor = [];
    const containers = [];
    const ammo = [];
    const perks = [];
    let totalDR = 0;
    let totalENB = 0;

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || CONFIG.YOURESPECIAL.defaults.itemImg;

      const enb = i.data.quantity * i.data.enb;
      if (!Number.isNaN(enb)) {
        totalENB += enb;
      }

      // Append to gear.
      if (i.type === 'gear') {
        gear.push(i);
      }
      else if (i.type === 'ammo') {
        ammo.push(i);
      }
      else if (i.type === 'weapon') {
        weapons.push(i);
      }
      else if (i.type === 'armor') {
        armor.push(i);
        if (i.data.equipped) {
          totalDR += i.data.dr;
          totalENB -= enb;
        }
      }
      else if (i.type === 'chem') {
        chems.push(i);
      }
      else if (i.type === 'aid') {
        aid.push(i);
      }
      else if (i.type === 'container') {
        containers.push(i);
        if (i.data.equipped) {
          context.data.enbLimit += i.data.enbBonus;
        }
      }
      // Append to perks.
      else if (i.type === 'perk') {
        perks.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.armor = armor;
    context.weapons = weapons;
    context.ammo = ammo;
    context.aid = aid;
    context.chems = chems;
    context.containers = containers;
    context.perks = perks;
    context.dr = totalDR;
    context.currentEncumbrance = totalENB;
   }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // item updates
    html.find(".item-prop-modify-number input").click(ev => ev.target.select()).change(this._onItemNumberAttributeChange.bind(this));
    html.find(".item-prop-modify-bool input").click(ev => ev.target.select()).change(this._onItemBooleanAttributeChange.bind(this));

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  async _onItemNumberAttributeChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const path = event.currentTarget.name;
    const item = this.actor.items.get(itemId);
    const value = parseInt(event.target.value);
    return item.update({ [path]: value });
  }

  async _onItemBooleanAttributeChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const path = event.currentTarget.name;
    const item = this.actor.items.get(itemId);
    const value = !!event.target.checked;
    return item.update({ [path]: value });
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // handle attribute rolls
    if (dataset.attributeName) {
      return rollTest(dataset.attributeName, this.actor);
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[roll] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    return rollTest(null, this.actor);
  }

}
