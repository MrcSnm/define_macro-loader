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

let i = 0;

Increment(i);
console.log(Increment(i)); //1