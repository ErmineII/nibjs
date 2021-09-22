import * as Nib from "./nib.js";

globalThis.n = Nib;

[globalThis.t, globalThis.p, globalThis.l, globalThis.c] =
  [n.Type, n.Parse, n.Library, n.Compile];

globalThis.comp = s => {
  globalThis.cb = new c.CodeBuilder([], l.library);
  cb.compile(p.parse_friendly(''+s));
  print(cb.instructions.map(i=>i.join(" ")).join("\n"));
}

