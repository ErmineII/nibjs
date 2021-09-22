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
   name = [string, string...];
   argument = value, ['apply', function, []];

*/

export class CodeBuilder {
  static argSym = Symbol("argument");
  constructor(stack, globals) {
    this.instructions = [];
    // Object with keys of strings and nib values as values
    this.globals = globals;
    // array of names placed where they would be on the stack
    this.stack = stack;

    this.stack.push(CodeBuilder.argSym);
  }
  instr(cmd, ops = []) { // called like this.instr`cmd ${op} ${op}`
    cmd = cmd[0].trim();
    this.instructions.push([cmd, ops]); // TODO: find a better format
    switch(cmd) {
    case "push":
    case "copy":
      this.stack.push(null);
      break;
    case "pair":
      this.stack.pop();
      this.stack.pop();
      this.stack.push(null);
      break;
    case "makearray":
      this.stack = this.stack.slice(0, a.length - ops[0]);
      this.stack.push(null);
      break;
    }
  }
  compile(expr) {
    switch(expr[0]) {
    case "character":
      expr[1] = char(expr[1]); // fallthrough
    case "number":
    case "string":
      this.instr`push ${expr[1]}`;
      break;
    case "name":
      let indx = this.stack.lastIndexOf(expr[1][0]);
      if (indx === -1) {
        let val = this.globals;
        expr[1].forEach(name => val = val[name]);
        if (val === undefined) {throw new Error();}
        this.instr`push ${val}`;
      } else {
        this.instr`copy ${indx}`;
        expr[1].slice(1).forEach(subPath => this.instr`field ${subPath}`);
      }
      break;
    case "delay":
      if (expr[1][0] === "name") {
        this.compile(expr[1]);
      } else { // anonymous function
        let newfunc = new CodeBuilder(this.stack, this.globals);
        newfunc.compile(expr[1]);
        this.instr`push ${newfunc.toValue()}`
      }
      break;
    case "array":
      array[1].forEach(expr => this.compile(expr));
      this.instr`makearray ${array[1].length}`;
      break;
    case "apply":
      expr[2].forEach(argument=>{
        if (argument[0] === "apply") {
          this.compile(["name", [CodeBuilder.argSym]]);
        }
        this.compile(argument);
        this.instr`pair`;
      });
      this.compile(expr[1]);
      if (expr[1][0] === "name") {
        this.instr`apply`;
      }
      break;
    case "expression":
      if (expr[1] != null) {
        this.compile(expr[1]);
      }
      expr[2].forEach(application => this.compile(application));
    }
    // TODO...
  }
  // toValue() {}
    // Becomes a function that can be used from nib
    // The current plan is just to have this be a wrapper for the stack machine
    // instructions array.
  // toJsFunc() {}
  // toString() {}
}

