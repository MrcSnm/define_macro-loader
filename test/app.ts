let globalOpt = 500;

let globalRef = GetRef(globalOpt);

globalRef.set(200);

console.log(globalRef.get());

SMARTLOG("I want to log but smartly");
SMARTLOG("");
SMARTLOG('');
SMARTLOG(``);
_TEST("function()");

class Test
{
    _TO_STRING(Test)
}

// __EXPAND__
// {
//     console.log(lazy("Expanded Lazy"));
// }


console.log(lazy(5)());

let i = 0;

Increment(i);

console.log(Increment(i));


let hello = "hello";
let world = "world";

_SWAP(hello, world);

_STR_ARG_TEST("bad, bad", hello, "woops");

console.log(hello, " ", world);
console.log(_FILENAME_NO_EXT(),
"w"
);

const testObject = {
    a : 500
};

console.log(STRINGOF(1 + 5 > 3 + 6));

console.log(MULTI_ARG_RETURN_TEST(50, 100));

assertion(testObject.a == 501, "");

assertion(5 + 2 > 10, "OMG")

const arr = [1, 2, 3, 4, 5, 6];

for(let i = 0; i < arr.length; i++)
{
    //Adding 0 as it gives an error
    console.log(arrIndex(arr, i+0));
}

assertion(5 + 2 > 10 && 10 - 2 <  0, "Range error");
