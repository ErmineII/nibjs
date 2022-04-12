/*

  Nib               Js

  array<any>        Array
  array<number>     typed Array
  array<character>  String
  pair              Pair
  char              Char

*/

const is_tuple_symbol = Symbol("tuple?");
export const mktuple = (...a) => { a[is_tuple_symbol] = true; return a };
export const mkpair = (a, b) => mktuple(a, b);

export const is_pair = (obj) => obj[is_tuple_symbol];
export const pair_l = (pair) => pair[0];
export const pair_r = (pair) => {
  if (pair.length > 2) {
    const array = pair.slice(1);
    array[is_tuple_symbol] = true;
    return array;
  } else {
    return pair[1];
  }
}

class Char {
  constructor(s) {
    this.s = s;
  }
}
export const mkchar = s=>new Char(s), char_string = c=>c.s;

const is_iterable = v => Symbol.iterator in Object(v); // so/a/53106917/
export function type_string(v) {
  if (is_pair(v)) {
    return "pair";
  } else if (is_iterable(v)) {
    return "array";
  } else if (v instanceof Char) {
    return "character";
  } else if (typeof v === "bigint") {
    return "integer";
  } else if (typeof v === "number") {
    return "number";
  }
}
