//Import TypeScript Modules
import * as token_dropdown from './token_dropdown.js';

let debug = true;
let log = (...args) => console.log("Token Action Dropdown Bar | ", ...args);

Hooks.on('init', ()=> {
    registerSettings();
});

Hooks.on('ready', () =>{
    canvas.tokens.releaseAll();
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
    {mergeObject(data,{"betterrolls5e" : "Better Rolls for 5e"});}
    if(game.modules.get("minor-qol") !== undefined && game.modules.get("minor-qol").active === true)
    {mergeObject(data,{"minor-qol" : "Minor Quality of Life"});}
    if(game.modules.get("itemacro") !== undefined && game.modules.get("itemacro").active === true)
    {mergeObject(data,{"itemacro" : "Item Macro"});}

    game.settings.register("TokenBar",'roller', {
        name : "Token Bar Roll Type",
        hint : "Choose output for Token Bar.",
        scope : "world",
        config : true,
        type : String,
        choices : data,
        default : "game5e"
    });

    if(debug) {log(data,game.settings);}
}