# define_macro-loader
Provides a C-like macro functions for javascript/typescript

This is a webpack loader, which uses saves macro definitions. Definitions are always imported from file to file.

To add to your config, simply:

{ test: /\.tsx?$/, use: [{ loader: path.resolve('../define_macro-loader.js')}]}

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
console.log(i); //1

```

REMINDER
It will create a new scope for inserting any operation if you do any kind of variable manipulation
Open for pull requests
