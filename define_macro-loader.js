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

function replaceAll(source, replaceTarget, replaceValue)
{
    let ind = 0;
    let nSource = source;
    while((ind = source.indexOf(replaceTarget, ind)) !== -1)
    {
        nSource = nSource.replace(replaceTarget, replaceValue);
        ind+= replaceTarget.length+1;
    }
    return nSource;
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


const defines = {};
function checkNotDefined(name)
{
    if(defines[name] === null)
        throw new SyntaxError("define_macro-loader: Tried to define "+name+" twice");
}


const reg = new RegExp(/DEFINE\((\w+)/g);
const funcArgs = "\\s*\\((.+)\\)";



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
    return define.match(matchArg)[1];
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

            var argValues = m[1].split(",");
            
            let shouldCloseFunction = false;
            if(argValues[argValues.length-1].indexOf(")") != -1 &&
            indexOfStringClosing(argValues[argValues.length-1], "(", ")") == -1) 
            {
                argValues[argValues.length-1] = argValues[argValues.length-1].replace(")", "");
                shouldCloseFunction = true;
            }

            var argNames = getDefineArguments(defines[b]);
            for(var i = 0; i < argNames.length; i++)
                argNames[i] = replaceAll(argNames[i], " ", "");



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
            //Change the arguments to the absolute value passed
            for(var i = 0; i < argNames.length; i++)
            {
                replacedFunc = replacedFunc.replace(new RegExp(argNames[i]+"\\b", "g"),
                (match) => argValues[i]);
            }

            //Destroy everything until finding the first {
            replacedFunc = replacedFunc.substring(replacedFunc.indexOf("{"))

           

            //Search a return for wether the function should be treated as a rval or code block
            const retIndex = replacedFunc.lastIndexOf("return ");
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
                    while(source[++endLine] != "\n" && source[endLine] != ";" && source[endLine] != "\r" && source[endLine] != "\0");

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


/**
 * Used for typescript source. It can't do intermodule decltype
 * @param {*} source
 * @returns
 */
module.exports = function(source)
{
    const opts = loader_utils.getOptions(this);
    source = getDefineFunctions(source);

    return replaceUsages(source);
}
