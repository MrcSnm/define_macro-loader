# define_macro-loader
Provides a C-like macro functions for javascript/typescript

This is a webpack loader, which uses saves macro definitions. Definitions are always imported from file to file.

To add to your config, simply:

`{ test: /\.tsx?$/, use: [{ loader: path.resolve('../define_macro-loader.js')}]}`

For applying it in your code, just call the following:

```ts
DEFINE(GetRef, (v) =>
{
    return {
        get(){return v;},
        set(val){return v = val;}
    }
});
```

You can notice that it is quite strange at first time. Because we're setting the v, which should be the copied value.

That happens because this is not the copied value, it is the actual value passed to the function, so, any change to the "v" argument would change the argument passed to the function, then, we would be able to create
functions that would not copy the value.

After the `DEFINE` call, you will be able to call your variable defined, in that case `GetRef`.

```ts
let myGlobalNumber = 500;

let globalRef = GetRef(myGlobalNumber);
globalRef.set(globalRef.get() + 200);
console.log(myGlobalNumber); //Prints 700
```

It is smart enough to replace any call of the "return" with a simply replace in place.
The code output would be:

```ts
let globalRef = {get(){return myGlobalNumber;}, set(v){return myGlobalNumber = v;}};
```

So it is pretty much a simple copy and paste of any code snippet, allowing working with variable references inside javascript/typescript.

Some other simple examples:

```ts
DEFINE(Increment, (v) =>
{
    return v++;
})
let i = 0;

Increment(i);
console.log(Increment(i)); //1
console.log(i); //2

```

## REMINDER
-   You can't use the macros defined elsewhere in your first file. If you wish to use it, you will need to
make one level of indirection to use them, e.g: index.ts requires "macro", and then, your app.ts will be able
to use the macros defined inside macros.ts
-   It will create a new scope for inserting any operation if you do any kind of variable manipulation
-   Open for pull requests.

## RECOMMENDED PLUGINS FOR INTERWORK

-   [Babel Preval Plugin](https://www.npmjs.com/package/babel-plugin-preval), why: You can create macros that can take an filename and pre evaluate it in compile time. The preval becomes much more useful with macros, check its use case on the macro _FILENAME_NO_EXT. If you check the output, you will see how much faster it is.
-   [Typescript Nameof Plugin](https://www.npmjs.com/package/babel-plugin-ts-nameof), why: You can save your variable names as a string. This plugin is really empowered by the macro, as you get variables by reference and not value, so, the name is not lost.



### Get the keyword typings:
```ts
//Macro Keywords
declare function DEFINE(varName : any, f : Function) : void;
declare const __LINE__   : number;
declare const __FILE__   : string;
declare const __EXPAND__ : void;
declare function STRINGOF(expr : any) : string;
```


## CHANGE-LOG

#### v1.3.1 - v1.3.4
- Fixed parsing error for operators where it would exclude the next letter.
- Fixed missing operators & and |. Fixed STRINGOF
- Now able to use multiple arguments together with a `return` statement.
- Fixed not being able to get object properties on parameters and fixed to accept operators containing more than one character (==, +=, etc);

### v1.3.0
- Added STRINGOF keyword, it basically adds " between the argument passed, making it able to do some better debugging, assertion on the passed argument:

```js
DEFINE(assertion, (expr, msg) =>
{
    if(!(expr))
        console.error("Assertion for "+ STRINGOF(expr) + " failed: " + msg)
});
```
As a test, you can get the following call: `assertion(5 + 2 > 10, "")` will log `Assertion for 5 + 2 > 10 failed: `;
Notice that when you need to negate the expression, the parents ARE necessary.

#### v1.2.1 - v1.2.10

- Added \__EXPAND__ keyword, it logs during the build the code wrapped between `__EXPAND__`, (code is removed, debug only feature):
```js
__EXPAND__
{
    console.log(lazy("Hello Lazy"));
}
```
- Fixed arguments parsing, now accepts returning a lambda from the macro
- Now accepts empty string like "", `` and ''
- Ignoring .d.ts files as some bugs may occur
- Added \__LINE__ and \__FILE__ keywords for usage in this macro without requiring other packages (which could depend on Babel)
- Accepts no argument macro
- Minor bug fix when jumping lines and calling no arg macros
- Minor bug fix when having more than one argument and jumping lines
- Showing how the flow for complex apps work.
- Now it accepts strings with commas inside

### v1.2.0

- Now the macro is accepting more than one variable. With that, we get the possibility to:

```ts
DEFINE(_SWAP, (a, b) =>
{
    let temp = a;
    a = b;
    b = temp;
});
```
Yea, with the new macros, we get the possibility to make an in-place swap.


### v1.1.0

- Now it is possible to define functions inside DEFINE. For instance:

```ts
DEFINE(_TO_STRING, (v) =>
{
    toString(){return nameof(v);}
});

class Test
{
    _TO_STRING(Test)
}
```

With that, Test will earn the method toString(), which will return "Test".