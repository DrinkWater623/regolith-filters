// @ts-check
const isDebug = true;
const isDebugMax = false; 
const DebugList = ['',''];
/*
Information:
    Author:     DrinkWater623/PinkSalt623
    Contact:    Discord/GitHub @DrinkWater623 

    Purpose:    compile the add-on ts to js. 

    Usage:      in Regolith.  Does not validate input.

    Settings:   name,version,min_game_version,description (all have defaults)
                BP/RP{any of the above to override, UUID, module}
                for UUID and module, can use real/fake UUID or the word get to get a real new one

Need
npm install --global gulp
npm install --save-dev gulp gulp-typescript

Change Log:    
    20240505 - NAA - Created Basics 

To Do:    
    (x) Get it to work
    ( ) use settings for options
    --check out the other ones like esbuild and see about making a bundler and learn to do  github install
*/
//=====================================================================
//VS Code Colors
const fg_Reset = '\x1b[0m'
const fg_Error = '\x1b[91m%s'
const fg_Warning = '\x1b[31m%s'
const fg_Success = '\x1b[32m%s'
const fg_General = '\x1b[36m%s'
const fg_GeneralNext = fg_General+fg_Reset
const fg_Debug = '\x1b[95m%s'
const fg_DebugNext = fg_Debug+fg_Reset
//=====================================================================
var args = process.argv[2];
const userSettings = JSON.parse(args);
const prgDataPath = "data/ts-compile";
const bpScriptsPath = "BP/scripts";
const pathsAllowed = [prgDataPath,bpScriptsPath];
const defSettings = {
    "src": [prgDataPath+"/**/*.ts"], //has to be within BP/Packs/RP
    "dest": bpScriptsPath,
    "ignoreFileRegEx":[],
    "copyJsFiles": false,
    //these are added by this program, not for the user to use
    //"tsFileList":[],
    //"jsFileList":[],
    //? build options, not sure needed
}
const prgSettings = Object.assign({},defSettings,userSettings)
//=====================================================================
const fs = require("fs");
const fileInfo = require('path'); 
const { exec } = require('child_process');
const gulp = require('gulp');
// @ts-ignore
const tsc = require('gulp-typescript'); //it is there, ts does not think so
//=======================================================================
function isFile(path){    
    return fs.lstatSync(path).isFile()
}
function isDirectory(path){
    return fs.lstatSync(path).isDirectory()
}
function isEmptyFolder(path){
    if(isDebugMax) console.log(fg_Debug,"* isEmptyFolder(",path,")",fg_Reset);

    if(isFile(path)) return false //this is a problem to me, indicates may be a filled folder, and it is NOT, but obviously the folder it is in, is not empty
    const fileList = fileTreeGet(path)

    return fileList.length == 0
}
function fileTreeGet(path, onlyExt = "", minFileSize = 0){
    let isDebugMax = DebugList.includes('fileTreeGet');    

    if(isDebugMax) console.log(fg_Debug,"* fileTreeGet(path=",path,"ext=",onlyExt,")",fg_Reset);

    const fileList = []

    try {
        fs.readdirSync(path)
    }
    catch {
        console.log(fg_Warning,"Error: Folder =",path,"Does Not Exist, Skipping")
        return []
    }
    const tempFileList = fs.readdirSync(path)
    
    for(let f of tempFileList){
        const fullFileName = (path + '/' + f).replace('//','/');
        const fileObj = 
        {
            fileName: fullFileName,
            parse: fileInfo.parse(fullFileName),
            isFile: !isDirectory(fullFileName),                            
            size:0,
            keep: false
        }
        fileObj.size =  fileObj.isFile ? fs.readFileSync(fullFileName).length : 0;
        fileObj.keep =  fileObj.isFile && (onlyExt.length ==0 || fileObj.parse.ext == onlyExt) && fileObj.size >= minFileSize;

        if(isDebugMax) console.log(fg_Debug,"==> Found Entry = ",fileObj)        

        if(!fileObj.isFile){

            if(isDebugMax) console.log(fg_Debug,"==> Looking in folder",fileObj.parse.base);
            let newSearch = fileTreeGet(fullFileName,onlyExt,minFileSize);
            
            if (newSearch.length > 0 ) {
                for (let i in newSearch) {
                    fileList.push(newSearch[i]);
                }
            }
        }        
        else if(fileObj.keep){            

            if(isDebugMax) console.log(fg_Debug,"\t==> Saving",fileObj.fileName,fg_Reset);
            //@ts-ignore
            delete fileObj.keep;
            fileList.push(fileObj);
        }
    }

    return fileList;
}
//====================================================================
function programSettings(){
    let isDebug = DebugList.includes('programSettings');  
    if(isDebug) {
        console.log(fg_DebugNext,"* programSettings()")
        //for (let k in userSettings) console.log(fg_Debug,"==> User:",k,"=",userSettings[k],fg_Reset)
        //for (let k in prgSettings)  console.log(fg_Debug,"==> Default:",k,"=",defSettings[k],fg_Reset)
        for (let k in prgSettings)  console.log(fg_Debug,"==> Pre-Final:",k,"=",prgSettings[k],fg_Reset)
    }
        
    
    //src
    let defTsSearch = prgDataPath + "/**/*.ts"
    if(prgSettings.src.length == 0)
        prgSettings.tsFilePaths = [defTsSearch]
    else
    if(typeof prgSettings.src == "boolean") {
        prgSettings.tsFilePaths = [defTsSearch]
    }
    else
    if(typeof prgSettings.src == "string") {
        if(prgSettings.src == "default")
            prgSettings.tsFilePaths = [defTsSearch]
        else
        if(prgSettings.src == "all" || prgSettings.src == "any")
            prgSettings.tsFilePaths = [...pathsAllowed];
        else
            prgSettings.tsFilePaths = [...prgSettings.src.split(',')];
    }
    else {
        prgSettings.tsFilePaths = [...prgSettings.src]
    }  
    
    for(let i in prgSettings.tsFilePaths){
        let folder = prgSettings.tsFilePaths[i];        
        
        if (!(folder.startsWith(pathsAllowed[0]) || folder.startsWith(pathsAllowed[1]))) {
            let errMsg = `Settings Error: all src TS paths must be within "`+pathsAllowed[0]+`" or "`+pathsAllowed[0]+`"  xxx> `+folder+` <xxx`;
            console.log(fg_Error,errMsg)
            throw new Error (errMsg);
        }

        if(!folder.endsWith(".ts")) {
            if(folder.includes("*")) 
                folder += ".ts"
            else
                folder += "/**/*.ts"            
        }

        prgSettings.tsFilePaths[i] = folder;
        if(isDebug) console.log(fg_Debug,"==> ts search folder",folder,fg_Reset)
    }

    //dest - string - only one
    if(prgSettings.dest.length == 0) 
        prgSettings.dest = bpScriptsPath;
    else
    if(typeof prgSettings.dest == "object") 
        throw new Error("Settings Error: dest must be a string");
    else
    if(typeof prgSettings.dest == "boolean") 
        prgSettings.dest = bpScriptsPath;
    else
    if(["Null","Undefined","default","scripts","/scripts","/scripts/"].includes(prgSettings.dest)) 
        prgSettings.dest = bpScriptsPath;

    if(!prgSettings.dest.startsWith(bpScriptsPath)) {

        if(prgSettings.dest.startsWith("scripts")) {
            prgSettings.dest = "BP/"+prgSettings.dest;
        }
        else {
            console.log(fg_Warning,`Adding ${bpScriptsPath} to dest=` + prgSettings.dest,fg_Reset);
            prgSettings.dest = bpScriptsPath+"/"+prgSettings.dest;
        }
    }
    if(!prgSettings.dest.endsWith("/")) prgSettings.dest += "/";

    //---------------------------------------------------------JS Files
    if(typeof prgSettings.copyJsFiles == "boolean") {
        if(prgSettings.copyJsFiles) {
            prgSettings.jsFilePaths = [prgDataPath]
        }
        else prgSettings.jsFilePaths = []
    }
    else
    if(typeof prgSettings.copyJsFiles == "string") {
        prgSettings.jsFilePaths = [...prgSettings.copyJsFiles.split(',')];
        prgSettings.copyJsFiles = true;
    }
    else {
        prgSettings.jsFilePaths = [...prgSettings.copyJsFiles]
    }
    
    for(let i in prgSettings.jsFilePaths){
        let folder = prgSettings.jsFilePaths[i].replace('.ts','.js');       

        if (!folder.startsWith(pathsAllowed[0])) {            
            let errMsg = `Settings Error: all copy JS paths must be within "`+pathsAllowed[0]+`"  xxx> `+folder+` <xxx`;
            console.log(fg_Error,errMsg)
            throw new Error(errMsg);
        }

        if(!folder.endsWith(".js")) {
            if(folder.includes("*")) 
                folder += ".js"
            else
                folder += "/**/*.js"            
        }

        prgSettings.jsFilePaths[i] = folder;
        if(isDebug)  console.log(fg_Debug,"==> js search folder",folder,fg_Reset)
    }
    
    for (let k in prgSettings)  console.log("==> Settings:",k,"=",prgSettings[k],)
    if(isDebug) {        
        console.log(fg_DebugNext,"x programSettings()")
    }
}
//=====================================================================
function getJsFileList(){
    console.log(fg_GeneralNext,"* get Js File List()")
    let isDebug = DebugList.includes("getJsFileList");
    
    let fileList = [];
    for(let path of prgSettings.jsFilePaths){

        //to-do - Add in ignore list
        let parse = path.split("*")
        if(isDebug) console.log(fg_Debug,"==> getting js Path:",parse[0])
        const newList = fileTreeGet(parse[0],".js",2)
        fileList = fileList.concat(newList);
    }

    prgSettings.jsFileList = [...fileList];

    console.log("==> JS File Count =",fileList.length)
    for (let i in fileList) console.log("==> js File:",fileList[i].fileName)

    if(isDebug) {
        console.log(fg_DebugNext,"x getJsFileList()")
    }
    return
}
//=====================================================================
function getTsFileList(){
    console.log(fg_GeneralNext,"* get Ts File List()")
    let isDebug = DebugList.includes("getTsFileList");
    
    let fileList = [];
    for(let path of prgSettings.tsFilePaths){

        //to-do - Add in ignore list
        let parse = path.split("*")
        if(isDebug) console.log(fg_Debug,"==> getting ts Path:",parse[0])
        const newList = fileTreeGet(parse[0],".ts",2)
        fileList = fileList.concat(newList);
    }

    prgSettings.tsFileList = [...fileList];

    console.log("==> TS File Count =",fileList.length)
    for (let i in fileList) console.log("==> ts File:",fileList[i].fileName)

    if(isDebug) {
        console.log(fg_DebugNext,"x getTsFileList()")
    }
    
    return
}
//====================================================================
function compile_ts_src(src, dest) {
    return gulp
        .src(src)        
        .pipe(
            tsc({
                module: "es2020",
                moduleResolution: "node",
                lib: ["es2020", "dom"],
                strict: true,
                target: "es2020",
                noImplicitAny: true,
            })
        )        
        .pipe(gulp.dest(dest));
}
//=====================================================================
function compile_ts_files(){

    for(let path of pathsAllowed){

        const fileList = prgSettings.tsFileList.filter(v => v.fileName.startsWith(path)).map(v => v.fileName);

        for(let src of fileList){
            let dest = src.replace(path,prgSettings.dest).replace('//','/').replace('.ts','.js');
            dest = fileInfo.parse(dest).dir;
            compile_ts_src(src,dest);
            console.log(fg_Success,"<>",src,"==>",dest,fg_Reset);
        }
    }
}
//=====================================================================
function copy_js_src(src,dest){

    //did not work, kept having issues
    //try { 
    //    fs.copyFileSync(src, dest, fs.constants.COPYFILE_EXCL); 
    //    console.log(fg_Success,"<>",src,"==>",dest,fg_Reset);
    //} 
    //catch (err) { 
    //    console.log(err); 
    //} 

    fs.cp(src, dest, (err) => {
        if (err) {
            console.error(err);
        }
        else
            console.log(fg_Success,"<>",src,"==>",dest,fg_Reset);
    });
}
function copy_js_files(){
    const fileList = prgSettings.jsFileList.filter(v => v.fileName.startsWith(prgDataPath)).map(v => v.fileName);

    for(let src of fileList){
        let dest = src.replace(prgDataPath,prgSettings.dest).replace('//','/').replace('.ts','.js');
        dest = fileInfo.parse(dest).dir+'/'+fileInfo.parse(dest).base;
        
        copy_js_src('./'+src,'./'+dest);        
    }
}
//=====================================================================
function main(){    
    console.log(fg_GeneralNext,"* TS Compile (to JS)")

    programSettings();

    getTsFileList();
    getJsFileList();

    if(prgSettings.jsFileList.length + prgSettings.tsFileList.length == 0) {
        console.log(fg_Success,"No TS or JS Scripts, Nothing to Do");
        return;
    }
    
    compile_ts_files();
    copy_js_files();
   
    //add the js copy now

    return;
}
//=====================================================================
main();
