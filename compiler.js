import { pair, char, p_a, p_b, c_s } from "./values.js";

/* AST format

   Program = binding
   binding = ['binding', [function...], [expression...], expression];
   expression = ['expression',
                 initial value or null,
                 [function application...]];
   value = ['number', number],
           ['string', string],
           ['character', string],
           ['delay', function];
   function application = ['apply', function, [argument...]];
   function = ['name', name],
              ['array', [expression...]].
              expression;
   argument = value, ['apply', function, []];

*/

class CodeBuilder {
  constructor(locals, globals) {
    this.instructions = [];
    this.globals = globals;
    this.lovals = locals;
  }
  instr(cmd, ops = []) { // called like this.instr`cmd ${op} ${op}`
    cmd = cmd[0].trim();
    this.instructions.push([cmd, ops]); // TODO: find a better format
  }
  compile(expr) {
    switch(expr[0]) {
    case "character":
      expr[1] = char(expr[1]); // fallthrough
    case "number":
    case "string":
      this.instr`push ${expr[1]}`
      break;
    }
    // TODO...
  }
}

