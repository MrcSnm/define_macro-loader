DEFINE(GetRef, (v) =>
{
    return {
        get(){return v;},
        set(val){return v = val;}
    }
});

let globalOpt = 500;

let globalRef = GetRef(globalOpt);

globalRef.set(200);

console.log(globalRef.get());


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
    return __filename.substring(__filename.lastIndexOf("/")+1, __filename.lastIndexOf("."));
});





class Test
{
    _TO_STRING(Test)
}

let i = 0;

Increment(i);

console.log(Increment(i)); //1


let hello = "hello";
let world = "world";

_SWAP(hello, world);

console.log(hello, " ", world);
console.log(_FILENAME_NO_EXT(),
"OPA"
);