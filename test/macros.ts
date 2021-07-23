DEFINE(GetRef, (v) =>
{
    return {
        get(){return v;},
        set(val){return v = val;}
    }
});

DEFINE(Increment, (v) =>
{
    return v++;
});

DEFINE(_TO_STRING, (v) =>
{
    toString(){return nameof(v);}
});

DEFINE(_SWAP, (a, b) =>
{
    let temp = a;
    a = b;
    b = temp;
});


DEFINE(_FILENAME_NO_EXT, () =>
{
    return preval`module.exports =__filename.substring(__filename.lastIndexOf("/")+1, __filename.lastIndexOf("."))`;
});

require("./index")