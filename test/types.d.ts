
declare var GetRef : (v : any) => {get: () => any, set : (v : any) => any}
declare var DEFINE : (varName : any, f : Function) => void;
declare function _TO_STRING(varName : any) : void;
declare function _SWAP<T>(a:T, b:T) : void;
declare var Increment : (v : any) => any;