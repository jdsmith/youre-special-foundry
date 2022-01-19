const attributeRollTemplate = 'systems/yourespecial/templates/chat/attribute-roll.html';

async function _processTestOptions(form) {
    return {
        difficulty: parseInt(form.difficulty.value),
        testModifier: parseInt(form.testModifier.value),
    };
}

export async function getTestOptions() {
    const template = "systems/yourespecial/templates/dialogs/test-modifiers.html";
    const html = await renderTemplate(template, {});

    return new Promise(resolve => {
        new Dialog({
            title: 'Test Options',
            content: html,
            buttons: {
                normal: {
                    label: 'Roll',
                    callback: html => resolve(_processTestOptions(html[0].querySelector("form")))
                },
                cancel: {
                    label: 'Cancel',
                    callback: () => resolve({cancelled: true}),
                }
            },
            default: 'normal',
            close: () => resolve({cancelled: true})
        }, null).render(true);
    });
}

export async function rollTest(testAttribute, actor) {
    const rollMode = game.settings.get('core', 'rollMode');
    const rollData = actor.getRollData();
    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor });
    const attributes = CONFIG.YOURESPECIAL.attributes;
    const testOptions = await getTestOptions();
    if (testOptions.cancelled) {
        return;
    }
    const formula = `${rollData[testAttribute].value + testOptions.testModifier}d6x6cs>3`;
    // Invoke the roll and submit it to chat.
    const roll = new Roll(formula);
    // If you need to store the value first, uncomment the next line.
    const result = await roll.roll({async: true});
    const total = result.total;
    const diceValues = result.dice[0].results;
    const resultData = {
        total,
        success: total > testOptions.difficulty,
        failure: total < testOptions.difficulty,
        draw: total === testOptions.difficulty,
        attribute: attributes[testAttribute].text,
        dice: diceValues,
    }
    const content = await renderTemplate(attributeRollTemplate, resultData);
    result.toMessage({ speaker: speaker, content });
}
