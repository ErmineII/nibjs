
export const eat_whitespace = str => str.replace(/^(?:[ \t\n]|`[^`]*`)+/,"");

export const token_available = str => eat_whitespace(str) === "";

/* [token, rest, type] = next_token(original) */
export function next_token(str) {
  str = eat_whitespace(str);
  let match;
  if ( match = // https://stackoverflow.com/a/13340826/
        str.match(/^(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)(.*)/) ) {
    match.push('number');
  } else if (match = str.match(/^("(?:[^"]|"")+")(.*)/)) {
    match.push('string');
  } else if (match = str.match(/^([(){}:;])(.*)/)) {
    match.push('symbol');
  } else if (match = str.match(/^([^(){}:; \n\t"`]+)(.*)/)) {
    match.push('name');
  } else {
    throw (new Error('Invalid character sequence: '+str));
  }
  return match.slice(1) // omit the entire string matched
}
