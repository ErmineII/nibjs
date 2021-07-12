
function err(msg, str) {
  throw new Error(msg);
  // consider using the string to gather debug information
}

const eat_whitespace = str => str.replace(/^(?:[ \t\n]|`[^`]*`)+/,"");
const token_available = str => ! /^(?:[ \t\n]|`[^`]*`)*$/.test(str);

/* [token, rest, type] = next_token(original); */
function next_token(str) {
  str = eat_whitespace(str);
  let match;
  if ( match = // https://stackoverflow.com/a/13340826/
        str.match(/^(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)(.*)/) ) {
    match[1] = parseFloat(match[1]);
    match.push('number');
  } else if (match = str.match(/^("(?:[^"]|"")+")(.*)/)) {
    match.push('string');
  } else if (match = str.match(/^(\$:|[():;$])(.*)/)) {
    match.push(match[1]);
  } else if (match = str.match(/^([^$(){}:; \n\t"`]+)(.*)/)) {
    match.push('name');
  } else {
    err( 'Invalid character sequence: '
       + str.replace(/^([^ \t\n]{1,20})(.*)/, "$1..."), str);
  }
  return match.slice(1); // omit the entire string matched
}

function peek(str, types) {
  if (!token_available(str)) { return false; }
  let [_, rest, type] = next_token(str);
  return types.includes(type) && (rest || ' ');
}

function parse_name_or_paren(str) {
  let [token, rest, type] = next_token(str);
  if (type === 'name') {
     return [['name', token], rest];
  } else if (type === '(') {
     return parse_parenthesis(str);
  } else {
    err('Expected name or parenthesis but got '+token, str);
  }
}

const is_constant = type => type === 'number' || type === 'string';
const value_available = str => peek(str, ['number', 'string', '$']);

/* [val, rest] = parse_value(str);
   ['number', num] = val;
   ['string', str] = val;
   ['delay', var] = val;
 */
function parse_value(orig) {
  let [token, str, type] = next_token(orig);
  if (is_constant(type)) {
    return [[type, token], str];
  } else if (type === '$') {
    let [func, rest] = parse_name_or_paren(str);
    return [['delay', func], rest];
  } else {
    err('Expected value but got '+token, orig);
  }
}

/* [app, rest] = parse_application(string);
   ['monadic', func] = app;
   ['dyadic', func, arg] = app; */
function parse_application(orig) {
  let [func, str] = parse_name_or_paren(orig),
      argument, token, type, rest;
  while (value_available(str)) {
    [argument, str] = parse_value(str);
    func = ['partial', func, argument];
  }
  if ( rest = peek(str, [':']) ) {
    str = rest;
    if (value_available(str)) {
      [argument, str] = parse_value(str)
    } else {
      [argument, str] = parse_application(str);
    }
    return [['dyadic', func, argument], str];
  } else {
    return [['monadic', func], str];
  }
}

/* [constant or null, applications, rest] = parse_subexpression(string) */
function parse_subexpression(str) {
  let token, rest, type, constant = null, applications = [], app;
  if (value_available(str)) {
    [constant, str] = parse_value(str)
  }
  while (peek(str, ['name', '('])) {
    [app, str] = parse_application(str);
    applications.push(app);
  }
  return [constant, applications, str];
}

/* [expression, rest] = parse_expression(string);
   ['expression', vars, vals, constant, applications] = expression; */
export function parse_expression(str) {
  let vars = [],
      vals = [],
      constant = null,
      applications = [],
      tok,
      rest;
  do {
    [constant, applications, str] = parse_subexpression(str);
    if (rest = peek(str, ['$:'])) {
      str = rest;
      let name;
      [name, str] = parse_name_or_paren(str);
      vars.push(name);
      vals.push([constant, applications]);
    } else {
      break;
    }
  } while (true);
  return [['expression', vars, vals, constant, applications], str];
}

/* [['parenthesis', expression], rest] = parse_parenthesis(string);
   [['array', expressions], rest] = parse_parenthesis(string); */
function parse_parenthesis(orig) {
  let str, expr, rest;
  if (!(str = peek(orig, ["("]))) {
    let [next, _, __] = next_token(orig);
    err("parenthesis expected, got "+next, orig);
  }
  [expr, rest] = parse_expression(str);
  if (str = peek(rest, [";"])) {
    expr = [expr];
    while (!(rest = peek(str, [")"]))) {
      let element;
      [element, str] = parse_expression(str);
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
      return [['parenthesis', expr], str];
    } else {
      let [next, _, __] = next_token(rest);
      err("close parenthesis expected, got "+next, rest);
    }
  }
}

