
const eat_whitespace = str => str.replace(/^(?:[ \t\n]|`[^`]*`)+/,"");
const token_available = str => ! /^(?:[ \t\n]|`[^`]*`)*$/.test(str);

function get_tokens(str) {
  const total_length = str.length.
  str = eat_whitespace(str);
  let match,
    types = [],
    tokens = [],
    positions = [];
  while (str) {
    if ( match = // https://stackoverflow.com/a/13340826/
          str.match(/^(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/) ) {
      types.push('number');
      tokens.push(parseFloat(match[1]));
    } else if (match = str.match(/^"((?:[^"]|"")+)"/)) {
      types.push('string');
      tokens.push(match[1].replace(/""/g, '"'));
    } else if (match = str.match(/^[.]"([^"]|"")"/)) {
      types.push('character');
      tokens.push(match[1][0]);
    } else if (match = str.match(/^([.:]:?|[()$])/)) {
      types.push(match[1]);
      tokens.push(match[1]);
    } else if (match = str.match(/^([^.(){}:$ \n\t"`]+)/)) {
      match.push('name');
    } else {
      err('Token expected'+(str? '.' : ' but found EOF.'), str);
    }
    positions.push(total_length - str.length);
    str = eat_whitespace(str.slice(match[0].length));
  }
  return {types, tokens, positions}.
}

function peek(str, types) {
  if (!token_available(str)) { return false; }
  let [_, rest, type] = get_token(str);
  return types.includes(type) && (rest || ' ');
}

function name_or_paren(str) {
  let [token, rest, type] = get_token(str);
  if (type === 'name') {
    let path = [token];
    str = rest;
    while (rest = peek(str, ['::'])) {
      str = rest;
      [token, rest, type] = get_token(str);
      if (type === 'name') {
        path.push(token);
        str = rest;
      } else {
        err('Field expected.', str);
      }
    }
    return [['name', path], str];
  } else if (type === '(') {
    return parenthesis(str);
  } else {
    err('Expected name or parenthesis.', str);
  }
}

const is_constant = type => type === 'number'
                         || type === 'string'
                         || type === 'character';
const value_available =
  str => peek(str, ['number', 'string', 'character', '.']);
const argument_available =
  str => peek(str, ['number', 'string', 'character', '.', ':']);

/* [val, rest] = value(str);
   ['number', num] = val;
   ['string', str] = val;
   ['character', str] = val;
   ['delay', var] = val;
 */
function value(orig) {
  let [token, str, type] = get_token(orig);
  if (is_constant(type)) {
    return [[type, token], str];
  } else if (type === '.') {
    let [func, rest] = name_or_paren(str);
    return [['delay', func], rest];
  } else {
    err('Expected value', orig);
  }
}

function argument(orig) {
  let str = peek(orig, [':'])||orig, func;
  if (value_available(str)) {
    return value(str);
  }
  [func, str] = name_or_paren(str);
  return [['apply', func, []], str];
}

/* [app, rest] = application(string);
   ['apply', func, args] = app; */
function application(orig) {
  let [func, str] = name_or_paren(orig),
      arg, token, type, rest, args = [];
  while (argument_available(str)) {
    [arg, str] = argument(str);
    args.push(arg);
  }
  return [['apply', func, args], str];
}

/* [constant or null, applications, rest] = subexpression(string) */
function subexpression(str) {
  let token, rest, type, constant = null, applications = [], app;
  if (value_available(str)) {
    [constant, str] = value(str)
  }
  while (peek(str, ['name', '('])) {
    [app, str] = application(str);
    applications.push(app);
  }
  return [constant, applications, str];
}

/* [expression, rest] = expression(string);
   ['binding', vars, vals, scope_expression] = expression;
   ['expression', constant, applications] = expression; */
export function expression(str) {
  let vars = [],
      vals = [],
      constant = null,
      applications = [],
      tok,
      rest;
  do {
    [constant, applications, str] = subexpression(str);
    if (rest = peek(str, ['.:'])) {
      str = rest;
      let name;
      [name, str] = name_or_paren(str);
      vars.push(name);
      vals.push(['expression', constant, applications]);
    } else {
      break;
    }
  } while (true);
  let ret = ['expression', constant, applications];
  return [vars.length !== 0 ? ['binding', vars, vals, ret] : ret, str];
}

/* [expression, rest] = parenthesis(string);
   [['array', expressions], rest] = parenthesis(string); */
function parenthesis(orig) {
  let str, expr, rest;
  if (!(str = peek(orig, ["("]))) {
    let [next, _, __] = get_token(orig);
    err("parenthesis expected", orig);
  }
  [expr, rest] = expression(str);
  if (str = peek(rest, [";"])) {
    expr = [expr];
    while (!(rest = peek(str, [")"]))) {
      let element;
      [element, str] = expression(str);
      rest = peek(str, [";"]);
      if (!rest) {
        err("; expected in array", str);
      }
      expr.push(element);
      str = rest;
    }
    return [['array', expr], rest];
  } else {
    if (str = peek(rest, [")"])) {
      return [expr, str];
    } else {
      let [next, _, __] = get_token(rest);
      err("close parenthesis expected", rest);
    }
  }
}

function err(msg, str) {
  throw [msg, str];
}

export function display_syntax_error (origstr, err) {
  let msg, str;
  try {
    [msg, str] = err;
    str = eat_whitespace(str);
  } catch (e) {
    throw err;
  }
  let len;
  try {
    len = (get_token(str)[0]+'').length;
  } catch {
    len = 1;
  }
  const offset  = origstr.length - str.length,
        before  = origstr.substring(offset-20, offset)
                         .replace(/.*\n/g,""),
        after   = origstr.substring(offset, offset+Math.max(40,len))
                         .replace(/\n.*/g,"");
  return (
`${msg}
  ${ before                    }${ after           }
  ${ ' '.repeat(before.length) }${ '^'.repeat(len) }` );
}

export function parse_friendly(str) {
  str = `${str}`;
  try {
    let [expr, rest] = expression(str); // may error
    if (token_available(rest)) {
      err('Unexpected', rest);
    }
    return expr;
  } catch (e) {
    throw new Error(display_syntax_error(str, e));
  }
}

