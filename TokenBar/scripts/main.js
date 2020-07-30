//Import TypeScript Modules
import * as token_dropdown from './token_dropdown.js';

let debug = false;
let log = (...args) => console.log("Token Bar | ", ...args);

Hooks.on('init', ()=> {
    registerSettings();
});

Hooks.on('ready', () =>{
    canvas.tokens.releaseAll();
    checkSettings();
});

/* Initialize Module */
Hooks.on('controlToken', () => {
    if(debug) log('Creating Bar.');
    token_dropdown.initSetup();
});

function registerSettings(){
    //check for active modules, then if active add to data
    let data = { "game5e" : "Core 5e" };
    if(game.modules.get("betterrolls5e") !== undefined && game.modules.get("betterrolls5e").active === true)
    {
        mergeObject(data,{"betterrolls5e" : "Better Rolls for 5e"});
    }
    if(game.modules.get("minor-qol") !== undefined && game.modules.get("minor-qol").active === true)
    {
        mergeObject(data,{"minor-qol" : "Minor Quality of Life"});
    }
    if(game.modules.get("itemacro") !== undefined && game.modules.get("itemacro").active === true)
    {
        mergeObject(data,{"itemacro" : "Item Macro"});
    }
    game.settings.register("TokenBar",'roller', {
        name : "Token Bar Roll Type",
        hint : "Choose output for Token Bar.",
        scope : "world",
        config : true,
        type : String,
        choices : data,
        default : "game5e"
    });
    game.settings.register("TokenBar",'player', {
        name : "Allow Players to Use Token Bar?",
        hint : "Disable to restrict use to only GM",
        scope : "world",
        config : true,
        type : Boolean,
        default : true
    });
    game.settings.register("TokenBar",'enable', {
        name : "Enable Token Bar",
        hint : "Uncheck if you (user) would like to disable Token Bar",
        scope : "client",
        config : true,
        default : true,
        type : Boolean
    });
    if(debug) {log(data,game.settings);}
}
function checkSettings(){
    let roller = game.settings.get('TokenBar','roller');
    switch(roller) {
        case "betterrolls5e" :
            if(game.modules.get("betterrolls5e") === undefined || game.modules.get("betterrolls5e").active === false)
            {
                game.settings.set('TokenBar','roller','game5e');
            }
            break;
        case "minor-qol" :
            if(game.modules.get("minor-qol") === undefined || game.modules.get("minor-qol").active === false)
            {
                game.settings.set('TokenBar','roller','game5e');
            }
            break;
        case "itemacro" :
            if(game.modules.get("itemacro") === undefined || game.modules.get("itemacro").active === false)
            {
                game.settings.set('TokenBar','roller','game5e');
            }
            break;
        default :
    }
}