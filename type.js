/* type = ['function', type, type]
        | ['array', type]
        | ['pair', type, type]
        | 'Null' | 'Bool' | 'Int' | 'Float' | 'Char' | 'Any'
        | variable;
   variable is a number
 */

function parse_(str) {
  str = str.replace(/ /g, "");
  let match, ret = null;
  if (match = str.match(/^(Num|Bool|Int|Float|Char|Any|\$[a-z]+)/)) {
    match = match[0];
    str = str.substring(match.length);
    if (match[0] === "$") {
      ret = 0;
      match .substring(1)
            .split("")
            .forEach(c => {
              ret *= 27;
              ret += c.charCodeAt() - 96;
            });
    } else {
      ret = match;
    }
  } else if (str[0] === "(") {
    [ret, str] = parse_(str.substring(1));
    if (str[0] === ")") {
      str = str.substring(1);
    } else {
      throw new Error("unclosed parenthesis in type string");
    }
  }
  if (ret === null) {
    throw new Error("type expected in type string");
  }
  while (str[0] === "#") {
    str = str.substring(1);
    ret = ['array', ret];
  }
  if (str.match(/^[*>]/)) {
    let other;
    match = str[0];
    [other, str] = parse_(str.substring(1));
    if (match === "*") {
      ret = ['pair', ret, other];
    } else {
      ret = ['function', ret, other];
    }
  }
  return [ret, str];
}

export function parse(str) {
  let [ret, rest] = parse_(str);
  if (rest) {
    throw new Error("Unexpected "+str[0]+" in type string");
  }
  return ret;
}

