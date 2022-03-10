/**
 * @author Marcelo Mancini | Hipreme | MrcSnm
 * @since 2021
 */
const loader_utils = require("loader-utils");

const _a = "a".charCodeAt(0);
const _z = "z".charCodeAt(0);
const _A = "A".charCodeAt(0);
const _Z = "Z".charCodeAt(0);
const _0 = "0".charCodeAt(0);
const _9 = "9".charCodeAt(0);


function log(...arg)
{
    console.log.apply(null, ["_______\n", ...arg, "_______\n"]);
}

function isCharStringDefiner(character)
{
    return character == '"' || character == '"' || character == '`';
}

function isUpperCase(character)
{
    const c = character.charCodeAt(0);
    return c >= _A && c <= _Z;
}
function isLowerCase(character)
{
    const c = character.charCodeAt(0);
    return c >= _a && c <= _z;
}
function isNumeric(character)
{
    const c = character.charCodeAt(0);
    return c >= _0 && c <= _9;
}

function isOperator(c)
{
    return c == '>' ||
           c == '<' ||
           c == '=' ||
           c == '+' ||
           c == '-' ||
           c == '*' ||
           c == '^' ||
           c == '~' ||
           c == '!' ||
           c == '|' ||
           c == '&' ||
           c == '/';
}

function isAlpha(character)
{
    return isUpperCase(character) || isLowerCase(character);
}
function isAlphaNumeric(character)
{
    return isAlpha(character) || isNumeric(character);
}


function isInsideComment(source, index)
{
    const startIndex = index;

    //Check multiline
    const multilineEndIndex = source.indexOf("*/", startIndex);
    if(multilineEndIndex !== -1)
    {
        const multilineStartIndex = source.lastIndexOf("/*", multilineEndIndex);
        if(multilineStartIndex == -1 || startIndex > multilineStartIndex && startIndex < multilineEndIndex)
            return true;
    }
    const oneLinerStartIndex = source.lastIndexOf("//", startIndex);
    if(oneLinerStartIndex !== -1)
    {
        const oneLinerEndIndex = source.indexOf("\n", oneLinerStartIndex);
        if(oneLinerEndIndex == -1 || startIndex > oneLinerStartIndex && startIndex < oneLinerEndIndex)
            return true;
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

/**
 * argValuesLine always ends with ')'
 */
function getArgValues(argValuesLine)
{
    const strDefiners = ['"', '`', "'"];
    const stackOpeners = ['(', '[', '{'];
    const stackClosers = [')', ']', '}'];
    let args = [];

    let index = 0;

    let exp = "";


    while(index < argValuesLine.length && argValuesLine[index] != ')')
    {
        switch(argValuesLine[index])
        {
            //Look for strings
            case '"':
            case '`':
            case "'":
            {
                const strDef = argValuesLine[index];
                const start = index;
                index++;
                while(index < argValuesLine.length && argValuesLine[index] != strDef)
                {
                    if(argValuesLine[index] == '\\')
                    {
                        index++;
                        if(index >= argValuesLine.length)
                            throw new SyntaxError("Error parsing the arg values line " + argValuesLine);
                    }
                    index++;
                }
                //Use +1 for including the ' or " or `
                exp+= argValuesLine.substring(start, index+1)
            }
            default:
            {
                //If is a lowercase, uppercase or _, search until the next argument or the end
                if(isAlpha(argValuesLine[index]) || argValuesLine[index] == '_')
                {
                    const start = index;
                    index++;
                    while(index < argValuesLine.length && isAlphaNumeric(argValuesLine[index]) || argValuesLine[index] == '.')
                        index++;
                    exp+= argValuesLine.substring(start, index);
                }
                //If it is a number literal
                else if (isNumeric(argValuesLine[index]))
                {
                    const start = index;
                    index++;
                    while(index < argValuesLine.length && isAlphaNumeric(argValuesLine[index])) //Get alphanumeric for getting formatted numbers like 0x or 0b
                        index++;
                    exp+= argValuesLine.substring(start, index);
                }
                else if (isOperator(argValuesLine[index]))
                {
                    const start = index;
                    index++;
                    while(isOperator(argValuesLine[index]))
                        index++;
                    exp+= " "+ argValuesLine.substring(start, index)+ " ";
                    index++;
                }
                //Checks for stack openers
                else if(stackOpeners.indexOf(argValuesLine[index]) != -1) //If it has any of the stack openers
                {
                    //Stack is used for correctly parsing the arguments
                    const stack = [argValuesLine[index]];
                    const start = index;
                    index++;

                    while(index < argValuesLine.length)
                    {
                        if(stack.length == 0 && (argValuesLine[index] == ')' || argValuesLine[index] == ','))
                            break;
                        if(stackClosers.indexOf(argValuesLine[index]) != -1)
                        {
                            if(stack.length > 0)
                                stack.pop();
                        }
                        else if(stackOpeners.indexOf(argValuesLine[index]) != -1)
                        {
                            stack.push(argValuesLine[index]);
                        }
                        //Check for string literals
                        else if(strDefiners.indexOf(argValuesLine[index]) != -1)
                        {
                            let strDef = argValuesLine[index];
                            index++;
                            while(index < argValuesLine.length && argValuesLine[index] != strDef)
                            {
                                if(argValuesLine[index] == '\\')
                                    index++;
                                index++;
                            }
                        }
                        index++;
                    }

                    exp+= argValuesLine.substring(start, index)
                }
                else //This should be commas and whitespaces
                {
                    if(argValuesLine[index] == ',')
                    {
                        args.push(exp);
                        exp = "";
                    }
                    index++;
                }
            }
            
        }
    }
    if(exp != "")
        args.push(exp);

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
                let firstLineBreak = source.lastIndexOf("\n", index); //Find first back \n
                if(firstLineBreak == -1) firstLineBreak++; //Guarantees valid range

                //First endline
                let endLine = m.index;

                while(!substringEquals(source, endLine++, m[0]));
                endLine+= m[0].length-1;

                let line = source.substring(firstLineBreak, endLine);
                if(source[endLine] === ";")
                    line+=";";

                //Find what was after the func call + args
                let afterCall = line.substring(line.indexOf(m[1]));
                let tempIndex = 0;
                while(afterCall[tempIndex++] != ')');
                afterCall = afterCall.substring(tempIndex);

                nSource = nSource.replace(line, process + source.substring(firstLineBreak, m.index) + retStatement + afterCall);
            }
            else
            {
                
                //Check if there is an equal symbol before GetRef
                let index = m.index-1;
               
                //Get rid of trailing ')'
                replacedFunc = replacedFunc.substring(0, replacedFunc.lastIndexOf(")"));


                let afterCall = "";
                let line = "";

                //Now find what is after the function call(probably should be nothing, as it does not return a value)
                //And find the line which will be replaced
                {
                    let firstLineBreak = source.lastIndexOf("\n", index); //Find first back \n
                    if(firstLineBreak == -1) firstLineBreak++; //Guarantees valid range
    
                    //First endline
                    let endLine = m.index;
    
    
                    while(!substringEquals(source, endLine++, m[0]));
                    endLine+= m[0].length-1;
    
                    line = source.substring(firstLineBreak, endLine);
                    if(source[endLine] === ";")
                        line+=";";
                    afterCall = line.substring(line.indexOf(m[1]))

                    let tempIndex = 0;
                    while(afterCall[tempIndex++] != ')');
                    afterCall = afterCall.substring(tempIndex);

                }
                
                //If it does not use variables, do not create scope
                if(funcVars.length == 0)
                    replacedFunc = replacedFunc.substring(1, replacedFunc.length-1);

                
                nSource = nSource.replace(line, replacedFunc + afterCall);
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
    const KEYWORDS = ["__FILE__", "__LINE__", "__EXPAND__", "STRINGOF"];
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
                i++;
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
                            case "__EXPAND__":
                            {
                                //Find first {
                                let u = i;
                                while(u < src.length && src[u++] != '{');
                                let startExpansion = u;
                                let brackCount = 1;
                                while(brackCount != 0)
                                {
                                    if(isCharStringDefiner(src[u]))
                                    {
                                        let def = src[u];
                                        u++;
                                        while(u < src.length && src[u] != def)
                                        {
                                            if(src[u] == '\\')
                                                u++;
                                            u++;
                                        }
                                    }
                                    else if(src[u] == '{')
                                        brackCount++;
                                    else if(src[u] == '}')
                                        brackCount--;
                                    u++;
                                }
                                console.log(
                                    "__EXPAND__(" +filename+":"+line+")->\n\t"+src.substring(startExpansion, u)
                                );
                                src = src.substring(0, i) + src.substring(u);
                                i = u;
                                break;
                            }
                            case "STRINGOF":
                            {
                                //Find the matching paren close
                                let parenIndex = src.indexOf("(", i);
                                if(parenIndex == -1)
                                    throw new Error("Could not find STRINGOF (");
                                let closeParenIndex = indexOfStringClosing(src, '(', ')', parenIndex);
                                if(closeParenIndex == -1)
                                    throw new Error("Could not find STRINGOF )");

                                src = src.substring(0, i) +
                                    '"' + src.substring(parenIndex+1,  closeParenIndex) +  '"' +
                                    src.substring(closeParenIndex+1);

                                i = closeParenIndex - "STRINGOF".length;

                                break;
                            }
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
    let filename = this.resourcePath;
    //Ignore type definition files in case they weren't excluded. Some errors may occur.
    if(filename.endsWith(".d.ts"))
        return source;

    source = getDefineFunctions(source);
    source = replaceUsages(source);

    if(process.platform == "win32")
        filename = replaceAll(filename, "\\", "\\\\");

    return replaceKeywords(source, filename);
}
