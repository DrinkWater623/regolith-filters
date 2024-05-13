// @ts-check
//WORK IN PROGRESS to Add Multiple servers and scrape for version numbers
let isDebug = false
//VS Code Colors
const fg_Reset = '\x1b[0m'
const fg_Error = '\x1b[91m%s'
const fg_ErrorNext = fg_Error+fg_Reset
const fg_Warning = '\x1b[31m%s'
const fg_WarningNext = fg_Warning+fg_Reset
const fg_Success = '\x1b[32m%s'
const fg_SuccessNext = fg_Success+fg_Reset
const fg_General = '\x1b[36m%s'
const fg_GeneralNext = fg_General+fg_Reset
const fg_Debug = '\x1b[95m%s'
const fg_DebugNext = fg_Debug+fg_Reset
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

To Do:
    () multi-ser server in settings, take in as array and get versions for each    
    () Make code efficient - Nikki style 
    () Make is so I can have a dev and rel pack icon - prob can use the data section to hold and use by name or settings has filename
    () maybe grab the project and author from config for Meta Data
*/
//=====================================================================
const fs = require("fs");
const myUUID = require("crypto");
var argPath = process.argv[1];
var argSettings = process.argv[2];
const cmdLineSettingsJson = JSON.parse(argSettings);
var minecraftScrapeData;
var scrapeServer;
var configFile;
//var latestStableScriptingVersion

main();

//=======================================================================
function newUUID() { return myUUID.randomUUID() }
//=======================================================================
function isEmptyFolder(path){
    
    if(!fs.existsSync(path)) return true;
    if(!fs.lstatSync(path).isDirectory()) return true;
    
    let fileCount = fs.readdirSync(path).length;
    //if (isDebug) console.log('\x1b[93m%s\x1b[0m',"..Debug..","isEmptyFolder(",path,") => File Count:",fileCount)

    return fileCount == 0 ? true : false;
}
function containFilesWithExt(path,ext){
    if(isEmptyFolder(path)) return false;
    return fs.readdirSync(path).filter(f => f.endsWith("."+ext)).length > 0 ? true : false; 
}
//=======================================================================
function masterDefaultSettings(){
    if(isDebug) console.log(fg_Debug,"* Master Default Settings",fg_Reset)    

    //conform - later add FORCE
    cmdLineSettingsJson.bp_only = false || cmdLineSettingsJson.bp_only
    cmdLineSettingsJson.rp_only = false || cmdLineSettingsJson.rp_only
    
    //per User
    if (cmdLineSettingsJson.rp_only && cmdLineSettingsJson.bp_only) {            
        cmdLineSettingsJson.bp_only = false;
        cmdLineSettingsJson.rp_only = false;
    }
    //Change based on conditions
    //Other exists    

    //This may fail if folder does not exist - test and see ts-compiler for upgraded functions
    cmdLineSettingsJson.rp_only = cmdLineSettingsJson.rp_only || isEmptyFolder("BP")
    cmdLineSettingsJson.bp_only = cmdLineSettingsJson.bp_only || isEmptyFolder("RP")    

    //per No files
    if (cmdLineSettingsJson.rp_only && cmdLineSettingsJson.bp_only)
        throw new Error("No Valid Folders BP/RP - Check rp_only/bp_only in config & if Folders have Files/subFolders");
        
    if(cmdLineSettingsJson.bp_only){
        console.log("==> BP manifest only")
        cmdLineSettingsJson.dependencies = false ;
        if("RP" in cmdLineSettingsJson) delete cmdLineSettingsJson.RP
    }
    if(cmdLineSettingsJson.rp_only){
        console.log("==> RP manifest only")
        cmdLineSettingsJson.dependencies = false ;
        cmdLineSettingsJson.scripting = false;
        if("BP" in cmdLineSettingsJson) delete cmdLineSettingsJson.BP
    }
    //user can set to true/false, otherwise assume true if both
    if(!("dependencies" in cmdLineSettingsJson)) cmdLineSettingsJson.dependencies = true;
    //Reasons to cancel/deny
    if(cmdLineSettingsJson.dependencies){
        //later go get the UUID from those manifest... 
        cmdLineSettingsJson.dependencies = !fs.existsSync("BP/manifest.json")
        cmdLineSettingsJson.dependencies = cmdLineSettingsJson.dependencies && !fs.existsSync("RP/manifest.json")        
        if(!cmdLineSettingsJson.dependencies) console.log("==> Cannot do dependencies if you make your own manifest.json!")
    }
    console.log("==> Dependencies:",cmdLineSettingsJson.dependencies ? "Verified" : "None")
    
    //------------------------------------------------------------------------------------------
    //default to true since it will not override user provided UUIDs, user must specify false to exclude
    cmdLineSettingsJson.getUUIDs =  !!cmdLineSettingsJson.getUUIDs
    //------------------------------------------------------------------------------------------
    if (!("BP" in cmdLineSettingsJson)) { cmdLineSettingsJson.BP = {} };
    if (!("RP" in cmdLineSettingsJson)) { cmdLineSettingsJson.RP = {} }; 
    cmdLineSettingsJson.BP.type = "BP"
    cmdLineSettingsJson.RP.type = "RP"
    //------------------------------------------------------------------------------------------
    // User wants me to be detective    
    if (!("scripting" in cmdLineSettingsJson)) cmdLineSettingsJson.scripting = fs.existsSync("BP/scripts")
     //reasons to deny
    if (cmdLineSettingsJson.scripting){                    
        cmdLineSettingsJson.scripting = containFilesWithExt("BP/scripts","js");
        if(!cmdLineSettingsJson.scripting) console.log("==> No JS Files - Scripting Module is Denied!")  
    }

    console.log("==> Scripting:",cmdLineSettingsJson.scripting ? "Verified" : "None")
    cmdLineSettingsJson.BP.scripting = cmdLineSettingsJson.scripting;
    cmdLineSettingsJson.RP.scripting = false;

    cmdLineSettingsJson.author = cmdLineSettingsJson.author || getConfigFileAuthor() || "Add Author Name Here";        
}
//================================================================================================
function ApplyDefaultSettings(pSettings) {
    if(isDebug) console.log(fg_Debug,"* ApplyDefaultSettings(",pSettings.type,")",fg_Reset)    
    let p = pSettings.type;
    const d = new Date();
    //@ts-ignore
    const dayOfYear = date => Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const julianBuildDateTime = d.getFullYear().toString() + '.' + dayOfYear(d).toString().padStart(3, "0") + '.' + d.getHours().toString().padStart(2, "0") + '.' + d.getMinutes().toString().padStart(2, "0");

    pSettings.name = pSettings.name || cmdLineSettingsJson.name + " " + p || "My UnNamed Pack " + p
    pSettings.description = pSettings.description || cmdLineSettingsJson.description + " " + p || "This " + p + " pack does amazing things"
    pSettings.description = pSettings.description + "\nBuild Date: " + julianBuildDateTime
    pSettings.version = pSettings.version || cmdLineSettingsJson.version ||  [d.getFullYear() - 2000, d.getMonth() + 1, d.getDate()]
    pSettings.min_engine_version = pSettings.min_engine_version || cmdLineSettingsJson.min_engine_version || "get"
    pSettings.UUID = pSettings.UUID || cmdLineSettingsJson.getUUIDs ? "get" : "<Insert " + p + " UUID Here>"
    pSettings.module = pSettings.UUID || cmdLineSettingsJson.getUUIDs ? "get" : "<Insert " + p + " module UUID Here>"

    //Now every setting needed should exist
    //Update UUIDs - since user can use "get" have to do it here
    if (pSettings.UUID == "get") { 
        console.log("==>",pSettings.type,"New UUID")
        pSettings.UUID = newUUID() 
    }
    if (pSettings.module == "get") { 
        console.log("==>",pSettings.type,"New Module UUID")
        pSettings.module = newUUID() 
    }
    
    //only a BP can have this be true
    if (pSettings.scripting){        

        let mcPrefix = "@minecraft/"

        let list = {
            script_uuid:"get",
            script_entry:"scripts/main.js",  //need to check for alt names
            scripting_module_name:mcPrefix + "server", //may need to have more than one of these (server/version key/pair)
            scripting_version:"get"
        }
        /*
            need it to look like this and be able to handle all of these scenarios
            1) string
                "@minecraft/server"
            3) object
                {
                    module:@minecraft/server,
                    version : "get"  or actual version
                }
            2) array of string
                ["@minecraft/server","@minecraft/server-uid",@minecraft/common]
            4) array of objects
            [
                {
                    module:@minecraft/server,
                    version : "get"  or actual version
                },
                {
                    module:@minecraft/server-ui,
                    version : "get"  or actual version
                }

            ]
            5) just an idea, but scrape scripts and look for which to get.
        */
        for (const property in list){
            // omitted
            if (!(property in pSettings)) pSettings[property] = list[property]

            //if empty, set default
            if(!pSettings[property]) pSettings[property] = list[property]
        }

        if (pSettings.script_uuid == "get") { 
            console.log("==>",pSettings.type,"New Script UUID")
            pSettings.script_uuid = newUUID() 
        }
        let serverList = ["server","server-ui"]
        //correct simple name
        if(serverList.includes(pSettings.scripting_module_name)) {
            pSettings.scripting_version_mod = pSettings.scripting_module_name
            pSettings.scripting_module_name = mcPrefix+pSettings.scripting_module_name
        }
        else
        if (pSettings.scripting_module_name.substring(0,11) !== mcPrefix)
            throw new Error('scripting_module_name should start with ' + mcPrefix);

        let mod = pSettings.scripting_module_name.substring(mcPrefix.length);
        pSettings.scripting_version_mod = mod;

        //can only retrieve non-beta versions for now - verify correct server
        //just confirm server types, it will be gotten later
        if(pSettings.scripting_version === "get"){          
            if(!serverList.includes(mod))
                throw new Error('module types server/server-ui only');
        }
    }
    //remove all references - just in case
    else {
        let list = ["script_entry","scripting_module_name","scripting_version","script_uuid"];    
        for(let v of list) if (v in pSettings) delete pSettings[v];
    }
} //end of ApplyDefaultSettings
//=============================================================================================
function buildManifest(pSettings) {
    if(isDebug) console.log(fg_Debug,"* buildManifest(",pSettings.type,")",fg_Reset)    
    let p = pSettings.type;
    const manifest = {
        "format_version": 2,
        "header": {
            "name": `${pSettings.name}`,
            "description": `${pSettings.description}`,
            "uuid": `${pSettings.UUID}`,
            "version": pSettings.version,
            "min_engine_version": pSettings.min_engine_version
        },
        "modules": [
            {
                "type": `${pSettings.ModuleType}`,
                //"description": "_",
                "uuid": `${pSettings.module}`,
                "version": [1, 0, 0]
            }
        ]
    }
    
    if (pSettings.scripting) {
        //@ts-ignore
        let addMod = {
            "type": "script",
            "language":"javascript",
            "uuid": `${pSettings.script_uuid}`, // note this should be one time, if using dynamic properties
            "version": [1, 0, 0],
            "entry": `${pSettings.script_entry}`,
        }
        manifest.modules.push(addMod);
        manifest.capabilities = ["script_eval"];
    }

    if ("depUUID" in pSettings) {
        manifest.dependencies = [{
            "uuid": `${pSettings.depUUID}`,
            "version": pSettings.depVersion
        }]
    }

    if ("scripting_module_name" in pSettings) {
        if (!(manifest.dependencies)) manifest.dependencies = [];  
        manifest.dependencies.push(
            {
                "module_name": `${pSettings.scripting_module_name}`,
                "version": `${pSettings.scripting_version}`
            }
        )
    }

    manifest.metadata = {
        "authors": [pSettings.author || cmdLineSettingsJson.author],
        "generated_with": {
            "regolith_filter_mani_fest": ["24.5.12"]
        }
    }

    fs.writeFileSync(p + "/manifest.json", JSON.stringify(manifest, null, 4));
    console.log(fg_Success,"==>",pSettings.type,"manifest.json exported",fg_Reset)

} //end of buildManifest
//=======================================================================
function manifests(fromFetch = false){    
    if (isDebug) console.log(fg_Debug,"* Start manifests( fromFetch = ",fromFetch,")",fg_Reset)    
    
    /**
     * This is the last main function called.
     * It is either called by main 
     *      or manifestRedirect (because there was an async fetch needed) 
     **/    

    if (!cmdLineSettingsJson.bp_only) buildManifest(cmdLineSettingsJson.RP);    
    if (!cmdLineSettingsJson.rp_only) buildManifest(cmdLineSettingsJson.BP);    

    if(fromFetch) mainEnd() // because of possible async fetch.then

    if (isDebug) console.log(fg_Debug,"x manifests()",fg_Reset)   
}
//=======================================================================
function manifestRedirect(){
    if (isDebug) console.log(fg_Debug,"* Start manifestRedirect()",fg_Reset)    

    const bpSettings = cmdLineSettingsJson.BP;
    const rpSettings = cmdLineSettingsJson.RP;

    if (bpSettings.min_engine_version.startsWith("get") || rpSettings.min_engine_version.startsWith("get")) {

        const versions = minecraftScrapeData.versions        
        const keys = []

        for (let key in versions) {
            if(key.endsWith("stable")) {
                keys.push(key.substring(key.indexOf("beta")+5));                        
            }
        }
        //[x,x,x]
        const orderedKeys = keys.map(v => v.substring(0,v.length-7)).reverse()        

        const settingsList = [bpSettings,rpSettings].filter(json => json.min_engine_version.startsWith("get"))
        for(let json of settingsList) {
            let verNum = 0
            
            if (json.min_engine_version.startsWith("get-")) {
                verNum = json.min_engine_version.replace("get-","")
                if(!isNaN(verNum)){
                    verNum = Number(verNum)
                }
                else {
                    verNum = 0                    
                    console.log(fg_Warning,"xx> Invalid get-# for stable version, using latest instead",json.type,json.min_engine_version.substring(0,4),fg_Reset)
                }
                
                if (verNum >= orderedKeys.length){
                    verNum = orderedKeys.length - 1
                    console.log(fg_Warning,"xx> get-# exceeds number of stable versions, using last instead",json.type,json.min_engine_version,fg_Reset)
                }
            }
            
            let versionSelected = orderedKeys[verNum].split(".").map(v => Number(v))            
            //console.log(versionSelected)
            json.min_engine_version = versionSelected

            console.log("==>",json.type,"min_engine_version =",json.min_engine_version)
        }        
    }

    if(bpSettings.scripting && bpSettings.scripting_version.startsWith("get")){
        let latest = minecraftScrapeData["dist-tags"].latest
        
        if(bpSettings.scripting_version.startsWith("get-")) {            
            let verNum = bpSettings.scripting_version.replace("get-","");
            let ErrMsg = "";
            //console.log(verNum,Number.isInteger(Number(verNum)),Number.isInteger(1))
            if(!isNaN(verNum)){   
                if(Number.isInteger(verNum)){                    
                    verNum = Number(verNum);  
                    if(verNum > 0) {

                        const array = latest.split(".").map(v => Number(v));
                        let middleNum = array[1] -  verNum;
        
                        if(middleNum >= 1 || middleNum <= array[1]){
                            array[1] = middleNum
                            latest = array.reduce((t,v) => t+"."+v) 
                        }
                        else ErrMsg = "Invalid get-# is out of range for scripting version (between 1 and latest), using latest instead"  
                    }
                    //else zero - do nothing
                }
                else ErrMsg = "Invalid get-# for scripting version (! int), using latest instead";
            }
            else ErrMsg = "Invalid get-# for scripting version (NaN), using latest instead";
            

            if(ErrMsg.length > 0)
                console.log(fg_Warning,"xx>",ErrMsg,bpSettings.type,bpSettings.scripting_version,fg_Reset)
        }

        bpSettings.scripting_version = latest;

        // add later, if get-#, to subtract from the middle #.#.#

        console.log("==>",bpSettings.type,"scripting",bpSettings.scripting_version_mod,"version =",bpSettings.scripting_version);
    }

    manifests(true);

    if (isDebug) console.log(fg_Debug,"x manifestRedirect()",fg_Reset)  
}
//=======================================================================
function minecraft_scrape(){
    if (isDebug) console.log(fg_Debug,"* Start minecraft_scrape()",fg_Reset)
    /**
     * server, server-ui   NO common
     * 
     * Umm, BDS and Beta is a different story...will figure out later
     * Note - dependencies in some of the BDS ones
     * 
     * Thanks Hatchi !!!
     */
    scrapeServer = "@minecraft/" + (cmdLineSettingsJson.BP.scripting_version_mod || "server")
    let site = "https://registry.npmjs.org/" + scrapeServer

    console.log(fg_Warning,"==> scraping site :",site,fg_Reset)

    fetch(site)
        .then(response => {    
            if (!response.ok) {throw new Error('Network response was not ok');}    
            return response.json();
        })
        .then(data => {
            console.log(fg_SuccessNext,"==> Data Retrieved")    
            minecraftScrapeData = data;                        
            manifestRedirect();
        })       
        .catch(error => {
            console.error('Fetch error:', error);
        });
    if (isDebug) console.log(fg_DebugNext,"x Out-Of-Sync minecraft_scrape()")
}
//=======================================================================
function jsonParseRemovingComments(text){
    let isDebugMe = false;
    if(isDebugMe) console.log(fg_DebugNext,"* jsonParseRemovingComments()")
    //text is a string, not JSON.. which obviously does not need this function
    let dataString = text;

    //1) Remove all /* */    
    while (dataString.indexOf("/*") >= 0){

        let ptrStart = dataString.indexOf("/*");
        let front = ptrStart <= 0 ? "" : dataString.substring(0,ptrStart-1);

        let back = dataString.substring(ptrStart+2);
        let ptrEnd = back.indexOf("*/");

        if (ptrEnd == -1)
            dataString = front;
        else {
            back = back.substring(ptrEnd+2);
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
            if(isDebugMe) console.log(fg_Error,"err.name",err.name,"err.message=",err.message,fg_Reset)
            let errTrapArray = [
                "Expected double-quoted property name in JSON at position ",
                "Expected property name or '}' in JSON at position "
            ]
            let errTrap="xxxxx";
            for(let i = 0; i < errTrapArray.length; i++) {
                if(err.message.startsWith(errTrapArray[i])) {
                    errTrap = errTrapArray[i]
                    break
                };
            }

            if (err.message.startsWith(errTrap)) {
                let ptr = parseInt(err.message.substring(errTrap.length))
    
                let front = dataString.substring(0,ptr-1)
                let back = dataString.substring(ptr)
                let ptrEOL = back.indexOf("\n");

                if(ptrEOL >= 0){
                    back = back.substring(ptrEOL+1);
                    dataString = front + back;
                }
                else {
                    dataString = front;
                }                
            }
            else {
                console.log(fg_WarningNext,"Error: JSON Parse Error Not Configured",err.message);
                if(isDebugMe) console.log(fg_WarningNext,"x jsonParseRemovingComments()")
                return null;
            }
        }
    }
    while(more);

    if(isDebugMe) console.log(fg_SuccessNext,"x jsonParseRemovingComments()")
    return dataJson
}
//=======================================================================
function getConfigFileAuthor(){
    let isDebugMe=false;
    if(isDebugMe) console.log(fg_DebugNext,"* getConfigFileAuthor()")
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
        console.log(fg_WarningNext,"Error: Cannot find path to config.sys to get author, skipping");
        if(isDebugMe) console.log(fg_DebugNext,"x getConfigFileAuthor()")
        return null;
    }

    let configPathFilename = argPath.substring(0,ptr) + "config.json";
    let configData;
    try {
        const data = fs.readFileSync(configPathFilename, 'utf8');
        configData = data;
    } catch (err) {
        console.log(fg_WarningNext,"Error: Cannot read config.sys to get author, skipping");
        if(isDebugMe) console.log(fg_DebugNext,"x getConfigFileAuthor()")
        return null;
    }

    if(!configData.search("\"author\"")) {
        console.log(fg_WarningNext,"Error: Cannot find word author in config.sys to get author, skipping");
        if(isDebugMe) console.log(fg_DebugNext,"x getConfigFileAuthor()")
        return null;
    }

    let configJson
    configJson = jsonParseRemovingComments(configData)
    if(!configJson) {
        console.log(fg_WarningNext,"Error: Cannot parse config.sys to get author, skipping");
        if(isDebugMe) console.log(fg_DebugNext,"x getConfigFileAuthor()")
        return null;
    }

    console.log(fg_SuccessNext,"==> found author =",configJson.author)
    return configJson.author;
}
//=======================================================================
function main(){
    isDebug = !!cmdLineSettingsJson.debug || isDebug;    
    if (isDebug) console.log(fg_DebugNext,"* main()")
    
    masterDefaultSettings();

    //Append Setting Defaults
    const bpSettings = cmdLineSettingsJson.BP;
    if (!cmdLineSettingsJson.rp_only) {
        bpSettings.ModuleType = "data";
        ApplyDefaultSettings(bpSettings);
    }

    const rpSettings = cmdLineSettingsJson.RP
    if (!cmdLineSettingsJson.bp_only) {
        rpSettings.ModuleType = "resources";
        ApplyDefaultSettings(rpSettings);
    }

    if (cmdLineSettingsJson.dependencies) {
        bpSettings.depUUID = rpSettings.UUID
        bpSettings.depVersion = rpSettings.version
        rpSettings.depUUID = bpSettings.UUID
        rpSettings.depVersion = bpSettings.version
    }

    //---------------------------
    let goScrape = false
    if(bpSettings.min_engine_version.startsWith("get")) goScrape = true;
    else
    if(rpSettings.min_engine_version.startsWith("get")) goScrape = true;
    else
    if(bpSettings.scripting && bpSettings.scripting_version.startsWith("get")) goScrape = true;
    
    if (goScrape) {
        minecraft_scrape();
        if (isDebug) console.log(fg_Debug,"x Out-Of-Sync main()",fg_Reset)
    }
    else {
        manifests();
        mainEnd();
    }

    if (isDebug) console.log(fg_DebugNext,"x main()")
    
}
//=======================================================================
function mainEnd(){
    if (isDebug) {
        if (!cmdLineSettingsJson.rp_only) fs.writeFileSync("BP/debug.bpSettings.json", JSON.stringify(cmdLineSettingsJson.BP));
        if (!cmdLineSettingsJson.bp_only) fs.writeFileSync("RP/debug.rpSettings.json", JSON.stringify(cmdLineSettingsJson.RP));

        if (cmdLineSettingsJson.bp_only || !cmdLineSettingsJson.rp_only) fs.writeFileSync("BP/debug.ConfigSettings.json", JSON.stringify(cmdLineSettingsJson));
        else
        if (cmdLineSettingsJson.rp_only) fs.writeFileSync("RP/debug.ConfigSettings.json", JSON.stringify(cmdLineSettingsJson));

        console.log(fg_DebugNext,"Debug Files Exported");
    }

    console.log(fg_SuccessNext,"x Mani-Fest Regolith Filter")
}
// End of Main   
//============================================================================
//Go Home, the show is over