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

DEFINE(identity, (v) =>
{
    return v;
});

DEFINE(lazy, (v) =>
{
    return (()=>v)
});

DEFINE(SMARTLOG, (v) =>
{
    console.log(v, " at "+__FILE__+":"+__LINE__);
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


DEFINE(_STR_ARG_TEST, (v, v2, v3) =>
{
    console.log(v + v2 + v3);
});

require("./index")