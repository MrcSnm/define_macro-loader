let globalOpt = 500;

let globalRef = GetRef(globalOpt);

globalRef.set(200);

console.log(globalRef.get());

SMARTLOG("I want to log but smartly");
SMARTLOG("");
SMARTLOG('');
SMARTLOG(``);

class Test
{
    _TO_STRING(Test)
}

__EXPAND__
{
    console.log(lazy("Expanded Lazy"));
}


console.log(lazy(5)());

let i = 0;

Increment(i);

console.log(Increment(i)); //1


let hello = "hello";
let world = "world";

_SWAP(hello, world);

_STR_ARG_TEST("bad, bad", hello, "woops");

console.log(hello, " ", world);
console.log(_FILENAME_NO_EXT(),
"w"
);