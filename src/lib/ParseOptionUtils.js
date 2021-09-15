
export const getSettingsFromKey = ( json, key ) => {
  return json && key in json ? json[key] : undefined;
}

export const convertStringToInt = ( value ) => {
  if ( typeof value === 'string' ) {
    if ( isNaN(value) ) return;
    return parseInt(value);
  }
}
