
export const replaceSettingsInJson = ( jsonToUpdate, key ) => {
  let updatedJson = {};
  if ( jsonToUpdate ) {
    let json = typeof accountLockout === 'string' ? JSON.parse(jsonToUpdate) : jsonToUpdate;
    if ( key in json ) {
      delete json[key];
    }
    updatedJson = json;
  }

  return updatedJson;
}

export const getSettingsFromKey = ( json, key ) => {
  return json && key in json ? json[key] : undefined;
}

export const validateSettingsFloatMinMax = ( value, min, max ) => {
  try {
    const parsedValue = parseFloat(value);
    if ( parsedValue <= min || parsedValue > max ) {
      return false;
    }
  }
  catch(e) {
    console.error(e);
    return false;
  }
}
