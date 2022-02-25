//Macro Keywords
declare var DEFINE : (varName : any, f : Function) => void;
declare const __LINE__   : number;
declare const __FILE__   : string;
declare const __EXPAND__ : void;
declare function STRINGOF(expr : any) : string;

//Macros
declare function GetRef<T>(v : T) : {get: () => T, set : (v : T) => T}
declare function assertion(expr : boolean,  message : string) : void;
declare function _STR_ARG_TEST(str:string, str2 : string, str3 : string) : void;
declare function _TO_STRING(varName : any) : void;
declare function _SWAP<T>(a:T, b:T) : void;
declare function _FILENAME_NO_EXT() : string;
declare function lazy<T>(v : T): () => T;
declare function identity<T>(v : T) : T;
declare function SMARTLOG(v : any) : void;
declare var Increment : (v : any) => any;

//External
declare var preval : (str:TemplateStringsArray) => any;