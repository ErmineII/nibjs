
import * as Type from "./type.js";
export const types   = new Map();
export const library = new Map();

const declare = name => type => val => {
  types.set(name+'', Type.parse(type+''));
  library.set(name+'', val);
}

