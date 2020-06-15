/* 
 * Token Action Dropdown Bar.
 * Creates a dropdown bar of active items, spells, and feats as well as
 * ability and skills below the navigation and right of the control bar.
 * Works off the selected token or user's character, if they're a player.
 * 
 * To reposition, adjust the let x and let y variables between 
 * line 33 and line 36. Change this to incoorperate moving the bar.
 * 
 * Create an UI to give players choice to add or remove from the list.
 * 
 * author/blame/feedback: kekilla#7036
 * Based on the work of ^ and stick#0520
 */
let debug = false;
let enable = true;
let log = (...args) => console.log("Token Bar | ", ...args);

Hooks.once("setup",() => {
    window.TokenBar = {
        toggle : function() {
            enable = !enable;
        }
    };
});

export function initSetup(){
    if(!game.user.isGM)
    {
        if(game.settings.get('TokenBar','player') && enable && game.settings.get('TokenBar','enable'))
        {
            generateBar();
        }
    }else if (enable && game.settings.get('TokenBar','enable')){
        generateBar();
    }
}
async function generateBar () {
    let oldBar = document.getElementById("show-action-dropdown-bar");
    if (oldBar != null)
        oldBar.remove();

    $(document.body).off("click.showTokenActionBar");
    $(document.body).off("contextmenu.showTokenActionBar");

    const cancel = () => {
        $dispOptions.remove();
        $(document.body).off("click.showTokenActionBar");
    };

    let targetActor = getTargetActor();
    var display, data, targetId;
    if (targetActor == null) {
        display = "none";
        data = "";
        targetId = "";
    } else {
        display ="flex";
        data = getData(targetActor);
        targetId = targetActor._id;
    }

    //save coordiants and retrieve => client/user flag (TokenBar,Coord)
    //click on bar?? let them move it
    let navBounds = document.getElementById("navigation").getBoundingClientRect();
    let y = navBounds.bottom + 20;

    let controlBounds = document.getElementById("controls").getBoundingClientRect();
    let x = controlBounds.right + 50;

    const $dispOptions = $(`<div class="tokenbar" targetID="${targetId}" id="show-action-dropdown-bar" style="display: ${display}; z-index: 70; position: fixed; top: ${y}px; height: auto; left: ${x}px; background-color: #bbb">${data}</div>`).appendTo(document.body);

    $(document.body).on("click.showTokenActionBar", evt => {
        if (event.target.value === undefined) return;

        clickMacroButton(evt);
        Hooks.once(`updateActor`, (parent) =>{
            if(parent.data._id === getTargetActor().data._id){
                generateBar();
            }
        });
        Hooks.once(`updateOwnedItem`, (parent) => {
            if(parent.data._id === getTargetActor().data._id){
                generateBar();
            }
        });
        let close = clickDropdownContent(evt);
        if (close) {
            cancel();
            return;
        }       
    });
    $(document.body).on("contextmenu.showTokenActionBar", evt => {
        if (event.target.value === undefined) return;
        let value = event.target.value;
        
        let macroType = value.substr(0, value.indexOf('.'));
        let roller = game.settings.get('TokenBar','roller');

        if((macroType === "item" || macroType === "spell") && roller === "minor-qol"){
            clickMacroButton(evt);
        }else {
            return "";
        }
    });
}
function rollAbilityMacro(event, payload) {
    //going to need to check for modules here as well
    let roller = game.settings.get('TokenBar','roller');
    let actor = game.actors.find(a=>a._id === payload.actorId);
    if(debug) {log("ROLL ABILITY MACRO | ",event,payload,roller);}
    switch(roller) {
        case "betterrolls5e" :
            let param = {};
            if(event.originalEvent.shiftKey){
                param += { adv : 1 };
            }
            if(event.originalEvent.cntlKey){
                param += {disadv :1};
            }
            betterRollquickFix(actor,payload.checkId, param);
            break;
        case "minor-qol" :
        case "itemacro" :
        case "game5e" :
            actor.rollAbility(payload.checkId,{event : event});
            break;
        default :
    } 
}
function rollSkillMacro(event, payload) {
    //going to need to check for modules here as well
    let roller = game.settings.get('TokenBar','roller');
    let actor = game.actors.find(a=>a._id === payload.actorId);
    if(debug) {log(event,payload,roller);}
    switch(roller) {
        case "betterrolls5e" :
            let param = {};
            if(event.originalEvent.shiftKey){
                param += { adv : 1 };
            }
            if(event.originalEvent.cntlKey){
                param += {disadv :1};
            }
            BetterRolls.rollSkill(actor,payload.checkId,param)
            break;
        case "minor-qol" :
        case "itemacro" :
        case "game5e" :
            actor.rollSkill(payload.checkId,{event : event});
            break;
        default :
    }
}
function rollItemMacro(event,_id) {
    //Error Check - problem w/ spells and MinorQOL
    let itemId = _id;
    let itemName = getTargetActor().data.items.find(i=>i._id===itemId).name;
    let roller = game.settings.get('TokenBar','roller');
    if(debug) {log(event,itemId,roller);}
    switch(roller) {
        case "game5e" :
            game.dnd5e.rollItemMacro(itemName);
            break;
        case "betterrolls5e" :
            let param = {};
            if(event.originalEvent.shiftKey){
                param += { adv : 1 };
            }
            if(event.originalEvent.cntlKey){
                param += {disadv :1};
            }
            //need to update function used once documentation is added.
            BetterRolls.quickRollById(getTargetActor()._id,itemId);
            break;
        case "minor-qol" :
            MinorQOL.doRoll(event,itemId);
            break;
        case "itemacro" :
            ItemMacro.runMacro(getTargetActor()._id,itemId);
            break;
        default :
    }
}
function getTargetActor() {
    const controlled = canvas.tokens.controlled;
    if (debug) log(game.user.isGM, controlled.length);
    if (!game.user.isGM && controlled.length === 1 && controlled[0] !== null){
        if(checkPermision(controlled[0])){
            if(debug) log(controlled[0],checkPermision(controlled[0]));
            return controlled[0].actor;
        } else { return null;}
    } else if (game.user.isGM && controlled.length ===1 && controlled[0] !== null)
    {
        return controlled[0].actor;
    } else {return null;}
}
function getData(targetActor) {

    function buildActionsList(targetActor) {
        //check PC type => data.type "npc" || "character"
        if(targetActor.data.type === "character"){
            //Items
            let equipped = targetActor.data.items.filter(i => i.type !="consumable" && i.data.equipped);
            let activeEquipped = getActiveEquipment(equipped);
            let weapons = activeEquipped.filter(i => i.type == "weapon");
            let equipment = activeEquipped.filter(i => i.type == "equipment");
            let other = activeEquipped.filter(i => i.type != "weapon" && i.type != "equipment");
            let consumables = targetActor.data.items.filter(i => i.type == "consumable");     
            let items = { "weapons": weapons, "equipment": equipment, "other": other, "consumables": consumables };
            
            //Spells (expand to be more than 1 type of spell maybe) (MIGHT HAVE TO CHANGE THIS TO SOMETHING THAT MAKES MORE SENSE TO ME!!!)
            let preparedSpells = targetActor.data.items.find(i => ['artificer', 'cleric', 'druid', 'wizard', 'paladin'].includes(i.name.toLowerCase()))
                ? targetActor.data.items.filter(i => i.type == "spell" && (i.data.preparation.prepared || i.data.preparation.mode === 'always' || i.data.level === 0 || i.data.preparation.mode === 'atwill' || i.data.preparation.mode === 'innate'))
                : targetActor.data.items.filter(i => i.type == "spell");
            let spells = categoriseSpells(preparedSpells);

            //feats
            let allFeats = targetActor.data.items.filter(i => i.type == "feat");
            let actionFeats = allFeats.filter(i=>i.data.activation.type==="action");
            let bonusFeats = allFeats.filter(i=>i.data.activation.type==="bonus");
            let reactionFeats = allFeats.filter(i=>i.data.activation.type == "reaction");
            let timeFeats = allFeats.filter(i=>i.data.activation.type === "minute" || i.data.activation.type === "hour" || i.data.activation.type === "day");
            let otherFeats = allFeats.filter(i=>i.data.activation.type === "special" || i.data.activation.type === "none");
            let feats = {"Action" : actionFeats, "Bonus" : bonusFeats, "Reaction" : reactionFeats, "Time" : timeFeats, "Other" : otherFeats};

            return { "items": items,"spells": spells, "feats": feats };

        }else if (targetActor.data.type === "npc"){
            //Items
            let equipped = targetActor.data.items.filter(i => i.type !="consumable" && i.data.equipped);
            let weapons = equipped.filter(i=>i.type==="weapon");
            let equipment = equipped.filter(i => i.type == "equipment");
            let other = equipped.filter(i => i.type != "weapon" && i.type != "equipment");
            let consumables = targetActor.data.items.filter(i => i.type == "consumable");
            let items = { "weapons": weapons, "equipment": equipment, "other": other, "consumables": consumables };
            
            //Spells
            let spellList = targetActor.data.items.filter(i=>i.type =="spell");
            let spells = categoriseSpells(spellList);

            //Feats 
            let allFeats = targetActor.data.items.filter(i => i.type == "feat");
            let actionFeats = allFeats.filter(i=>i.data.activation.type==="action");
            let bonusFeats = allFeats.filter(i=>i.data.activation.type==="bonus");
            let reactionFeats = allFeats.filter(i=>i.data.activation.type == "reaction");
            let otherFeats = allFeats.filter(i=>i.data.activation.type === "minute" || i.data.activation.type === "hour" || i.data.activation.type === "day" || i.data.activation.type === "special");
            let legendaryFeats = allFeats.filter(i=>i.data.activation.type==="legendary");
            let lairFeats = allFeats.filter(i=>i.data.activation.type==="lair");
            let passiveFeats = allFeats.filter(i=>i.data.activation.type===""|| i.data.activation.type === "none");
            let feats = {"Action": actionFeats, "Bonus": bonusFeats, "Reaction" : reactionFeats,"Legendary" : legendaryFeats, "Lair": lairFeats, "Passive" : passiveFeats,"Other" : otherFeats};

            return { "items": items,"spells": spells, "feats": feats };
        }
    }

    function buildChecksList(targetActor) {
        let abilities = Object.entries(game.dnd5e.config.abilities);
        let skills = Object.entries(game.dnd5e.config.skills);

        return {"abilities": abilities, "skills": skills, "actorId": targetActor._id }
    }

    function getActiveEquipment(equipment) {
        const activationTypes = Object.entries(game.dnd5e.config.abilityActivationTypes);

        if(debug) log("GET ACTIVE EQUIPMENT | ", equipment);

        let activeEquipment = equipment.filter(e => {
            if (e.data.activation == undefined)
                return false;

            for (let [key, value] of activationTypes) {
                if (e.data.activation.type == key)
                    return true;
            }
            
            return false;
        });

        if(debug) log("GET ACTIVE EQUIPMENT | ", activeEquipment);

        return activeEquipment;
    }

    function categoriseSpells(spells) {
        //need to add rituals to their own tag
        let powers = {};
        let book = {}

        book = spells.reduce(function (book, spell) {
            var level = spell.data.level;
            let prep = spell.data.preparation.mode;
            let ritual = spell.data.components.ritual;

            const prepTypes = game.dnd5e.config.spellPreparationModes;
            let prepType = prepTypes[prep];

            if (prep == "pact" || prep == "atwill" || prep == "innate") {
                if (!powers.hasOwnProperty(prepType)) {
                    powers[prepTypes[prep]] = [];
                }
                powers[prepType].push(spell);               
            } else {
                if (!book.hasOwnProperty(level)) {
                    book[level] = [];
                }
                book[level].push(spell);
            }
            return book;
        }, {});
        
        return {"book": Object.entries(book), "powers": Object.entries(powers)};
    }

    function getContentTemplate(actions, checks) {

        //change this to check if has an entry => adds it
        let template = `
        <div class="show-action-form">
            ${getCssStyle()}
            <div class="show-action-dropdowns">
                ${getItemsTemplate(actions.items)}
                ${getSpellsTemplate(actions.spells)}
                ${getFeatsTemplate(actions.feats)}
                ${getAbilityCheckTemplate(checks.abilities, checks.actorId)}
                ${getSkillCheckTemplate(checks.skills, checks.actorId)}
                <div class="show-action-dropdown">
                    <button value="showActionClose" class="show-action-dropdown-button">[x]</button>
                </div>
            </div>
        </div>`;
        
        return template;
    }
        
    function getItemsTemplate(items) {
        if (items.weapons.length + items.equipment.length + items.other.length + items.consumables.length === 0)
            return "";

        let template = `<div class="show-action-dropdown">
                            <button value="showActionItems" class="show-action-dropdown-button">Equipment</button>
                            <div id="showActionItems" class="show-action-dropdown-content">
                                ${getItemsCategoryTemplate("Weapons", items.weapons)}
                                ${getItemsCategoryTemplate("Equipment", items.equipment)}
                                ${getItemsCategoryTemplate("Other", items.other)}
                                ${getItemsCategoryTemplate("Consumables", items.consumables)}
                            </div>
                        </div>`;


        return template;
    }

    function getSpellsTemplate(spells) {     
        if (spells.powers.length + spells.book.length === 0)           
            return "";

        let template = `<div class="show-action-dropdown">
                            <button value="showActionSpells" class="show-action-dropdown-button">Spells</button>
                            <div id="showActionSpells" class="show-action-dropdown-content">
                                ${getSpellsCategoryTemplate(spells.powers)}
                                ${getSpellsCategoryTemplate(spells.book)}
                            </div>
                        </div>`;

        return template;
    }

    function getFeatsTemplate(feats) {
        let checkValue = 0;
        for (let feat in feats) 
        {
            checkValue += feat.length;
        }
        if(checkValue === 0)
            return "";

        let template = `<div class="show-action-dropdown">
                            <button value="showActionFeats" class="show-action-dropdown-button">Feats</button>
                                <div id="showActionFeats" class="show-action-dropdown-content">`;
        //for each in feats ==> ${getFeatsCategoryTemplate("Active", feats.active)}
        for (let feat in feats){
            template += `${getFeatsCategoryTemplate(feat, feats[feat])}`;
        }
        template += '</div></div>';

        return template;
    }

    function getItemsCategoryTemplate(title, items) {
        if (items.length === 0)
            return "";

        let template = `<div class="show-action-dropdown-content-subtitle">${title}</div>
                        <div class="show-action-dropdown-content-actions">`;
        for (let i of items) {
            if(i.type === "consumable")
            {
                template += `<button value ="item.${i._id}">${i.name} : ${i.data.quantity}</button>`;
            }else {
                template += `<button value="item.${i._id}">${i.name}</button>`;  
            }   
        } 

        template += `</div>`;

        return template;
    }

    function getSpellsCategoryTemplate(spells) {
        if (spells.length === 0)
            return "";

        let template = "";

        let spellSlots = getTargetActor().data.data.spells;

        for (let [level, entries] of spells) {
            let levelNo = level.toString().charAt(0);
            let subtitle = isNaN(levelNo) ? level : (levelNo === "0" ? `Cantrips` : `Level ${levelNo}`);

            if(level === "Pact Magic"){
                subtitle += ` : ${spellSlots["pact"].value} / ${spellSlots["pact"].max}`;
            }
            if(!isNaN(levelNo) && levelNo !== "0")
            {
                subtitle += ` : ${spellSlots[`spell${level}`].value} / ${spellSlots[`spell${level}`].max}`;
            }

            template += `<div class="show-action-dropdown-content-subtitle">${subtitle}</div>
                            <div class="show-action-dropdown-content-actions">`;

            for (let s of entries) {
                template += `<button value="spell.${s._id}">${s.name}</button>`;    
            }
            template += `</div>`;
        }
        return template;
    }

    function getFeatsCategoryTemplate(subtitle, feats) {
        if (feats.length === 0)
            return "";
        
        let template = `<div class="show-action-dropdown-content-subtitle">${subtitle}</div>
                        <div class="show-action-dropdown-content-actions">`;
                        
        for (let f of feats) {
            if(f.data.uses.max > 0)
            {
                template += `<button value="feat.${f._id}">${f.name} : ${f.data.uses.value} / ${f.data.uses.max}</button>`;
            }else{
                template += `<button value="feat.${f._id}">${f.name}</button>`;
            }
                
        }
        template += `</div>`;
        return template;
    }

    function getAbilityCheckTemplate(checks, actorId) {
        if (checks.length === 0)
            return "";

        let template = `<div class="show-action-dropdown">
                            <button value="showActionAbilities" class="show-action-dropdown-button">Saves & Ability Checks</button>
                            <div id="showActionAbilities" class="show-action-dropdown-content">
                                <div class="show-action-dropdown-content-actions">`

                for (let [checkId, check] of checks) {
                    let buttonValue = encodeURIComponent(`abilityCheck.{"actorId": "${actorId}", "checkId": "${checkId}"}`);
                    template += `<button value="${buttonValue}">${check}</button>`;    
                }            
        
        template += `           </div>
                            </div>
                        </div>`;

        return template;
    }

    function getSkillCheckTemplate(checks, actorId) {
        if (checks.length === 0)
            return "";

        let template = `<div class="show-action-dropdown">
                            <button value="showActionSkills" class="show-action-dropdown-button">Skills</button>
                            <div id="showActionSkills" class="show-action-dropdown-content">
                                <div class="show-action-dropdown-content-actions">`

                for (let [checkId, check] of checks) {
                    let buttonValue = encodeURIComponent(`skillCheck.{"actorId": "${actorId}", "checkId": "${checkId}"}`);
                    template += `<button value="${buttonValue}">${check}</button>`;      
                }            
        
        template += `           </div>
                            </div>
                        </div>`;

        return template;
    }

    function getCssStyle() {
        return `
        <style type="text/css">
            .show-action-dropdowns {
                margin: 5px;
            }

            .show-action-dropdown-button {
                width: auto;
                height: auto;
                background-color: #eee;
                padding: 5px 8px;
                border: none;
                cursor: pointer;
            }
            
            /* The container <div> - needed to position the dropdown content */
            .show-action-dropdown {
                position: relative;
                display: inline-block;
            }
            
            /* Dropdown Content (Hidden by Default) */
            .show-action-dropdown-content {
                display: none;
                max-width: 700px;
                padding: 8px;
                background-color: #aaa;
                position: absolute;
                box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                z-index: 99;
            }

            .show-action-dropdown-content-actions {
                min-width: 300px;
                max-width: 700px;
            }

            .show-action-drowndown-content-title {
                font-size: medium;
            }
            
            .show-action-dropdown-content-subtitle {
                font-size: small;
            }

            /* Links inside the dropdown */
            .show-action-dropdown-content-actions button {
                width: auto;
                height: auto;
                padding: 3px 5px;
                font-size: small;
                text-decoration: none;
                display: inline;
            }
            
            /* Change color of dropdown links on hover */
            .show-action-dropdown-content-actions button:hover {
                background-color: #f1f1f1
            }
            
            /* Show the dropdown menu on hover */
            .show-action-dropdown:hover .show-action-dropdown-content {
                display: block;
            }
        </style>`
    }

    let innerContent= "";

    if (targetActor != null) {
        let actionsList = buildActionsList(targetActor);
        let checksList = buildChecksList(targetActor);
        
        innerContent = getContentTemplate(actionsList, checksList);
    }

    var content =  `<div id="actionDialog">${innerContent}</div>`;
    
    return content;
}   
function clickDropdownContent(event) {
    if (event.target.value == undefined || event.target.value == "")
        return false;

    if (event.target.value == "showActionClose")
        return true;       

    return false;
}
function clickMacroButton(event) {
    if (event.target.value == undefined || event.target.value == "")
        return;

    let value = event.target.value;
    let macroType = value.substr(0, value.indexOf('.'));
    let payload = decodeURIComponent(value.substr(value.indexOf(".") +1, value.length));
    if(debug) log("event : ",event," value : ",value," macroType : ",macroType," payload : ",payload);
    var checkDetails;
    switch (macroType) {
        case "abilityCheck":
            checkDetails = JSON.parse(payload);
            rollAbilityMacro(event, checkDetails);
            break;
        case "skillCheck":
            checkDetails = JSON.parse(payload);
            rollSkillMacro(event, checkDetails);
            break;
        case "item":
        case "spell":
        case "feat":
            rollItemMacro(event,payload);
            break;
        default:
            break;
    }
}
function checkPermision(entity = ""){
    if(entity.actor.data.permission[game.userId] === 3){
        return true;
    }
    return false;
}
function betterRollquickFix(actor, checkId, param)
{
    let choice = "";
    new Dialog({
        title : "Better Rolls Quick Fix Ability Chooser.",
        content : `
            <div class ="form-group">
                <h1>Select Roll Type</h1>
            </div>`,
        buttons : {
            one : {
                icon :`<i class="fas fa-check"></i>`,
                label : "Ability Check",
                callback : () => choice = "check"
            },
            two : {
                icon :`<i class="fa fa-life-ring"></i>`,
                label : "Ability Save",
                callback : () => choice = "save"
            }
        },
        default : "Cancel",
        close : (html) => {
            if(choice === "check")
            {
                BetterRolls.rollCheck(actor,checkId,param)
            }else if (choice === "save"){
                BetterRolls.rollSave(actor,checkId,param);
            }
        }
    }).render(true);
}