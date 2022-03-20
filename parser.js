// example state:
// str: ' `comment` "asdf" @: 0'
// type: [ "string", "name", ":", "number" ]
// value: [ "asdf", "@", ":", 0 ]
// position: [ 11, 18, 19, 21 ]
// tn: the index of the current token e.g. the ":" is at index 2

export class Parser {
  source_string;
  types = [];
  values = [];
  positions = [];
  tn = 0;

  constructor(str) { this.source_string = str; }
  static from_string = str => {
    const parser = new Parser(str);
    parser.init_from_string();
    return parser;
  }

  init_from_string() {
    let str = this.source_string;
    const eat_whitespace = str => str.replace(/^(?:[ \t\n]|`[^`]*`)+/,"");
    const add_token = (type, value) => {
      this.types.push(type);
      this.values.push(value);
    }
    const total_length = str.length;
    str = eat_whitespace(str);
    let match;
    while (str) {
      if ( match = // https://stackoverflow.com/a/13340826/
            str.match(/^(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/) ) {
        add_token('number', parseFloat(match[1]));
      } else if (match = str.match(/^"((?:[^"]|"")+)"/)) {
        add_token('string', match[1].replace(/""/g, '"'));
      } else if (match = str.match(/^[.]"([^"]|"")"/)) {
        add_token('character', match[1][0]);
      } else if (match = str.match(/^([.:]:?|[()$])/)) {
        add_token(match[1], match[1]);
      } else if (match = str.match(/^([^.(){}:$ \n\t"`]+)/)) {
        add_token('name', match[1]);
      } else {
        this.error('Token expected'+(str? '.' : ' but found EOF.'), str);
      }
      this.positions.push(total_length - str.length);
      str = eat_whitespace(str.slice(match[0].length));
    }
  }
  type(){ return this.types[this.tn]; }
  value(){ return this.values[this.tn]; }
  position(){ return this.positions[this.tn]; }

  advance() {
    this.tn++;
  }

  peek(...types) {
    return types.includes(this.type());
  }
  consume(type) {
    if (this.type() === type) {
      const val = this.value();
      this.advance();
      return val;
    } else {
      return null;
    }
  }
  consumed() { return this.values[this.tn-1]; }

  name_or_paren() {
    if (this.consume('name')) {
      let path = [this.consumed()];
      while (this.consume('::')) {
        if (this.consume('name')) {
          path.push(this.consumed());
        } else {
          this.error('Field expected.');
        }
      }
      return ['name', path];
    } else if (this.peek('(', '$')) {
      return this.parenthesis();
    } else {
      this.error('Expected name or parenthesis.');
    }
  }

  static constant_tokens = ['number', 'string', 'character'];
  parse_value() {
    if (this.peek(...Parser.constant_tokens)) {
      const ret = [this.type(), this.value()]
      this.advance();
      return ret;
    } else if (this.consume('.')) {
      return ['delay', name_or_paren()];
    } else {
      this.error('Expected value');
    }
  }

  argument() {
    if (this.consume(':')) {
      if (this.peek('name', '(', '$')) {
        return ['apply', this.name_or_paren()];
      }
    }
    return this.parse_value();
  }

  application() {
    let func = this.name_or_paren(), args = [];
    while (this.peek(':', ...Parser.constant_tokens)) {
      args.push(this.argument());
    }
    return ['apply', func, args];
  }

  subexpression() {
    let constant = null, applications = [], app;
    if (this.peek(...Parser.constant_tokens)) {
      constant = this.parse_value();
    }
    while (this.peek('name', '(', '$')) {
      applications.push(this.application());
    }
    return [constant, applications];
  }

  expression() {
    const vars = [], vals = [];
    let constant = null,
        applications = [];
    [constant, applications] = this.subexpression();
    while (this.consume('.:')) {
      if (!this.consume('name')) {
        this.error('target expected for assignment');
      }
      vars.push(this.consumed());
      vals.push(['expression', constant, applications]);
      [constant, applications] = this.subexpression();
    }
    const ret = ['expression', constant, applications];
    return vars.length !== 0 ? ['binding', vars, vals, ret] : ret;
  }

  parenthesis() {
    if (this.consume('(')) {
      const ret = this.expression();
      if (!this.consume(')')) {
        this.error('close parenthesis expected');
      }
      return ret;
    } else if (this.consume('$')) {
      return this.expression();
    } else {
      this.error('parenthesis expected');
    }
  }

  static ParseError = class ParseError {
    message;
    parser;
    constructor(m,p) {
      this.message = m;
      this.parser = p;
    }
    
    pretty() {
      const pos = this.position();
      // TODO
    }
  };
  error(message) {
    throw new Parser.ParseError(message, this);
  }
  
  parse() {
    const expression = this.expression();
    if (this.tn !== this.values.length) {
      this.error('Unexpected token');
    }
    return expression;
  }
}

export const parse = str => Parser.from_string(str).parse()
