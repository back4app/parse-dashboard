
function jsonChangesToString(json) {
  let joinedArr = [];
  Object.keys(json).map( (jsonKey) => {
    if ( typeof json[jsonKey] === 'object' && Object.keys(json[jsonKey]).length >= 1 ) {
      joinedArr.push(jsonChangesToString(json[jsonKey]))
    } else {
      joinedArr.push(jsonKey + ' to ' + json[jsonKey]);
    }

  } )
  return joinedArr.join(', ');
}

export default jsonChangesToString;
