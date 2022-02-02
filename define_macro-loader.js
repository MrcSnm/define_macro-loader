/**
 * @author Marcelo Mancini | Hipreme | MrcSnm
 * @since 2021
 */
const loader_utils = require("loader-utils");


function isInsideComment(source, index)
{
    const startIndex = index;

    //Check multiline
    const multilineEndIndex = source.indexOf("*/", startIndex);
    if(multilineEndIndex !== -1)
    {
        const multilineStartIndex = source.lastIndexOf("/*", multilineEndIndex);
        if(startIndex > multilineStartIndex && startIndex < multilineEndIndex)
            return true;
    }
    const oneLinerStartIndex = source.lastIndexOf("//", startIndex);
    if(oneLinerStartIndex !== -1)
    {
        const oneLinerEndIndex = source.indexOf("\n", oneLinerStartIndex);
        if(startIndex > oneLinerStartIndex && startIndex < oneLinerEndIndex)
            return true;
    }
    return false;
}

/**
 * @typedef StringDefinition
 * @property {string} str
 * @property {number} start
 * @property {number} end
 * @property {string} definer
 */

/**
 * 
 * @param {string} source 
 * @param {number} index 
 * @return {StringDefinition|null}
 */
function getStringDefinition(source, index)
{
    const strDefs = ['"', "'", "`"];
    let foundStrDefiner = "";
    const escapeCharacters = ["\\"];

    const strRet = 
    {
        str : "",
        start : 0,
        end   : 0,
        definer : ""
    }
    for(let i = index; i >= 0; i--)
    {
        if(foundStrDefiner === "" &&
        strDefs.indexOf(source[i]) != -1 && 
        (i == 0 || escapeCharacters.indexOf(source[i-1]) == -1))
        {
            foundStrDefiner = source[i];
            strRet.start   = i;
            strRet.definer = foundStrDefiner;
        }
        else if(foundStrDefiner !== "" &&
        source[i] == foundStrDefiner &&
        (i == 0 || escapeCharacters.indexOf(source[i-1]) == -1))
        {
            if(getStringDefinition(source, i+1) != null)
                return null;
            break;
        }
    }
    if(foundStrDefiner === "")
        return null;

    for(let i = index; i < source.length; i++)
    {
        if(escapeCharacters.indexOf(source[i]) != -1)
        {
            i++;
            continue;
        }
        else if(source[i] == foundStrDefiner)
        {
            strRet.end = i+1;
            strRet.str = source.substring(strRet.start, i+1);
            return strRet;
        }
    }
    return false;
}

function indexOfStringClosing(input, openString, closeString, start)
{
    let open = 0;
    for(let i = start; i < input.length; i++)
    {
        if(input[i] == openString)
            open++;
        else if(input[i] == closeString)
        {
            open--;
            if(open == 0)
                return i;
        }
    }
    return -1;
}

function getMacroReturnIndex(input)
{
    let curlyBracketLevel = 0;

    for(let i = 0; i < input.length; i++)
    {
        if(input[i] === "{")
            curlyBracketLevel++;
        else if(input[i] === "}")
            curlyBracketLevel--;
       
        if(input[i] === 'r')
        {
            let hasBroke = false;
            for(let z = 0; z < "return ".length; z++)
            {
                if(input[i+z] !== "return "[z])
                {
                    hasBroke = true;
                    break;
                }
            }
            if(!hasBroke && curlyBracketLevel == 1)
                return i;
        }
    }
    return -1;
}


const defines = {};
function checkNotDefined(name)
{
    if(defines[name] === null)
        throw new SyntaxError("define_macro-loader: Tried to define "+name+" twice");
}


const reg = new RegExp(/DEFINE\((\w+)/g);
const funcArgs = "\\s*\\((.*)\\)";



function stripComments(source)
{
    let ind = 0;
    while((ind = source.indexOf("//")) != -1)
        source = source.substring(0, ind) + source.substring(source.indexOf("\n", ind)+1);

    while((ind = source.indexOf("/*")) != -1)
        source = source.substring(0, ind) + source.substring(source.indexOf("*/", ind)+2);
    return source;
}

function getDefineFunctions(source)
{
    var nSource = source;
    for(var m of source.matchAll(reg))
    {
        if(!isInsideComment(source, m.index))
        {
            checkNotDefined(m[1]);

            let startIndex = m.index;
            let endIndex = indexOfStringClosing(source, "(", ")", m.index);
            const func = source.substring(startIndex, endIndex+1);
            defines[m[1]] = stripComments(func);
            if(source[endIndex+1] === ";")
                nSource = nSource.replace(func+";", "");
            else
               nSource = nSource.replace(func, "");
        }
    }
    return nSource;
}


function getDefineArguments(define)
{
    const matchArg = new RegExp(/DEFINE\(\w+,\s*(?:function)?\((.+)\)/);
    const matches = define.match(matchArg);
    
    if(matches == null)
        return [];

    const match = matches[1];
    if(match.indexOf(",") != -1)
        return match.split(/, */g);
    return match;
}

function isCharSpace(char){return char == "\n" || char == " " || char == "\t" || char == "\r";}

function getFirstReturnIndex(source)
{
    let currentReturnIndex = -1;

    for(let i = 0; i < source.length; i++)
    {
        if(source[i] == "{")
        {
            currentReturnIndex = source.indexOf("return ", i);
            if(source.indexOf("{", i+1) > currentReturnIndex)
                return currentReturnIndex;
        }
    }
    return currentReturnIndex;
}

function getArgValues(argValuesLine)
{
    let strDefines = ['"', "`", "'"];
    let args = [];
    let currIndex = 0;

    for(let i = 0; i < argValuesLine.length; i++)
    {
        if(strDefines.indexOf(argValuesLine[i]) != -1)
        {
            let strDef = getStringDefinition(argValuesLine, i - 1);
            if(strDef == null && i != 0)
            {
                const tempArgs = argValuesLine.substring(currIndex+1, i-1).split(",");
                for(let z = 0; z < tempArgs.length;z++)
                    if(tempArgs[z] != "")
                        args.push(tempArgs[z]);
            }
            else if(strDef != null)
                args.push(strDef.str);
            currIndex = i;
            strDef = getStringDefinition(argValuesLine, i+1); //Should be guaranteed non null here
            args.push(strDef.str);
            currIndex = strDef.end+1;
            i = currIndex;
        }
    }
    let newArgValuesLine = argValuesLine.substring(currIndex, argValuesLine.length);
    if(newArgValuesLine != "")
        args.push(...newArgValuesLine.split(","));
    if(args.length == 0)
        args.push("");
    return args;
}

function replaceUsages(source)
{
    let nSource = source;
    for(var b of Object.keys(defines))
    {
        const funcReg = new RegExp(b+funcArgs, "g");

        //Create the DEFINE call for the line that called it
        
     
        for(let m of source.matchAll(funcReg))
        {
            //Clean argument values and names
            if(isInsideComment(source, m.index))
                continue;

            var argValues = getArgValues(m[1]);

           
            let shouldCloseFunction = false;
            if(argValues[argValues.length-1].indexOf(")") != -1 &&
            indexOfStringClosing(argValues[argValues.length-1], "(", ")") == -1)
            {
                argValues[argValues.length-1] = argValues[argValues.length-1].replace(")", "");
                shouldCloseFunction = true;
            }

            var argNames = getDefineArguments(defines[b]);
            //Cache the target function
            var replacedFunc = defines[b];
           
            //Get the variables defined inside the function
            var variablesMatch = new RegExp("(let|var|const)\\s+(\\w+)", "g");
            const funcVars = [];
            for(let varM of replacedFunc.matchAll(variablesMatch))
                funcVars.push(varM[2]);
           
            //Make the variables defined inside private(must work more on it)
            for(let z = 0; z < funcVars.length; z++)
            {
                replacedFunc = replacedFunc.replace(new RegExp(funcVars[z]+"\\b", 'g'),
                (match) => "__"+match+"__");
            }

            if(typeof argNames == "string")
                argNames = [argNames];

            //Destroy everything until finding the first {
            replacedFunc = replacedFunc.substring(replacedFunc.indexOf("{"))


            //Change the arguments to the absolute value passed
            for(i = 0; i < argNames.length; i++)
            {
                replacedFunc = replacedFunc.replace(new RegExp(argNames[i]+"\\b", "g"),
                (match) => argValues[i]);
            }


            //Search a return for wether the function should be treated as a rval or code block
            const retIndex = getMacroReturnIndex(replacedFunc);
            if(retIndex != -1)
            {
                //Get return statement to replace
                const returnIndex = getFirstReturnIndex(replacedFunc);
                const retStatement = replacedFunc.substring(returnIndex+"return ".length, replacedFunc.lastIndexOf("})")).replace(";", "");
                const process = replacedFunc.substring(replacedFunc.indexOf("{")+1, returnIndex);

                //Get rid of the return, as "=" symbol will do the task.
                let index = m.index-1;
                while(isCharSpace(source[--index]));
               
                //There is no need to find some kind of user, as a setter could return a value or not
                // if(source[index] == "=" || source[index] == "(")
                // {
                    const firstLineBreak = source.lastIndexOf("\n", index); //Find first back \n

                    //First endline
                    let endLine = m.index;

                    const sourceNot = ["\n", ";", "\r", "\0", ","];

                    while(sourceNot.indexOf(source[++endLine]) == -1);

                    let line = source.substring(firstLineBreak, endLine);
                    if(source[endLine] === ";")
                        line+=";";
                    nSource = nSource.replace(line, process + source.substring(firstLineBreak, m.index) + retStatement + (shouldCloseFunction ? ")" : ""));
                // }
            }
            else
            {
                //Check if there is an equal symbol before GetRef
                let index = m.index-1;
                while(isCharSpace(source[--index]));
                if(source[index] == "=" || source[index] == "(")
                    throw new SyntaxError("Tried to assign a variable with a void function '"+b+"'");
               
                replacedFunc = replacedFunc.substring(0, replacedFunc.lastIndexOf(")"));

                //If it does not use variables, do not create scope
                if(funcVars.length == 0)
                    replacedFunc = replacedFunc.substring(1, replacedFunc.length-1);
                nSource = nSource.replace(new RegExp(b+"\\(.*\\);?"), replacedFunc);
            }
        }
    }
    return nSource;
}

///Better than substring as it doesn't allocate memory
function substringEquals(str, start, equalsTo)
{
    if(start + equalsTo.length > str.length)
        return false;
    for(let i = 0; i < equalsTo.length; i++)
    {
        if(equalsTo[i] != str[start+i])
            return false;
    }
    return true;
}

function replaceAll(source, replaceTarget, replaceValue)
{
    for(let i = 0; i < source.length; i++)
    {
        if(substringEquals(source, i, replaceTarget))
        {
            source = source.substring(0, i) + replaceValue + source.substring(i+replaceTarget.length, source.length);
            i+= replaceTarget.length;
        }
    }
    return source;
}

function replaceKeywords(src, filename)
{
    const KEYWORDS = ["__FILE__", "__LINE__"];
    let line = 0;
    for(let i = 0; i < src.length; i++)
    {
        switch(src[i])
        {
            case '\n': 
                line++;
                break;
            case '/':
                if(i+1 < src.length && src[i+1] == '/')
                {
                    i+=2;
                    while(i < src.length && src[i] != '\n')
                        i++;
                    i++;line++;
                }
                else if(i+1 < src.length && src[i+1] == '*')
                {
                    i+=2;
                    while(i < src.length && src[i] != "*" && i+1 < src.length && src[i+1] != '/')
                    {
                        if(src[i] == '\n')
                            line++;
                        i++;
                    }
                    i+=2;
                }
                break;
            case '"':
            case "'":
            case '`':
                const c = src[i];
                i++;
                while(i < src.length && src[i] != c)
                {
                    if(src[i] == '\\')
                        i++;
                    i++;
                }
                break;
            default:
                for(k of KEYWORDS)
                {
                    if(substringEquals(src, i, k))
                    {
                        switch(k)
                        {
                            case "__LINE__":
                                src = src.substring(0, i) + line + src.substring(i+k.length, src.length);
                                break;
                            case "__FILE__":
                                src = src.substring(0, i) + '"'+filename+'"' + src.substring(i+k.length, src.length);
                                i+= filename.length+2; //Take into account both the '"'
                                break;
                            default:
                                throw new Error("Unexpected error");
                        }
                        break;
                    }
                }
                break;
        }
    }
    return src;
}


/**
 * Used for typescript source. It can't do intermodule decltype
 * @param {*} source
 * @returns
 */
module.exports = function(source)
{
    const opts = loader_utils.getOptions(this);
    source = getDefineFunctions(source);
    source = replaceUsages(source);
    let filename = this.resourcePath;

    if(process.platform == "win32")
        filename = replaceAll(filename, "\\", "\\\\");
    return replaceKeywords(source, filename);
}
