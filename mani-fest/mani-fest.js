let isDebug = false
/*
Information:
    Author:     DrinkWater623
    Contact:    LaFemmeNkechi@gmail.com

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
                    .And default version is [yy,m,d] DW Style

To Do:    
    1) Add manifest info for script API
    2) Make code efficient - Nkechi style (ummm, after I learn javascript)
    3) Make is so I can have a dev and rel pack icon - prob can use the data section to hold and use by name or settings has filename
    4) maybe grab the project and author from config for Meta Data
*/
//=====================================================================
//Global Include Like Statements (const <> constant and is still a mystery)

    const fs = require("fs");
    const myUUID = require("crypto");

//User Data Get (the settings info from the profile ran)
    var settings = process.argv[2];
    const jsonObject = JSON.parse(settings);

    if (!("BP" in jsonObject)) { jsonObject.BP = {}};
    if (!("RP" in jsonObject)) { jsonObject.RP = {}};
    if (!("dependencies" in jsonObject)) { jsonObject.dependencies = true};
    if (!("getUUIDs" in jsonObject)) { jsonObject.getUUIDs = true};
    if (!(jsonObject.getUUIDs == false)) { jsonObject.getUUIDs = true};

//Append Setting Defaults
    const bpSettings = jsonObject.BP;
    bpSettings.ModuleType = "data";
    ApplyDefaultSettings(bpSettings,"BP");

    const rpSettings = jsonObject.RP
    rpSettings.ModuleType = "resources";
    ApplyDefaultSettings(rpSettings,"RP");

    if (jsonObject.dependencies == true) {
        bpSettings.depUUID = rpSettings.UUID
        bpSettings.depVersion = rpSettings.version
        rpSettings.depUUID = bpSettings.UUID
        rpSettings.depVersion = bpSettings.version
    }

    if (isDebug) {
        fs.writeFileSync("BP/bpSettings.json", JSON.stringify(bpSettings));
        fs.writeFileSync("RP/rpSettings.json", JSON.stringify(rpSettings));
        fs.writeFileSync("BP/ConfigSettings.json", JSON.stringify(jsonObject));
    }

//Build Manifest
    buildManifest(bpSettings,"BP");
    buildManifest(rpSettings,"RP");

// End of Main    
//=======================================================================
//Subroutines (and I can't believe they don't officially have them)
//=======================================================================
function buildManifest(pSettings,p)
{
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
                "description":"_",
                "uuid": `${pSettings.module}`,
                "version": [1, 0, 0]
            }
        ]
    }
    if ("depUUID" in pSettings) {
        manifest.dependencies = [{
			"uuid": `${pSettings.depUUID}`,
			"version": pSettings.depVersion
		}]
    }

    manifest.metadata = {
		"authors": ["Add Name Here"],
        "generated_with":{
            "regolith_filter_mani_fest": ["1.0.0"]
            }
		}

    fs.writeFileSync(p + "/manifest.json", JSON.stringify(manifest,null,4));

} //end of buildManifest
//----------------------------------------------------------------------------
function ApplyDefaultSettings(pSettings,p){

    const d = new Date();
    const dayOfYear = date => Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const julianBuildDateTime=d.getFullYear().toString()+'.' + dayOfYear(d).toString().padStart(3, "0")+'.'+d.getHours().toString().padStart(2, "0")+'.'+d.getMinutes().toString().padStart(2, "0");


    if (!("name" in pSettings)) {
        if ("name" in jsonObject){
            pSettings.name = jsonObject.name + " " + p
        }
        else {pSettings.name = "My UnNamed Pack " + p}
    }

    if (!("description" in pSettings)) {
        if ("description" in jsonObject){
            pSettings.description = jsonObject.description + " " + p
        }
        else {pSettings.description = "This " + p + " pack does amazing things"}
    }
    
    pSettings.description = pSettings.description+"\nBuild Date: " + julianBuildDateTime

    if (!("version" in pSettings)) {
        if ("version" in jsonObject){
            pSettings.version = jsonObject.version
        }
        else {pSettings.version = [d.getFullYear()-2000, d.getMonth()+1, d.getDate()]}
    }

    if (!("min_engine_version" in pSettings)) {
        if ("min_engine_version" in jsonObject){
            pSettings.min_engine_version = jsonObject.min_engine_version
        }
        else {pSettings.min_engine_version = [1,16,100]}
    }

    if (!("UUID" in pSettings)) {
        if (jsonObject.getUUIDs == false){pSettings.UUID = "<Insert " + p + " UUID Here>"}
        else {pSettings.UUID = "get"}
    }

    if (!("module" in pSettings)) {
        if (jsonObject.getUUIDs == false) {pSettings.module = "<Insert module UUID Here>"}
        else {pSettings.module = "get"}
    }
    
    //Now every setting needed should exist

    if (pSettings.UUID == "get") {pSettings.UUID = newUUID()}
    if (pSettings.module == "get") {pSettings.module = newUUID()}

} //end of ApplyDefaultSettings
//----------------------------------------------------------------------------
function newUUID() 
    {return myUUID.randomUUID()}
//============================================================================