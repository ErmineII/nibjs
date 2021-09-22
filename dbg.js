import * as Nib from "./nib.js";

globalThis.n = Nib;

[globalThis.t, globalThis.p, globalThis.l, globalThis.c] =
  [n.Type, n.Parse, n.Library, n.Compile];

globalThis.s = [ // samples
  "    a  ",
  "   -2 - a.2 0 .3 ",
  " } { +12 16 -> ",
  ' "asdf" "str_with_""s"'
];

