
function jsonChangesToString(json, initialValue) {
  if ( !json ) return '';
  let joinedArr = [];
  Object.keys(json).map( (jsonKey) => {
    if ( typeof json[jsonKey] === 'object' && Object.keys(json[jsonKey]).length >= 1 ) {
      joinedArr.push(jsonChangesToString(json[jsonKey]))
    } else {
      if ( initialValue[jsonKey] !== json[jsonKey] ) {
        joinedArr.push(jsonKey + ' to ' + json[jsonKey]);
      }
    }

  } )
  return joinedArr.join(', ');
}

export default jsonChangesToString;
