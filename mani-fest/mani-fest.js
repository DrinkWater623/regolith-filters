// @ts-check
//=====================================================================
// Global variables - Part 1
//=====================================================================
const fs = require("fs");
const fileInfo = require('path');
const myUUID = require("crypto");

var argPath = process.argv[1];
var argSettings = process.argv[2];
const cmdLineSettingsJson = JSON.parse(argSettings);
let isDebug = !!cmdLineSettingsJson.Debug;
let isDebugMax = !!cmdLineSettingsJson.DebugMax;
if (isDebugMax) isDebug = true;
//=====================================================================
/*
Information:
    Author:     DrinkWater623/PinkSalt623
    Contact:    Discord/GitHub @DrinkWater623 

    Purpose:    Create manifest.json from profile settings. 
                Why?  Why not!  Cause I always have to update info when I move it out of Dev.

    Usage:      in Regolith.  Does not validate input.

    Settings:   name,version,min_game_version,description (all have defaults)
                BP/RP{any of the above to override, UUID, module}
                for UUID and module, can use real/fake UUID or the word get to get a real new one

Change Log:    
    20221220 - NAA - Created Basics - will figure out info for sub-packs and scripts later
    20230107 - NAA - Added ,null,4 to stringify to make not all one line
    20230304 - NAA - Added Julian Style Build Date to the Description (make optional Later)
                    Added default version is [yy,m,d] DW Style
    20240429 - NAA - Added Scripting stuff
    20240509 Working on multi @minecraft dependencies
    20240512 - NAA - Ability to grab author from config.json
    20240513 - Naa - Multi-Server
    20240604 - NAA - Redid practically everything - good enough to use for how I need

TODO:
    () Make is so I can have a dev and rel pack icon - prob can use the data section to hold and use by name or settings has filename
*/

//=====================================================================
//                              Classes
//=====================================================================
class Debug {
    constructor(booleanValue = true) {
        this.debugOn = booleanValue;
    }
    //--------------------------------------      
    colorsAdded = new Map(
        [
            ["userExample", 44]
        ]
    )
    #colorDefaultAssignments = new Map(
        [
            ["bold", 97],
            ["error", 91],
            ["highlight", 100],
            ["log", 95],
            ["mute", 90],
            ["success", 92],
            ["tableTitle", 100],
            ["underline", 52],
            ["warn", 103]
        ]
    )
    #colorMap = new Map(
        [
            ["red", 91],
            ["yellow", 93],
            ["green", 92],
            ["blue", 94],
            ["magenta", 95],
            ["cyan", 96],
            ["white", 97],
            ["gray", 90],
            ["black-bg", 40],
            ["red-bg", 41],
            ["yellow-bg", 103],
            ["green-bg", 102],
            ["blue-bg", 104],
            ["magenta-bg", 105],
            ["cyan-bg", 106],
            ["white-bg", 107],
            ["gray-bg", 100]
        ]
    )
    #colorReset = '\x1b[0m';
    //--------------------------------------
    off() { this.debugOn = false; this.color("red-bg", this.constructor.name + " OFF") }
    on() { this.debugOn = true; this.color("green-bg", this.constructor.name + " On") }
    toggle() { if (this.debugOn) this.off(); else this.on(); }
    isDebug() { return this.debugOn }
    //--------------------------------------    
    color(colorPtr, arg1, ...argRest) {
        if (this.debugOn && arg1)
            this.#log(colorPtr, arg1, argRest)
    }
    bold(arg1, ...argRest) {
        if (this.debugOn && arg1)
            this.#log("bold", arg1, argRest)
    }
    error(arg1, ...argRest) {
        if (this.debugOn && arg1)
            this.#log("error", arg1, argRest)
    }
    highlight(arg1, ...argRest) {
        if (this.debugOn && arg1)
            this.#log("highlight", arg1, argRest)
    }
    log(arg1, ...argRest) {
        if (this.debugOn && arg1)
            this.#log("log", arg1, argRest)
    }
    mute(arg1, ...argRest) {
        if (this.debugOn && arg1)
            this.#log("mute", arg1, argRest)
    }
    success(arg1, ...argRest) {
        if (this.debugOn && arg1)
            this.#log("success", arg1, argRest)
    }
    table(title, data = [], columns = []) { if (this.debugOn && data.length) this.#table(title, data, columns) }
    underline(arg1, ...argRest) {
        if (this.debugOn && arg1)
            this.#log("underline", arg1, argRest)
    }
    warn(arg1, ...argRest) {
        if (this.debugOn && arg1)
            this.#log("warn", arg1, argRest)
    }
    colorsList() {
        if (this.colorsAdded.size > 0) {
            this.highlight("User Defined Colors (Overrides Defaults)")
            this.colorsAdded.forEach(
                (value, key) => {
                    let colorString = "\x1b[" + value + "m%s"
                    console.log(colorString, "User Defined Color:", key, value, this.#colorReset)
                }
            )
        }

        this.highlight("Default Assignments")
        this.#colorDefaultAssignments.forEach(
            (value, key) => {
                let colorString = "\x1b[" + value + "m%s"
                console.log(colorString, "Color Default Assignments:", key, value, this.#colorReset)
            }
        )

        this.highlight("Colors")
        this.#colorMap.forEach(
            (value, key) => {
                let colorString = "\x1b[" + value + "m%s"
                console.log(colorString, "Color:", key, value, this.#colorReset)
            }
        )
    }
    //--------------------------------------
    #colorNumberGet(color) {

        if (typeof color === "number") return color;
        else
            if (typeof color === "string") {
                //@ts-ignore
                if (this.colorsAdded.has(color)) return this.colorsAdded.get(color)
                //@ts-ignore
                else if (this.#colorDefaultAssignments.has(color)) return this.#colorDefaultAssignments.get(color)
                //@ts-ignore
                else if (this.#colorMap.has(color)) return this.#colorMap.get(color)
                //@ts-ignore
                else return this.#colorMap.get("gray-bg")
            }
            //@ts-ignore
            else return this.#colorMap.get("gray-bg")
    }
    #log(color, arg1, argsRest) {

        /**
         *   no argsRest and is Array use log-array
         *   same type.... use log-comma
         *   ar1 not array and argsRest is array, unArray i
         */
        if (argsRest === undefined) argsRest = [""]

        if (typeof arg1 === 'undefined') { return }
        else if (typeof arg1 === 'string') { if (!arg1) return }
        else if (typeof arg1 === 'object') { if (Object.keys(arg1).length = 0) return }
        //console.log(arg1)
        //console.log(argsRest)
        var [arg2 = "", arg3 = "", arg4 = "", arg5 = "", arg6 = "", arg7 = "", arg8 = "", arg9 = "", arg10 = "", arg11 = "", arg12 = "", arg13 = "", arg14 = "", arg15 = "", arg16 = ""] = argsRest;

        if (argsRest === undefined || argsRest.length === 0) {
            if (Array.isArray(arg1)) this.#log_array(color, arg1)
            else this.#log_comma(color, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16);
            return;
        }

        //TODO: if all is array of strings over 15, then concatenate and send
        if (Array.isArray(argsRest) && argsRest.length > 15) {
            //@ts-ignore
            this.#log_comma(color, arg1, argsRest, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16)
            return
        }

        //What is left should be out of array if under 9 elements
        this.#log_comma(color, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16);
        return;
    }
    #log_comma(color, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16) {
        let isWarning = false;
        let isError = false;
        let colorNumber = this.#colorNumberGet(color);

        if (typeof color === "string") {
            isError = (color === "error");
            isWarning = (color === "warn");
        }

        let colorString = "\x1b[" + colorNumber + "m%s"

        if (isWarning) console.warn(colorString, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16, this.#colorReset)
        else if (isError) console.error(colorString, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16, this.#colorReset)
        else console.log(colorString, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16, this.#colorReset)
    }

    #log_array(color, args = []) {

        if (typeof args === "undefined" || args.length === 0) return;

        if (!Array.isArray(args)) {
            this.#log_comma(color, args)
            return;
        }

        let isWarning = false;
        let isError = false;
        // @ts-ignore
        let isSuccess = false;
        let colorNumber = this.#colorNumberGet(color);

        if (typeof color === "string") {
            isError = (color === "error");
            isWarning = (color === "warn");
            isSuccess = (color === "success");
        }

        let colorString = "\x1b[" + colorNumber + "m"

        for (let obj of args) {
            let colorStr = colorString;
            if (["boolean", "string"].includes(typeof obj)) colorStr += '%s';
            else if (["bigint", "number"].includes(typeof obj)) colorStr += '%i';
            else if (typeof obj === "object") colorStr += '%o';

            if (isWarning) console.warn(colorStr, obj, this.#colorReset)
            else if (isError) console.error(colorStr, obj, this.#colorReset)
            else console.log(colorStr, obj, this.#colorReset)
        }
    }
    //TODO: Find out if can add color in table by copying, adding color string and print that
    #table(title, data = [], columns = []) {
        if (typeof title === "string")
            this.#log("tableTitle", title);
        else console.table(title);

        //TODO: Fix for different ways being sent LATER
        //if (typeof data === "string")
        //    if(columns.length)
        //        if (typeof columns === "string")
        //            console.log(data,columns )
        //    else 
        //    else
        //        console.table(data,columns);
        //else console.table(title);

        if (columns.length == 0)
            console.table(data);
        else
            console.table(data, columns);
    }
    //------------------------------------------    
    static color(color, arg1, ...args) { let temp = new Debug(true); temp.color(color, arg1, args.length === 1 ? args[0] : args) }
    static error(arg1, ...args) { let temp = new Debug(true); temp.error(arg1, args.length === 1 ? args[0] : args) }
    static highlight(arg1, ...args) { let temp = new Debug(true); temp.highlight(arg1, args.length === 1 ? args[0] : args) }
    static log(arg1, ...args) { let temp = new Debug(true); temp.log(arg1, args.length === 1 ? args[0] : args) }
    static mute(arg1, ...args) { let temp = new Debug(true); temp.mute(arg1, args.length === 1 ? args[0] : args) }
    static table(title, data, columns) { let temp = new Debug(true); temp.table(title, data, columns) }
    static success(arg1, ...args) { let temp = new Debug(true); temp.success(arg1, args.length === 1 ? args[0] : args) }
    static warn(arg1, ...args) { let temp = new Debug(true); temp.warn(arg1, args.length === 1 ? args[0] : args) }
}
//=====================================================================
class is {

    static array(candidate) { return Array.isArray(candidate) }
    static boolean(candidate) { return typeof candidate === "boolean" }
    static function(candidate) { return typeof candidate === "function"; }
    static null(candidate) { return Object.is(candidate, null); }
    static number(candidate) { return typeof candidate === "number" || typeof candidate === "bigint" }
    static object(candidate) { return typeof candidate === "object" }
    static string(candidate) { return typeof candidate === "string"; }
    static symbol(candidate) { return typeof candidate === "symbol"; }
    static undefined(candidate) { return typeof candidate === "undefined"; }
    //---------------------------------------------------------------------------
    static notArray(candidate) { return !Array.isArray(candidate) }
    static notBoolean(candidate) { return typeof candidate !== "boolean" }
    static notFunction(candidate) { return typeof candidate !== "function"; }
    static notNull(candidate) { return !Object.is(candidate, null); }
    static notNumber(candidate) { return typeof candidate !== "number" && typeof candidate !== "bigint" }
    static notObject(candidate) { return typeof candidate !== "object" }
    static notString(candidate) { return typeof candidate !== "string"; }
    static notSymbol(candidate) { return typeof candidate !== "symbol"; }
    static notUndefined(candidate) { return typeof candidate !== "undefined"; }

    static empty(object) {
        //false is not empty, 0 is not empty
        if (Object.is(object, undefined)) return true
        if (Object.is(object, null)) return true
        if (is.object(object)) return !!Object.keys(object).length
        if (is.string(object)) return !!object.length
        return false
    }
    static notEmpty(object) {
        //false is not empty, 0 is not empty
        if (Object.is(object, undefined)) return false
        if (Object.is(object, null)) return false
        if (is.object(object)) return !Object.keys(object).length
        if (is.string(object)) return !object.length
        return true
    }
    static exact(arg, compareArg) { return arg === compareArg }
    static notExact(arg, compareArg) { return arg !== compareArg }
    static equal(arg, compareArg) {
        if (arg == compareArg) return true;
        //if (arg == compareArg) return true;

        //dive deeper
        if (typeof arg !== typeof compareArg) return false;
        if (is.array(arg) !== is.array(compareArg)) return false;

        //arrays
        if (is.array(arg)) {
            if (arg.length != compareArg.length) return false;

            //if either has some objects in the array
            if (arg.some(obj => typeof obj === "object")) return false //for now
            if (compareArg.some(obj => typeof obj === "object")) return false //for now
            //what about emptys
            for (let v of arg) if (!compareArg.includes(v)) return false;
            return true;
        }
        // objects - non arrays?   this is more complex - needs more testing and thought
        let argKeys = arg.keys()
        let compareArgKeys = compareArg.keys()
        if (argKeys.length !== compareArgKeys.length) return false

        //TODO:  way more to compare see the lib tests on objects/maps/?sets
        //trying to get down to if the values are the same, regardless of how stored

        return false;
    }
    static notEqual(arg, compareArg) { return !is.equal(arg, compareArg) }
}
class has {
    static key(object = {}, keyName = "") {
        // @ts-ignore
        return (typeof object === "object") && Object.hasOwn(object, keyName);
    }
    static keyValue(object = [{}], keyName = "", value) {
        if (typeof object !== 'object') return false;
        if (typeof value === 'object') return has.keyValues(object, keyName, value);

        if (!Array.isArray(object)) {
            // @ts-ignore
            return Object.hasOwn(object, keyName) && object[keyName] === value;
        }
        //Array, so check each object of array until found
        const objList = object
            .filter(obj => typeof obj === 'object')
            // @ts-ignore
            .filter(Object.hasOwn(obj, keyName))
            .filter(obj => typeof obj[keyName] !== 'object')
            .filter(obj => obj[keyName] === value)

        return !!objList.length
    }
    //TODO:  keyValues NOT DONE - need to .....
    static keyValues(object = [], keyName = "", compareObject = {}) {
        if (typeof object !== 'object') return false;
        if (typeof compareObject !== 'object') return has.keyValue(object, keyName, compareObject);

        if (!Array.isArray(object)) {
            // @ts-ignore
            return Object.hasOwn(object, keyName) && object[keyName] === compareObject;
        }

        //Array, so check each object of array until found
        const objList = object
            .filter(obj => typeof obj === 'object')
            // @ts-ignore
            .filter(Object.hasOwn(obj, keyName))
            .map(obj => obj[keyName])

        if (objList.length == 0) return false
    }
    static values(object) {
        //false is not empty, 0 is not empty
        if (Object.is(object, undefined)) return true
        if (Object.is(object, null)) return true
        if (is.object(object)) return !!Object.keys(object).length
        if (is.string(object)) return !!object.length
        return false
    }
}
//=====================================================================
class FetchSiteJsonStack {
    constructor(sites = []) {
        this.fetchStack = sites
            .filter(v => typeof v === "string")
            .filter(v => v.length > 0)
            .map(site => this.#siteObj(site));
    }
    promiseStack = [];
    //--------------------------------------
    debugOn = false;
    #colorReset = '\x1b[0m';
    #colorMap = new Map(
        [
            ["bold", 97],
            ["error", 91],
            ["highlight", 47],
            ["log", 38],
            ["mute", 90],
            ["success", 92],
            ["warn", 93]
        ]
    )
    #colorString(colorName) {
        return "\x1b[" + this.#colorMap.get(colorName) + "m%s"
    }
    //--------------------------------------    
    #siteObj(site) {
        return {
            site: site,
            success: false,
            data: {},
            dataType: "Unknown",
            err: ""
        }
    }
    //add fetchSiteDel....
    fetchAdd(...sites) {
        sites
            .filter(v => typeof v === "string")
            .filter(v => v.length > 0)
            .forEach(site => this.fetchStack.push(this.#siteObj(site)))
    }
    #fetchNext() {
        if (this.fetchStack.length === 0) return;

        // @ts-ignore
        let errCode = this.#colorString("error");
        // @ts-ignore
        let warnCode = this.#colorString("warn");
        // @ts-ignore
        let successCode = this.#colorString("success");

        let newFetch = this.fetchStack.shift()
        if (typeof newFetch != "object") return;

        //should this be b4 the pop?  not sure
        this._preFetchEach(newFetch);
        //because user could alter the object
        if (!("site" in newFetch) || newFetch.site.length === 0) {
            if (this.fetchStack.length) this.#fetchNext();
            return;
        }

        if (this.debugOn) console.log(this.#colorString("bold"), "==> Fetching Site:", newFetch.site, this.#colorReset)

        fetch(newFetch.site)
            .then(response => {
                let returnedJson = {}

                if (response.ok) {
                    newFetch.success = true;
                    console.log(this.#colorString("success"), "==> Fetch Successful:", newFetch.site, this.#colorReset)
                    //FIXME:              
                    try {
                        returnedJson = response.json();
                        newFetch.dataType = 'json'
                    }
                    catch (err) {
                        console.error(this.#colorString("error"), "xx> Not a JSON Site:", newFetch.site, this.#colorReset)
                    }
                }
                else {
                    newFetch.success = false;
                    console.warn(this.#colorString("warn"), "xx> Fetch Response Not-Ok:", newFetch.site, this.#colorReset);
                }
                return returnedJson;
            })
            .then(data => { //note: keep this part sep from above, works better
                if (newFetch.success)
                    newFetch.data = data;
            })
            .catch(error => {
                newFetch.err = error;
                if (this.debugOn) console.error(this.#colorString("error"), "xx> Fetch Error:", error, this.#colorReset)
            })
            .finally(() => {
                this.promiseStack.push(newFetch);

                this._postPromiseEach();

                if (this.fetchStack.length)
                    this.#fetchNext();
                else {
                    //if (this.debugOn) console.log(this.#colorString("success"), "==> Fetch Stack is Now Empty!");
                    if (this.debugOn) console.log(this.#colorString("mute"), "<== fetchNext()");
                    this._postPromiseAll();
                }
            });
    }
    fetchesStart() {
        if (this.debugOn) console.log("==> fetchStart()")
        if (this.fetchStack.length > 0)
            this.#fetchNext()
        else
            console.warn(this.#colorString("warn"), "xx> Fetch List is Empty")
    }
    consoleLogFetchList() {
        if (this.debugOn) console.log(this.#colorString("bold"), "* consoleLogFetchList()", "length:", this.fetchStack.length);
        let list = [];
        this.fetchStack.forEach(v => list.push(v.site));
        if (list.length > 0) console.table(list);
        else if (this.debugOn) console.warn(this.#colorString("warn"), "Fetch List is Empty")
    }
    consoleLogPromiseList() {
        if (this.debugOn) console.log(this.#colorString("bold"), "* consoleLogPromiseList()", "length:", this.promiseStack.length);
        let list = [];
        this.promiseStack.forEach(v => list.push(
            {
                Retrieved: v.success,
                DataType: v.dataType,
                Site: v.site
            }));
        if (list.length > 0) console.table(list);
        else if (this.debugOn) console.warn(this.#colorString("warn"), "==> Response List is Empty")
    }
    //for Json Data Only else will fail
    consoleLogPromiseKeys() {
        if (this.debugOn) console.log(this.#colorString("bold"), "* consoleLogPromiseKeys()", "length:", this.promiseStack.length);
        if (this.promiseStack.length == 0) {
            if (this.debugOn) console.warn(this.#colorString("warn"), "==> Response List is Empty")
            return;
        }
        for (let i in this.promiseStack) {
            let obj = this.promiseStack[i]

            if (obj.success) {
                console.info(this.#colorString("success"), "Site:", obj.site, this.#colorReset)
                const keys = Object.keys(obj.data);
                console.table(keys);
            }
            else
                console.error(this.#colorString("error"), "Failed Site:", obj.site, "Err:", obj.err, this.#colorReset)
        }
    }
    //--------------------------------------------------------------
    //Expecting Class user to Overwrite these in their extended copy
    //--------------------------------------------------------------
    /*
    This is called after each fetch is done whether it failed or not.  
    This is how you can use your extend class functions in between fetches
    i.e. you extended the constructor and want to add properties and update them
    i.e. change the fetch stack based on response information
    */
    // @ts-ignore
    _preFetchEach(fetchObj) {
        if (this.promiseStack.length === 0) {
            console.warn(this.#colorString("warn"), "* _preFetchEach(fetchObj) is called before every site fetch.")
            console.warn(this.#colorString("warn"), "\tReplace it in your Extended class")
        }
    }
    /*
    This is called after each promise is returned, whether it failed or not.  
    This is how you can use your extend class functions in between fetches
    i.e. you extended the constructor and want to add properties and update them
    i.e. change the fetch stack based on response information
    */
    _postPromiseEach() {
        if (this.promiseStack.length === 1) {
            console.warn(this.#colorString("warn"), "* _postPromiseEach() is called after the returned promise of every fetch.")
            console.warn(this.#colorString("warn"), "\tReplace it in your Extended class")
        }
    }
    /*
    This is called after last fetch in stack is done.  
    This is how you can continue your node program, making it wait until all the promises are fulfilled
    before it continues to your next function
    */
    _postPromiseAll() {
        console.warn(this.#colorString("warn"), "* _postPromiseAll() is called after all promises are returned.")
        console.warn(this.#colorString("warn"), "\tReplace it in your Extended class, to keep processing alive in Node JS")
        this.consoleLogPromiseList()
    }
}
//=====================================================================
class McModuleFetchStack extends FetchSiteJsonStack {
    //If I wanted to add to the constructor
    /*
        constructor(sites=[]){
            super(sites);
            this.newVariable = 0;
        }    
    */
    _preFetchEach() { }
    _postPromiseEach() { }
    _postPromiseAll() {
        mainAfterFetch();
    }
}
//=====================================================================
// Global variables - Part 2
//=====================================================================
//const scriptsFolder = "BP/scripts";
let bpFiles = [];
let rpFiles = [];
const validScriptModules = []
validScriptModules.push({ module_name: "@minecraft/server", total: 0 })
validScriptModules.push({ module_name: "@minecraft/server-ui", total: 0 })
validScriptModules.push({ module_name: "@minecraft/common", total: 0 })
validScriptModules.push({ module_name: "minecraft-bedrock-server", total: 0 })
// Console Logging
const debug = new Debug(isDebug);
debug.colorsAdded.set("functionStart", 96)
//debug.colorsAdded.set("tableTitle", 96)
debug.colorsAdded.set("list", 36)
debug.colorsAdded.set("log", 40)

const debugMax = new Debug(isDebugMax);
debugMax.colorsAdded.set("log", 95)

const consoleColor = new Debug(!cmdLineSettingsJson.Silent);
consoleColor.colorsAdded.set("highlight", 93)
consoleColor.colorsAdded.set("possibleWarn", 93)
consoleColor.colorsAdded.set("possibleError", 91)

let myFetch; //leave as let, defined if use, needs to be global, as will be new Object from Fetch Class

//=====================================================================
//          Function Library
//=====================================================================
function deleteCommentBlockSameLine(string = "") {
    if (typeof string !== "string") return string;

    while (string.search(/\/\*.*\*\//) >= 0) {
        string = string.replace(/\/\*.*\*\//, "")
    }

    return string;
}
function deleteCommentBlockMultiLine(string = "") {
    if (typeof string !== "string") return string;

    /*
    must do one at a time because .replaceAll with /g flag
    takes first / *  and last * / 
    and not the distinct pairs of them
    also
    doesn't work well for when they are in strings like s = `/*`
    */
    const aUID = require("crypto")
    let stopInfiniteLoop = 0
    const slashStar = aUID.randomUUID();
    const starSlash = aUID.randomUUID();
    const re = new RegExp(slashStar + `.*` + starSlash, "s")
    while (string.search(/\/\*[\s\S]*\*\//) >= 0 && stopInfiniteLoop++ <= 1000) {
        string = string
            .replace("/*", slashStar)
            .replace("*/", starSlash)
            .replace(re, "")
            .replace(slashStar, "/*")
            .replace(starSlash, "*/")
    }
    //console.log(stopInfiniteLoop)
    return string;
}
function deleteCommentBlocks(string = "") {
    if (typeof string !== "string") return string;
    //this order because // can be inside /*  */ and can steal ending */
    string = deleteCommentBlockSameLine(string);
    string = deleteCommentBlockMultiLine(string);
    return string;
}
//=====================================================================
function deleteCommentLines(string = "") {
    if (typeof string !== "string") return string;
    //@ts-ignore   
    return string.replaceAll(/\/\/.*/g, "")
}
//=====================================================================
function deleteComments(string = "") {
    if (typeof string !== "string") return string;
    //this order because // can be inside /*  */ and can steal ending */
    string = deleteCommentBlocks(string);
    string = deleteCommentLines(string);
    return string;
}
function deleteJson(string = "") {
    //everything within {}
    if (typeof string !== "string") return string;
    const re = /\{.*?\}/s;
    while (string.search(re) >= 0) {
        string = string.replace(re, "")
    }
    return string;
}
//=======================================================================
function isArrayOfObjects(array = [{}]) {
    if (Array.isArray(array))
        return array.every((item) => typeof item === "object");

    return false;
}
function isArrayOfSomeObjects(array = [{}]) {
    if (Array.isArray(array))
        return array.some((item) => typeof item === "object");

    return false;
}
function isArrayOfKeyValuePairs(array = [{}]) {
    if (!isArrayOfObjects(array)) return false;
    if (array.some((item) => Array.isArray(item))) return false
    return true;
}
function isArrayOfStrings(array = [""]) {
    if (Array.isArray(array))
        return array.every((item) => typeof item === "string");

    return false
}
// @ts-ignore
function isArrayOfArrays(array = [[]]) {
    if (Array.isArray(array))
        return array.every((item) => Array.isArray(item));

    return false;
}
function isArrayOfSameTypes(array = []) {
    if (!Array.isArray(array)) return false

    let firstType = typeof array[0]
    return array.every((item) => typeof item === firstType);
}
// @ts-ignore
function isArrayOfMixedTypes(array = []) {
    return !isArrayOfSameTypes(array);
}
// @ts-ignore
function arrayDeleteValues(array = [""], value) {
    if (!Array.isArray(array)) return;
    if (isArrayOfSomeObjects(array)) return;

    let i = -1;
    do {
        i = array.indexOf(value);
        if (i >= 0) array.splice(i, 1);
    } while (i >= 0);
}
function arrayDeleteIfKeyExist(array = [{}], key = "", debug = false) {
    if (!isArrayOfKeyValuePairs(array)) return;
    let i = 0;
    while (i >= 0 && array.length > 0) {
        i = array.findIndex(obj => key in obj);
        if (i >= 0) {
            if (debug) console.log("debug> Deleting ->", key, "=", array[i][key])
            array.splice(i, 1);
        }
    }
}
// @ts-ignore
function arrayDeleteIfKeyValue(array = [{}], key = "", value = "", debug = false) {
    if (!isArrayOfKeyValuePairs(array)) return;
    let i = 0;
    while (i >= 0 && array.length > 0) {
        i = array.findIndex(obj => key in obj && obj[key] === value);
        if (i >= 0) {
            if (debug) console.log("debug> Deleting ->", key, "=", array[i][key])
            array.splice(i, 1);
        }
    }
}
function arrayKeyValueArrayMerge(array = [{}], key = "", valueArray = [""], debug = false) {
    if (!isArrayOfKeyValuePairs(array)) return;
    if (!Array.isArray(valueArray)) return;
    if (!valueArray.every(v => typeof v === "string")) return

    let i = 0;
    while (i >= 0 && array.length > 0) {
        i = array.findIndex(obj => key in obj && !valueArray.includes(obj[key]));
        if (i >= 0) {
            if (debug) console.log("debug> Deleting ->", key, "=", array[i][key])
            array.splice(i, 1);
        }
    }
}
function arrayDeleteObjectIfKeyNotOnList(objectArray = [{}], keyArray = [""], debug = false) {
    if (!isArrayOfKeyValuePairs(objectArray)) return;
    if (!isArrayOfStrings(keyArray) || is.string(keyArray)) return;

    //@ts-ignore
    if (is.string(keyArray)) keyArray = keyArray.split(",")

    const ctr = objectArray.length
    for (let i = 0; i < ctr; i++) {
        const obj = objectArray.pop()
        let isValid = false

        for (let j = 0; j < keyArray.length; j++) {
            //@ts-ignore
            if (Object.hasOwn(obj, keyArray[j])) {
                isValid = true
                break;
            }
        }

        // @ts-ignore
        if (isValid) objectArray.push(obj)
    }
}
function arrayIfKeyExist(array, key) {
    if (!Array.isArray(array)) return false;

    for (let i = 0; i < array.length; i++) {
        if (typeof array[i] === "object")
            if (!Array.isArray(array[i]))
                if (key in array[i]) return true;
    }
    return false
}
function deDupeStringToArray(str, delimiter = ',') {
    if (Array.isArray(str)) return deDupeNonObjectArray(str);
    if (typeof str !== "string") return str;
    if (!str.length) return []

    let array;
    array = str.split(delimiter)
    return [...new Set(array)]
}
function deDupeNonObjectArray(array) {
    if (!Array.isArray(array)) return array;
    if (array.some(obj => typeof obj === "object")) return array;
    return [...new Set(array)]
}
//=======================================================================
function newUUID() { return myUUID.randomUUID(); }
//=======================================================================
function isFile(path) {
    if (!fs.existsSync(path)) return false
    return fs.lstatSync(path).isFile()
}
function isFolder(path) {
    if (!fs.existsSync(path)) return false
    return fs.lstatSync(path).isDirectory()
}
function isEmptyFolder(path) {

    if (!fs.existsSync(path)) return true;
    if (!fs.lstatSync(path).isDirectory()) return true;

    let fileCount = fs.readdirSync(path).length;
    return fileCount == 0 ? true : false;
}
// @ts-ignore
function containFilesWithExt(path, ext) {
    if (isEmptyFolder(path)) return false;
    return fs.readdirSync(path).filter(f => f.endsWith("." + ext)).length > 0 ? true : false;
}
function fileTreeGet(path, minFileSize = 0, onlyExt = "") {
    return treeGet(path, minFileSize, false, true, onlyExt)
}
// @ts-ignore
function folderTreeGet(path, minObjSize = 0, onlyExt = "") {
    return treeGet(path, minObjSize, true, false, onlyExt)
}
function treeGet(path, minSize = 0, folders = true, files = true, onlyExt = "") {
    // @ts-ignore
    const fg_Error = '\x1b[91m%s'
    // @ts-ignore
    const fg_Success = '\x1b[92m%s'
    const fg_Warning = '\x1b[91m%s'

    //TODO:add pattern for folder and for path separately
    debugMax.log("==> treeGet(" + path + "," + minSize + "," + folders + "," + files + "," + onlyExt + ")")
    let returnList = []

    if (!folders && !files) return []

    try {
        fs.readdirSync(path)
    }
    catch {
        console.log(fg_Warning, "xx> Error: Folder =", path, "Does Not Exist, Skipping")
        return []
    }
    const tempFileList = fs.readdirSync(path)

    for (let f of tempFileList) {
        const fullFileName = (path + '/' + f).replace('//', '/');
        let treeObj =
        {
            fileName: fullFileName,
            parse: fileInfo.parse(fullFileName),
            isFile: !isFolder(fullFileName),
            size: 0,
            keep: false
        }

        if (files && treeObj.isFile) {
            treeObj.size = fs.readFileSync(fullFileName).length
            treeObj.keep = files && treeObj.size >= minSize || (onlyExt.length == 0 || treeObj.parse.ext == onlyExt);
        }
        else if (!treeObj.isFile) {
            const newSearch = treeGet(fullFileName, minSize, folders, files, onlyExt);
            treeObj.size = newSearch.length
            for (let i in newSearch) returnList.push(newSearch[i]);

            treeObj.keep = folders && treeObj.size >= minSize && (onlyExt.length == 0 || treeObj.parse.ext == onlyExt);
        }

        if (treeObj.keep) returnList.push(treeObj);
    }

    debugMax.mute("<== treeGet")
    return returnList.filter(obj => obj.keep);
}
//=======================================================================
function objectsMerge(myObject, emulateObject) {
    if (typeof emulateObject != "object" || Array.isArray(emulateObject)) return {};
    if (typeof myObject != "object" || Array.isArray(myObject)) return {};
    return objectKeysMerge(Object.assign({}, emulateObject, myObject), emulateObject);
}
function objectKeysMerge(myObject, emulateObject) {
    if (typeof emulateObject != "object" || Array.isArray(emulateObject)) return {};
    if (typeof myObject != "object" || Array.isArray(myObject)) return {};

    let object = Object.assign({}, myObject);
    const emulateKeys = Object.keys(emulateObject)
    const myInvalidKeys = Object.keys(myObject).filter(key => !emulateKeys.includes(key))

    for (let key of myInvalidKeys) delete object[key];

    return object;
}
function stringArraysMerge(myArray, arrayFilter) {
    if (!isArrayOfStrings(myArray)) return [];
    if (!isArrayOfStrings(arrayFilter)) return [];
    return myArray.filter(v => arrayFilter.includes(v));
}
//=======================================================================
//   End of Function Library
//=======================================================================

//=======================================================================
//  Related to scraping the import { } from 'minecraft/....'
//=======================================================================
function squishIt(string = "") {
    if (typeof string !== "string") return string;
    //@ts-ignore
    //spaces first
    string = string.replaceAll("\t", " ")
    //@ts-ignore
    string = string.replaceAll("\r", "\n")
    //@ts-ignore
    while (string.includes("  ")) string = string.replaceAll("  ", " ")
    let s = "\n "
    //@ts-ignore
    while (string.includes(s)) string = string.replaceAll(s, "\n")
    s = " \n"
    //@ts-ignore
    while (string.includes(s)) string = string.replaceAll(s, "\n")
    //@ts-ignore
    while (string.includes("\n\n")) string = string.replaceAll("\n\n", "\n")
    //@ts-ignore
    string = string.replaceAll(`\n"`, `"`)

    return string;
}
function scrapeMinecraftModuleNamesFromJS(jsCode = "") {
    debugMax.color("functionStart", "==> scrapeMinecraftModuleNamesFromJS()");

    jsCode = deleteComments(jsCode);
    if (jsCode.search(/import.*\{.*}.*from.*[@"]minecraft[//-]/s) < 0) return []

    jsCode = deleteJson(jsCode)
    if (jsCode.search(/import.*from.*[@"]minecraft[//-]/s) < 0) return []

    //if (jsCode.search(/[@"]minecraft[//-]/) < 0) return []
    //if (!jsCode.includes("import")) return []
    //if (!jsCode.includes("from")) return []

    //@ts-ignore
    jsCode = jsCode.replaceAll(";import", "\nimport")
    //@ts-ignore
    jsCode = jsCode.replaceAll("\timport", "\nimport")
    //@ts-ignore
    jsCode = jsCode.replaceAll(" import", "\nimport")
    jsCode = squishIt(jsCode);
    while (jsCode.includes("\nfrom")) jsCode = jsCode.replace("\nfrom", " from")
    const id = "»import»from»"
    //@ts-ignore
    jsCode = jsCode.replaceAll(/import from/g, id).replaceAll(/[`'";]/g, "")

    //Isolate
    let posFirstID = jsCode.indexOf(id)
    if (posFirstID < 0) return []
    let posLastID = jsCode.lastIndexOf(id)
    let posNextLF = jsCode.indexOf("\n", posLastID)
    //@ts-ignore
    jsCode = jsCode.substring(posFirstID, posNextLF).replaceAll(" ", "")
    //@ts-ignore
    jsCode = jsCode.replaceAll("\n", ",").replaceAll(id, "")

    const modArray = [...new Set(jsCode.split(",").filter(v => v.includes("minecraft")))]
    debug.table("Debug: Module Names Found", modArray)
    debugMax.mute("<== scrapeMinecraftModuleNamesFromJS()");
    return modArray
}
function scrapeScriptsImportFromMinecraftModuleNames() {
    debug.color("functionStart", "==> scrapeScriptsImportFromMinecraftModuleNames()");

    const bpSettings = cmdLineSettingsJson.BP;
    let isValid = false;

    bpSettings.jsModList = []
    if (bpSettings.jsFileList.length > 0) {
        debug.table("Debug: JS File List to Scrape", bpSettings.jsFileList)

        const stmtList = [];

        for (let fileObj of bpSettings.jsFileList) {
            let fileName = fileObj.fileName
            debug.log("==> Reading File:", fileName)
            let jsCode = fs.readFileSync(fileObj.fileName, 'utf8');
            const modList = scrapeMinecraftModuleNamesFromJS(jsCode);
            if (modList.length) modList.forEach(v => { if (!stmtList.includes(v)) stmtList.push(v.toLowerCase()) })
        }

        if (stmtList.length) {
            const modNames = validScriptModules.map(obj => obj.module_name)
            bpSettings.jsModList = stringArraysMerge([...new Set(stmtList)], modNames)
            if (bpSettings.jsModList.length) isValid = true;
        }
    }

    if (!isValid)
        //debug.table("Modules Scraped from JS Files", bpSettings.jsModList)
        consoleColor.color("possibleWarn", "==> No Valid Minecraft Modules Scraped from JS Files")

    debugMax.mute("<== scrapeScriptsImportFromMinecraftModuleNames()");
    return isValid;
}
//=======================================================================
function isLiveBehaviorPackFolder() {
    debug.color("functionStart", "==> isLiveBehaviorPackFolder()")

    //Either has scripts or read each json file, strip comments and see if any code inside.. must be at least one.

    if (isEmptyFolder("BP")) { bpFiles = []; return false; }
    bpFiles = fileTreeGet("./BP");

    let fileList = bpFiles
        .filter(obj => obj.fileName != './BP/pack_icon.png') //does not count
        .filter(obj => obj.fileName != './BP/manifest.json') //does not count
        .filter(obj => obj.size > 4)
    if (fileList.length === 0) {
        consoleColor.color("possibleWarn", "==> No Valid Behavior Pack Files")
        return false;
    }

    const bpSettings = cmdLineSettingsJson.BP;

    //Check Script Files
    bpSettings.jsFileList = fileList
        .filter(fileObj => fileObj.parse.dir == './BP/scripts')
        .filter(fileObj => fileObj.parse.ext == '.js')
        .filter(fileObj => fileObj.size > 30)
    //console.table(fileList[0].parse)
    if (bpSettings.jsFileList.length) {
        if (scrapeScriptsImportFromMinecraftModuleNames()) {
            bpSettings.isScriptingFiles = true
            consoleColor.success("==> Found Valid Scripting Files (w/ Import From minecraft module)")
            return true
        }
    }
    bpSettings.isScriptingFiles = false
    delete cmdLineSettingsJson.module_names;
    delete bpSettings.module_names;
    arrayDeleteIfKeyExist(cmdLineSettingsJson.dependencies, "module_name", debug.debugOn)
    arrayDeleteIfKeyExist(bpSettings.dependencies, "module_name", debug.debugOn)

    //Check JSON files TODO:
    fileList = fileList.filter(obj => obj.parse.ext == ".json")
    if (fileList.length) {
        consoleColor.success("==> Found BP JSON Files")
        return true
    }

    debug.color("possibleWarn", "==> No Valid Behavior Pack Files Found")
    debugMax.mute("<== isLiveBehaviorPackFolder()")
    return false;
}
function isLiveResourcePackFolder() {
    debug.color("functionStart", "==> isLiveResourcePackFolder()")

    //Either has png/tga  or  read each json file, strip comments and see if any code inside.. must be at least one.

    if (isEmptyFolder("RP")) { rpFiles = []; return false; }
    rpFiles = fileTreeGet("./RP");

    let fileList = rpFiles
        .filter(obj => obj.fileName != './RP/pack_icon.png') //does not count 
        .filter(obj => obj.fileName != './RP/manifest.json') //does not count
        .filter(obj => obj.size > 4)
    if (fileList.length === 0) {
        consoleColor.color("possibleWarn", "==> No Valid Resource Pack Files")
        return false;
    }

    //Ok if png or tga files or lang files
    if (fileList.some(obj => obj.parse.dir.startsWith = '/RP/textures/' && [".png", ".tga"].includes(obj.parse.ext))) {
        consoleColor.success("==> Found RP png/tga Files")
        return true
    }
    if (fileList.some(obj => obj.parse.dir.startsWith = '/RP/texts/' && obj.parse.ext == ".lang")) {
        consoleColor.success("==> Found RP .lang Files")
        return true //TODO: make sure not emptyish
    }

    //Check JSON files TODO:
    fileList = fileList.filter(obj => obj.parse.ext == ".json")
    if (fileList.length) {
        consoleColor.success("==> Found RP JSON Files")
        return true
    }

    consoleColor.color("possibleWarn", "==> No Valid Resource Files Files")
    debugMax.mute("<== isLiveResourcePackFolder()")
    return false
}
//=======================================================================
function verifyConfigPackDependencies() {
    debug.log("==> verifyConfigPackDependencies()");

    debugMax.log("==> Checking for other manifest.json files")
    //TODO: Read those manifest files and incorporate info
    let truthy = (bpFiles.filter(v => v.size > 0 && v.fileName == "./BP/manifest.json").length) ||
        (rpFiles.filter(v => v.size > 0 && v.fileName == "./RP/manifest.json").length)
    cmdLineSettingsJson.packDependencies = !truthy
    if (!cmdLineSettingsJson.packDependencies)
        consoleColor.warn("==> Cannot do dependencies if you make your own manifest.json!")
    else debugMax.mute("==> No Other manifest.json files")

    debugMax.mute("<== verifyConfigPackDependencies()");
}
//=======================================================================
//not used - delete if delete verifyConfigScripting_Dependencies
function moduleNameFix(module_name = "") {
    if (module_name.length == 0) return ""

    const modNames = validScriptModules.map(obj => obj.module_name)
    if (modNames.includes(module_name)) return module_name;
    for (let mod of modNames) if (mod.endsWith(module_name)) return mod;
    return "";
}
//=======================================================================
//not used - may need if I want to build override in - for now js file import from is used by default
// @ts-ignore
function verifyConfigScripting_Dependencies() {
    debugMax.log("==> verifyConfigScripting_Dependencies()");

    let bpSettings = cmdLineSettingsJson.BP;
    bpSettings.getScriptModuleNames = !!bpSettings.getScriptModuleNames;

    if (!bpSettings.getScriptModuleNames && is.equal(bpSettings.module_names, "get")) bpSettings.getScriptModuleNames = true;
    if (!bpSettings.getScriptModuleNames && is.equal(bpSettings.dependencies, "get")) bpSettings.getScriptModuleNames = true;

    if (!bpSettings.getScriptModuleNames && is.equal(cmdLineSettingsJson.module_names, "get")) bpSettings.getScriptModuleNames = true;
    if (!bpSettings.getScriptModuleNames && is.equal(cmdLineSettingsJson.dependencies, "get")) bpSettings.getScriptModuleNames = true;

    if (bpSettings.getScriptModuleNames) {
        if (bpSettings.dependencies) {
            if (isArrayOfKeyValuePairs(bpSettings.dependencies)) arrayDeleteIfKeyExist(bpSettings.dependencies, "module_name")
            else delete bpSettings.dependencies;
        }
        if (cmdLineSettingsJson.dependencies) {
            if (isArrayOfKeyValuePairs(cmdLineSettingsJson.dependencies)) arrayDeleteIfKeyExist(cmdLineSettingsJson.dependencies, "module_name")
            else delete bpSettings.dependencies;
        }
        delete cmdLineSettingsJson.module_names
        delete bpSettings.module_names
    }
    //---------
    // Moves from Config to BP
    //---------
    if (cmdLineSettingsJson.module_names) {
        if (bpSettings.module_names) console.warn("xx> config.module_names ignored in lieu of bp.module_names")
        else bpSettings.module_names = cmdLineSettingsJson.module_names
        delete cmdLineSettingsJson.module_names
    }

    if (cmdLineSettingsJson.dependencies) {
        if (bpSettings.dependencies) console.warn("xx> config.dependencies ignored in lieu of bp.dependencies")
        else bpSettings.dependencies = cmdLineSettingsJson.dependencies
        delete cmdLineSettingsJson.dependencies;
    }

    if (bpSettings.module_names) {
        if (is.string(bpSettings.module_names)) {
            if (bpSettings.module_names === 'all') bpSettings.module_names = validScriptModules.map(obj => obj.module_name);
            else if (bpSettings.module_names === 'default') bpSettings.module_names = "server,server-ui";
            else
                bpSettings.module_names = deDupeStringToArray(bpSettings.module_names)
        }
        else if (isArrayOfStrings(bpSettings.module_names)) bpSettings.module_names = deDupeNonObjectArray(bpSettings.module_names)
        else {
            const allowedTypes = ["String of module names", "Array of module names"]
            consoleColor.warn("xx> Invalid Type: BP.module_names:")
            consoleColor.table("List of allowed types", allowedTypes)
            consoleColor.table("Module Names", validScriptModules, ["module_name"])
            delete bpSettings.module_names
        }

        if (bpSettings.module_names) {
            if (!bpSettings.dependencies) {
                debug.log("==> moved bp.module_names to bp.dependencies as array of strings")
                bpSettings.dependencies = bpSettings.module_names
                delete bpSettings.module_names
            }
        }
    }

    if (bpSettings.dependencies) {
        if (is.string(bpSettings.dependencies)) bpSettings.dependencies = deDupeStringToArray(bpSettings.dependencies)
        else if (isArrayOfStrings(bpSettings.dependencies)) bpSettings.dependencies = deDupeNonObjectArray(bpSettings.dependencies)
        else if (is.notArray(bpSettings.dependencies)) bpSettings.dependencies = [bpSettings.dependencies]
        let isValid = false
        if (isArrayOfStrings(bpSettings.dependencies)) {
            if (bpSettings.module_names) {
                //if this exists, it is also an array of strings, so concat npw
                bpSettings.dependencies = deDupeNonObjectArray(bpSettings.dependencies.concat(bpSettings.module_names))
                delete bpSettings.module_names
            }

            const modArray = bpSettings.dependencies.slice();
            bpSettings.dependencies = [];
            for (let ptr in modArray) {
                let mod = moduleNameFix(modArray[ptr])
                if (mod.length) bpSettings.dependencies.push({ module_name: mod, version: "stable" })
                else consoleColor.warn("xx> Invalid BP dependency module name:", modArray[ptr], ": ignoring")
            }
            if (bpSettings.dependencies.length) isValid = true
        }
        else if (isArrayOfObjects(bpSettings.dependencies)) {
            if (bpSettings.module_names) {
                //if this exists, it is an array of strings, so map as object
                for (let ptr in bpSettings.module_names) {
                    let mod = moduleNameFix(bpSettings.module_names[ptr])
                    if (mod.length) bpSettings.dependencies.unshift({ module_name: mod, version: "stable" })
                    else consoleColor.warn("xx> Invalid BP dependency module name:", bpSettings.module_names[ptr], ": ignoring")
                }
                delete bpSettings.module_names;
            }
            for (let mod of bpSettings.dependencies.filter(obj => obj.module_name)) {
                const fixed = moduleNameFix(mod.module_name);

                if (fixed.length) {
                    mod.module_name = fixed;
                    if (!mod.version) mod.version = "stable";
                }
                else {
                    consoleColor.warn("xx> Invalid BP dependency module name:", mod.module_name, ": ignoring")
                    mod.delete = true;
                    mod.module_name = "";
                }
            }
        }
        if (!isValid) {
            consoleColor.warn("xx> No valid dependency module_names found");
            consoleColor.table("Valid Module Names", validScriptModules, ["module_name"]);
            delete bpSettings.dependencies;
        }
    }
    //NOte: Should be NO bp.module_names when this function is done.... everything should be in BP.dependencies
    debugMax.mute("<== verifyConfigScripting_Dependencies()");
}
//=======================================================================
function configureScriptingDependencies() {
    debug.log("==> configureScriptingDependencies()");

    const bpSettings = cmdLineSettingsJson.BP;
    if (!bpSettings.isScriptingFiles) return
    if(!bpSettings.dependencies) bpSettings.dependencies = []
    //Build list
    // @ts-ignore
    const userUuidObjs = bpSettings.dependencies.filter(obj => Object.hasOwn(obj, "UUID"))
    // @ts-ignore
    const userModule_nameObjs = bpSettings.dependencies.filter(obj => Object.hasOwn(obj, "module_name"))
    if (userModule_nameObjs.length) arrayKeyValueArrayMerge(userModule_nameObjs, "module_name", bpSettings.jsModList, debug.debugOn)
    const userModule_nameList = userModule_nameObjs.map(obj => obj.module_name)
    const allowedModObjs = []
    bpSettings.jsModList.forEach(v => {
        if (!userModule_nameList.includes(v)) allowedModObjs.push({ module_name: v, version: "stable" })
    })

    bpSettings.dependencies = []
    userUuidObjs.forEach(obj => bpSettings.dependencies.push(obj))
    userModule_nameObjs.forEach(obj => bpSettings.dependencies.push(obj))
    allowedModObjs.forEach(obj => bpSettings.dependencies.push(obj))

    debug.table("Debug: Final BP Dependency List",bpSettings.dependencies)
    debugMax.mute("<== configureScriptingDependencies()");
}
//=======================================================================
function jsonParseRemovingComments(text) {
    debugMax.color("functionStart", "==> jsonParseRemovingComments()")
    //text is a string, not JSON.. which obviously does not need this function
    let dataString = text;

    //1) Remove all /* */    
    while (dataString.indexOf("/*") >= 0) {

        let ptrStart = dataString.indexOf("/*");
        let front = ptrStart <= 0 ? "" : dataString.substring(0, ptrStart - 1);

        let back = dataString.substring(ptrStart + 2);
        let ptrEnd = back.indexOf("*/");

        if (ptrEnd == -1)
            dataString = front;
        else {
            back = back.substring(ptrEnd + 2);
            dataString = front + back;
        }
    }
    // remove //->end of line  ??  char(10 and 13)  ?? or just one or either

    let dataJson;
    let more;
    do {
        more = false;
        try {
            dataJson = JSON.parse(dataString);;
        } catch (err) {
            more = true;
            //debugMax.error("err.name: "+err.name,err.message)
            let errTrapArray = [
                "Expected double-quoted property name in JSON at position ",
                "Expected property name or '}' in JSON at position "
            ]
            let errTrap = "xxxxx";
            for (let i = 0; i < errTrapArray.length; i++) {
                if (err.message.startsWith(errTrapArray[i])) {
                    errTrap = errTrapArray[i]
                    break
                };
            }

            if (err.message.startsWith(errTrap)) {
                let ptr = parseInt(err.message.substring(errTrap.length))

                let front = dataString.substring(0, ptr - 1)
                let back = dataString.substring(ptr)
                let ptrEOL = back.indexOf("\n");

                if (ptrEOL >= 0) {
                    back = back.substring(ptrEOL + 1);
                    dataString = front + back;
                }
                else {
                    dataString = front;
                }
            }
            else {
                Debug.error("JSON Parse Error Not Configured");
                Debug.error(err.message);
                console.log(dataString)
                debugMax.error("<xx jsonParseRemovingComments()")
                return null;
            }
        }
    }
    while (more);

    debugMax.mute("<== jsonParseRemovingComments()")
    return dataJson
}
//=======================================================================
function getConfigFileAuthor() {
    debug.log("==> getConfigFileAuthor()")
    /*
        Known, this filter is either under 
            ./.regolith or
            ./filters
        of the mail project folder
    */
    let path_1 = "\\.regolith\\cache\\filters\\"
    let path_2 = "\\filters\\"
    let ptr = (argPath.lastIndexOf(path_1) > 0 ? argPath.lastIndexOf(path_1) : argPath.lastIndexOf(path_2)) + 1;

    if (!ptr) {
        Debug.warn("Error: Cannot find path to config.sys to get author, skipping");
        debugMax.error("x getConfigFileAuthor()")
        return null;
    }

    let configPathFilename = argPath.substring(0, ptr) + "config.json";
    let configData;
    try {
        const data = fs.readFileSync(configPathFilename, 'utf8');
        configData = data;
    } catch (err) {
        Debug.warn("Error: Cannot read config.sys to get author, skipping");
        debugMax.warn("x getConfigFileAuthor()")
        return null;
    }

    if (!configData.search("\"author\"")) {
        Debug.warn("Error: Cannot find word author in config.sys to get author, skipping");
        debugMax.warn("x getConfigFileAuthor()")
        return null;
    }

    let configJson
    //configData = deleteComments(configData) Do not use... prob with // in $schema withing " "
    configJson = jsonParseRemovingComments(configData)
    if (!configJson) {
        Debug.warn("Error: Cannot parse config.sys to get author, skipping");
        debugMax.warn("x getConfigFileAuthor()")
        return null;
    }

    Debug.success("==> found author: " + configJson.author)
    debugMax.mute("<== getConfigFileAuthor()")

    return configJson.author;
}
//=======================================================================
function masterConfigSettingsCheck() {
    debug.color("functionStart", "* masterConfigSettingsCheck()")

    cmdLineSettingsJson.moduleFetchList = []
    for (let type of ["BP", "RP"]) {
        let LC = type.toLowerCase();
        if (has.key(cmdLineSettingsJson, LC) && !has.key(cmdLineSettingsJson, type)) {
            cmdLineSettingsJson[type] = cmdLineSettingsJson[LC];
            delete cmdLineSettingsJson[LC];
        }
        if (!(type in cmdLineSettingsJson) ||
            is.notObject(cmdLineSettingsJson[type]) ||
            is.array(cmdLineSettingsJson[type])) {
            cmdLineSettingsJson[type] = {}
        };
        cmdLineSettingsJson[type].type = type;
    }
    //------------------------------------------------------------------------------------------
    cmdLineSettingsJson.author = cmdLineSettingsJson.author || getConfigFileAuthor() || "Add Author Name Here";
    //------------------------------------------------------------------------------------------
    //----------------------------------------
    //Determine if BP and RP Exist
    //----------------------------------------
    cmdLineSettingsJson.bp_only = !!cmdLineSettingsJson.bp_only;
    cmdLineSettingsJson.rp_only = !!cmdLineSettingsJson.rp_only;

    if (cmdLineSettingsJson.rp_only && cmdLineSettingsJson.bp_only) {
        cmdLineSettingsJson.bp_only = false;
        cmdLineSettingsJson.rp_only = false;
    }

    //isLive...PackFolder also gets fills bp/rpFiles arrays
    cmdLineSettingsJson.rp_only = cmdLineSettingsJson.rp_only || !isLiveBehaviorPackFolder();
    cmdLineSettingsJson.bp_only = cmdLineSettingsJson.bp_only || !(isLiveResourcePackFolder());

    //per No files
    if (cmdLineSettingsJson.rp_only && cmdLineSettingsJson.bp_only)
        throw new Error("No Valid Folders BP/RP - Check rp_only/bp_only in config & if Folders have Files/subFolders");

    //----------------------------------------
    //Determine BP and RP Pack Dependency
    //----------------------------------------
    cmdLineSettingsJson.packDependencies = !cmdLineSettingsJson.noPackDependencies //This is for Auto only...user can manipulate    
    if (cmdLineSettingsJson.bp_only) {
        console.log("==> BP manifest only")
        cmdLineSettingsJson.RP = {}
        cmdLineSettingsJson.packDependencies = false;
    }
    if (cmdLineSettingsJson.rp_only) {
        console.log("==> RP manifest only")
        cmdLineSettingsJson.BP = {};
        cmdLineSettingsJson.packDependencies = false;
        delete cmdLineSettingsJson.dependencies; //because should only be scripting modules anyway
        delete cmdLineSettingsJson.module_names
    }
    else debugMax.log("==> Both BP / RP")

    //Reasons to cancel/deny
    if (cmdLineSettingsJson.packDependencies) verifyConfigPackDependencies();
    console.log("==> Pack Dependencies:", cmdLineSettingsJson.packDependencies ? "Verified" : "None")

    const bpSettings = cmdLineSettingsJson.BP
    const rpSettings = cmdLineSettingsJson.RP
    //----------------------------------------
    // BP and RP User Dependencies
    //----------------------------------------
    if (cmdLineSettingsJson.dependencies) {
        delete cmdLineSettingsJson.dependencies
        consoleColor.color("possibleWarn","xx> Ignoring dependencies.  Use BP/RP.dependencies instead")
    }

    if (rpSettings.dependencies) {
        if (is.notObject(rpSettings.dependencies)) delete rpSettings.dependencies
        else if (!isArrayOfObjects(rpSettings.dependencies)) rpSettings.dependencies = [rpSettings.dependencies]

        arrayDeleteObjectIfKeyNotOnList(rpSettings.dependencies, ["UUID"])
    }
    if (bpSettings.dependencies) {

        if (is.notObject(bpSettings.dependencies)) delete bpSettings.dependencies
        else if (!isArrayOfObjects(bpSettings.dependencies)) bpSettings.dependencies = [bpSettings.dependencies]

        arrayDeleteObjectIfKeyNotOnList(bpSettings.dependencies, ["UUID", "module_name"])
    }
    //----------------------------------------
    // Scripting Configure
    //----------------------------------------
    rpSettings.isScriptingFiles = false;
    if (bpSettings.isScriptingFiles) configureScriptingDependencies();

    debugMax.mute("<== masterConfigSettingsCheck()")
} //end of masterConfigSettingsCheck
//=======================================================================
function manifestHeaders_set(pSettings) {
    debug.color("functionStart", "==> manifestHeaders_set(" + pSettings.type + ")")

    const d = new Date();
    const DateTime = [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()].join('.');
    const defaultHeader = {
        name: pSettings.name || cmdLineSettingsJson.name + " " + pSettings.type || "My UnNamed Pack " + pSettings.type,
        description: (
            pSettings.description ||
            cmdLineSettingsJson.description + " " + pSettings.type ||
            "<" + pSettings.type + " pack description here>")
            + "\nBuild Date: " + DateTime,
        uuid: pSettings.header_uuid || pSettings.uuid || "new",
        version: pSettings.version || cmdLineSettingsJson.version || [d.getFullYear() - 2000, d.getMonth() + 1, d.getDate()],
        min_engine_version: pSettings.min_engine_version || cmdLineSettingsJson.min_engine_version || "latest"
    }
    const configHeader = {} || pSettings.header
    pSettings.header = objectsMerge(configHeader, defaultHeader);

    if (["get", "new"].includes(pSettings.header.uuid)) {
        pSettings.header.uuid = newUUID()
        console.log("==> New", pSettings.type, "Header UUID", pSettings.header.uuid)
    }
    if (!cmdLineSettingsJson.moduleFetchList.length)
        if (is.string(pSettings.header.min_engine_version)) {
            debug.log("==> Creating default moduleFetchList for min_engine_version")
            cmdLineSettingsJson.moduleFetchList.push("@minecraft/server")
        }

    debug.color("gray-bg", "Debug:", pSettings.type, "Header")
    debug.log(pSettings.header)
    debugMax.mute("<== manifestHeaders_set()")
}
//=======================================================================
function manifestPackModule_set(pSettings) {
    debug.color("functionStart", "==> manifestPackModule_set(" + pSettings.type + ")")
    //data/resources module only
    const defaultModule = {
        type: pSettings.type == "BP" ? "data" : "resources",
        description: pSettings.type + " Pack",
        uuid: pSettings.uuid || "new",
        version: [1, 0, 0]
    }

    // Modules defined by user
    let configModule = {};
    pSettings.userModules = [];
    let typesAllowed = pSettings.type === "BP" ? ["data", "script"] : ["resources"];

    if (is.object(pSettings.modules)) {
        let array

        if (Array.isArray(pSettings.modules)) {
            // TODO:flat map it?  just in case  - but how much tom-foolery do I allow
            array = pSettings.modules.filter(obj => typeof obj == "object" && !Array.isArray(obj));
        }
        else array = [pSettings.modules];

        pSettings.userModules = array.filter(obj => typesAllowed.includes(obj.type))
    }

    if (is.object(cmdLineSettingsJson.modules)) {
        let array

        if (Array.isArray(cmdLineSettingsJson.modules)) {
            // TODO:flat map it?  just in case  - but how much tom-foolery do I allow
            array = cmdLineSettingsJson.modules.filter(obj => typeof obj == "object" && !Array.isArray(obj));
        }
        else array = [cmdLineSettingsJson.modules];

        array.filter(obj => typesAllowed.includes(obj.type)).forEach(obj => pSettings.userModules.push(obj))
    }

    if (pSettings.userModules.length > 0) {
        const found = pSettings.userModules.find((obj) => obj.type === defaultModule.type);
        if (found) configModule = Object.assign({}, found);
    }

    //FIXME: what if no data, just scripts ??  Alter for that later - check for json files/folders
    //same for RP - what if no resource folders?

    pSettings.module_pack = objectsMerge(configModule, defaultModule);

    if (["get", "new"].includes(pSettings.module_pack.uuid)) {
        pSettings.module_pack.uuid = newUUID()
        console.log("==>", "New", pSettings.type, defaultModule.type, "module UUID", pSettings.module_pack.uuid)
    }
    debug.color("gray-bg", "Debug:", pSettings.type, "Modules")
    debug.log(pSettings.module_pack)
    debugMax.mute("<== manifestPackModule_set()")
}
//=======================================================================
function manifestScriptModule_set(bpSettings) {
    debug.color("functionStart", "==> manifestScriptModule_set(" + bpSettings.type + ")")

    if (bpSettings.isScriptingFiles) {
        let configScriptModule = {}
        const found = bpSettings.userModules.find((obj) => obj.type === "script");
        if (found) configScriptModule = Object.assign({}, found);

        let defaultScriptModule = {
            description: "BP Scripting API Module",
            type: "script",
            language: "javascript",
            uuid: bpSettings.module_uuid || "get",
            version: [1, 0, 0],
            entry: isFile("BP/scripts/index.js") ? "scripts/index.js" : isFile("BP/scripts/main.js") ? "scripts/main.js" : "Name/Path of your entry Script File Here"
        }

        bpSettings.module_script = objectsMerge(configScriptModule, defaultScriptModule);

        if (["get", "new"].includes(bpSettings.module_script.uuid)) {
            bpSettings.module_script.uuid = newUUID()
            console.log("==>", "New", bpSettings.type, "script UUID", bpSettings.module_script.uuid)
        }
    }
    debug.color("gray-bg", "Debug: BP Script Module")
    debug.log(bpSettings.module_script)
    debugMax.mute("<== manifestScriptModule_set()")
}
//=======================================================================
function fetchListBuild(bpSettings) {
    debug.color("functionStart", "==> fetchListBuild()")

    //re-grab all modules from dependencies into module_names
    const fetchList = ["@minecraft/server"]

    if (bpSettings.dependencies) {
        debug.log("==> Getting Module Names from Dependencies Object")
        bpSettings.dependencies
            .filter(mod => mod.module_name)
            .forEach(mod => { if (!fetchList.includes(mod.module_name)) fetchList.push(mod.module_name) });
    }

    if (is.array(bpSettings.jsModList)) {
        debug.log("==> Getting Module Names from jsModList Array")
        bpSettings.jsModList.forEach(v => { if (!fetchList.includes(v)) fetchList.push(v) })
    }

    fetchList.sort().reverse()
    cmdLineSettingsJson.moduleFetchList = [...new Set(fetchList)]
    debug.table("==> Module Fetch List (Final)", fetchList)

    debugMax.mute("<== fetchListBuild()")
} //end of fetchListBuild
//=======================================================================
function manifestParts_control(pSettings) {
    manifestHeaders_set(pSettings);
    manifestPackModule_set(pSettings);

    if (pSettings.isScriptingFiles) {
        manifestScriptModule_set(pSettings);
        fetchListBuild(pSettings)
    }
}//end of manifestParts_control
//=======================================================================
function manifestBuild(pSettings) {
    debug.color("functionStart", "* buildManifest(" + pSettings.type + ")")

    const manifest = {
        format_version: 2,
        header: pSettings.header,
        modules: [pSettings.module_pack]
    }
    if (pSettings.module_scripting) manifest.modules.push(pSettings.module_scripting)
    if (pSettings.dependencies.length) manifest.dependencies = pSettings.dependencies

    manifest.metadata = {
        "authors": [pSettings.author || cmdLineSettingsJson.author],
        "generated_with": {
            "regolith_filter_mani_fest": ["24.6.4"]
        }
    }

    fs.writeFileSync(pSettings.type + "/manifest.json", JSON.stringify(manifest, null, 4));
    Debug.success("==> " + pSettings.type + " manifest.json exported")
    debug.mute("<== buildManifest()")
} //end of buildManifest
//=======================================================================
function main() {
    debug.color("functionStart", "* main()")

    masterConfigSettingsCheck();

    const bpSettings = cmdLineSettingsJson.BP;
    if (!cmdLineSettingsJson.rp_only) {
        bpSettings.ModuleType = "data";
        manifestParts_control(bpSettings);
        if (!bpSettings.dependencies) debug.color("red", "==> No bpSettings.dependencies yet!")
        else debug.log(bpSettings.dependencies)
    }

    const rpSettings = cmdLineSettingsJson.RP
    if (!cmdLineSettingsJson.bp_only) {
        rpSettings.ModuleType = "resources";
        manifestParts_control(rpSettings);
    }

    if (cmdLineSettingsJson.packDependencies) {
        //TODO: test adding own version for module dep if kept
        debug.log("==> Setting up Pack Dependencies")
        if (!is.object(bpSettings.dependencies)) {
            debug.log("==> Default bpSettings.dependencies created")
            bpSettings.dependencies = [];
        }
        if (!is.object(rpSettings.dependencies)) {
            debug.log("==> Default rpSettings.dependencies created")
            rpSettings.dependencies = [];
        }
        bpSettings.dependencies.splice(0, 0, { "uuid": rpSettings.header.uuid, "version": rpSettings.header.version });
        rpSettings.dependencies.splice(0, 0, { "uuid": bpSettings.header.uuid, "version": bpSettings.header.version });
    }
    //return
    if (cmdLineSettingsJson.moduleFetchList.length) {
        consoleColor.color("yellow", "* Get Minecraft Data")
        const siteList = cmdLineSettingsJson.moduleFetchList.map(v => "https://registry.npmjs.org/" + v)
        myFetch = new McModuleFetchStack(siteList);

        myFetch.debugOn = debug.debugOn;
        if (debugMax.debugOn) {
            debug.highlight("Debug: List of Modules to Fetch")
            myFetch.consoleLogFetchList();
        }
        myFetch.fetchesStart();

        debugMax.color("magenta-bg", "<==> fake end of main() due to scripting module fetches")
    }
    else {
        if (!cmdLineSettingsJson.bp_only) manifestBuild(cmdLineSettingsJson.RP);
        if (!cmdLineSettingsJson.rp_only) manifestBuild(cmdLineSettingsJson.BP);

        if (debug.debugOn) debugExport();

        debug.success("<== main()");
    }
} //end of main
//=======================================================================
function fetchInfoApply() {
    debug.color("functionStart", "==> fetchInfoApply()")
    if (!debug.debugOn) consoleColor.color("yellow", "==> Apply Fetched Data")

    const bpSettings = cmdLineSettingsJson.BP;
    const rpSettings = cmdLineSettingsJson.RP;

    let keyWord = "stable"

    if (is.string(bpSettings.header.min_engine_version))
        bpSettings.header.min_engine_version = bpSettings.header.min_engine_version.replace("get", keyWord)

    if (is.string(rpSettings.header.min_engine_version))
        rpSettings.header.min_engine_version = rpSettings.header.min_engine_version.replace("get", keyWord)

    if (bpSettings.header.min_engine_version.startsWith(keyWord) || rpSettings.header.min_engine_version.startsWith(keyWord)) {
        const keys = cmdLineSettingsJson.engineGetList
        //[x,x,x]
        const engineList = keys.map(v => v.split(".").map(v => Number(v)))

        const settingsList = [bpSettings.header, rpSettings.header].filter(hdr => hdr.min_engine_version.startsWith(keyWord))
        for (let header of settingsList) {
            let versionsBack = 0

            if (header.min_engine_version.startsWith(keyWord + "-")) {
                versionsBack = header.min_engine_version.replace(keyWord + "-", "")
                if (!isNaN(versionsBack)) {
                    versionsBack = Number(versionsBack)
                }
                else {
                    versionsBack = 0
                    consoleColor.warn("Invalid get-# for stable version", "using latest instead", header.name, header.min_engine_version)
                }

                if (versionsBack >= engineList.length) {
                    versionsBack = engineList.length - 1
                    consoleColor.warn("get-# exceeds number of stable versions", "Using last instead", header.name, header.min_engine_version)
                }
            }
            header.min_engine_version = engineList[versionsBack]
            consoleColor.success("==>", header.name, "min_engine_version =", header.min_engine_version)
        }
    }

    const moduleList = myFetch.promiseStack
        .filter(obj => obj.success)
        .map(obj => { return { site: obj.site, stable: obj.versions.stable } })

        //for now just latest... TODO: beta, rc, not latest
    // @ts-ignore
    debug.table("Dependency Module List", moduleList)
    for (let needModVersion of bpSettings.dependencies.filter(obj => "module_name" in obj && ["get", "stable"].includes(obj.version))) {

        let found = moduleList.find(obj => obj.site.endsWith(needModVersion.module_name))
        if (found) {
            needModVersion.version = found.stable.module
            consoleColor.success("==>", needModVersion.module_name, " version:", needModVersion.version)
        }
        else consoleColor.error("xx> Matching Module-Version to Module-Name")
    }
    //TODO:  manifest.json by user can be used as instructions.... read in sections, so it is like a template in a way

    debug.mute("<== fetchInfoApply()")
} // end of fetchInfoApply
//=======================================================================
function mainAfterFetch() {
    debug.color("functionStart", "* mainAfterFetch()")

    //myFetch.consoleLogPromiseList();
    //myFetch.consoleLogPromiseKeys();

    for (let obj of myFetch.promiseStack) {
        consoleColor.log("==> Processing Data for " + obj.site);
        let distTags = obj.data['dist-tags']
        obj.versions = {
            stable: {
                module: distTags.latest
            },
            beta: {
                module: "beta" in distTags ? distTags.beta.split("-beta.")[0] + '-beta' : false,
                engine: "beta" in distTags ? distTags.beta.split("-beta.")[1] : false
            },
            rc: {
                module: "rc" in distTags ? distTags.rc.split("-")[0] + '-rc' : false,
                engine: "rc" in distTags ? distTags.rc.split("-rc.")[1] : false
            },
            time: Object.keys(obj.data.time).reverse()
        }

        const engines = Object.keys(obj.data.versions)
            .filter(v => v.endsWith('-stable'))
            .map(v => v.split("-beta.")[1].replace('-stable', ''))
            .sort()
            .reverse()

        if (!cmdLineSettingsJson.engineGetList)
            if (engines.length)
                cmdLineSettingsJson.engineGetList = engines;

    }
    debug.table("==> min_engine_versions", cmdLineSettingsJson.engineGetList);

    for (let obj of myFetch.promiseStack) obj.versions.stable.engine = cmdLineSettingsJson.engineGetList[0];

    fetchInfoApply();

    if (!cmdLineSettingsJson.bp_only) manifestBuild(cmdLineSettingsJson.RP);
    if (!cmdLineSettingsJson.rp_only) manifestBuild(cmdLineSettingsJson.BP);

    if (debug.debugOn) debugExport();

    debugMax.mute("<== mainAfterFetch()")
    const d = new Date()
    consoleColor.success("Time Ended: ", d.toLocaleString('en-US', { timeZoneName: 'short' }))
} // End of mainAfterFetch()
//=======================================================================
function debugExport() {
    if (!cmdLineSettingsJson.rp_only) fs.writeFileSync("BP/debug.bpSettings.json", JSON.stringify(cmdLineSettingsJson.BP));
    if (!cmdLineSettingsJson.bp_only) fs.writeFileSync("RP/debug.rpSettings.json", JSON.stringify(cmdLineSettingsJson.RP));

    if (cmdLineSettingsJson.bp_only || !cmdLineSettingsJson.rp_only) fs.writeFileSync("BP/debug.ConfigSettings.json", JSON.stringify(cmdLineSettingsJson));
    else
        if (cmdLineSettingsJson.rp_only) fs.writeFileSync("RP/debug.ConfigSettings.json", JSON.stringify(cmdLineSettingsJson));

    Debug.success("* Debug Files Exported");
}
//============================================================================
main();
//============================================================================
//Go Home, the show is over