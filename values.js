/*

  Nib               Js

  array<any>        Array
  array<number>     typed Array
  array<character>  String
  pair              Pair
  char              Char

*/

class Pair { // subject to change: may not be a class eventually
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
}
export const pair = (a,b)=>new Pair(a,b), p_a = p=>p.a, p_b = p=>p.b;

class Char {
  constructor(s) {
    this.s = s;
  }
}
export const char = s=>new Char(s), c_s = c=>c.s;

const is_iterable = v => Symbol.iterator in Object(v); // so/a/53106917/
export function type_string(v) {
  if (is_iterable(v)) {
    return "array";
  } else if (v instanceof Pair) {
    return "pair";
  } else if (v instanceof Char) {
    return "character";
  } else if (typeof v === "bigint") {
    return "integer";
  } else if (typeof v === "number") {
    return "number";
  }
}

