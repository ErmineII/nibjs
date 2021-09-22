
import * as Type from "./type.js";
import { pair, char, p_a, p_b, c_s } from "./values.js";
export const types   = Object.create(null);
export const library = Object.create(null);

const declare = name => type => val => {
  types[''+name] = Type.parse(''+type);
  library[''+name] = val;
}

declare `+` `(Num * Num)>Num` ( a => p_a(a) + p_b(a) );
declare `inc` `Num>Num` ( a => a+1);


