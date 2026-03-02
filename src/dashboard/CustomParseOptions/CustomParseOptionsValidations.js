import * as yup from 'yup';

const integer = yup.number()
  .typeError('is required.')
  .integer('must be a valid integer.');

const optionalUrl = yup.string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .test('is-valid-url', 'must be a valid URL (e.g. https://example.com).', (value) => {
    if (!value) {return true;}
    try {
      const url = new URL(value);
      if (!/^https?:$/.test(url.protocol)) {return false;}
      if (url.hostname.includes('_')) {return false;}
      return url.hostname.includes('.');
    } catch {
      return false;
    }
  });

const isValidRegexPattern = (value) => {
  if (!value) {return true;}
  const pattern = value.trim();
  if (!pattern) {return true;}

  try {
    // Support /pattern/flags syntax.
    const slashRegexMatch = pattern.match(/^\/([\s\S]*)\/([a-z]*)$/i);
    if (slashRegexMatch) {
      const [, source, flags] = slashRegexMatch;
      new RegExp(source, flags);
      return true;
    }

    // Also support plain pattern syntax without delimiters.
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
};

export default yup.object({
  customOptions: yup.object({
    passwordPolicy: yup.object({
      resetTokenValidityDuration: integer.positive('must be greater than 0.'),
      validatorPattern: yup.string()
        .trim()
        .max(1000, 'must be 1000 characters or less.')
        .min(3, 'must be at least 3 characters.')
        .test('valid-regex-pattern', 'must be a valid regular expression.', isValidRegexPattern),
      validationError: yup.string().trim().max(1000, 'must be 1000 characters or less.').min(1, 'must be at least 1 character.'),
      maxPasswordAge: integer.min(0, 'must be 0 or greater.'),
      maxPasswordHistory: integer.min(0, 'must be 0 or greater.').max(20, 'must be 20 or less.'),
    }),
    accountLockout: yup.object({
      duration: integer.positive('must be greater than 0.').max(99999, 'must be 100000 or less.'),
      threshold: integer.min(1, 'must be at least 1.').max(999, 'must be 999 or less.'),
    }),
    maxUploadSize: integer.min(20, 'must be at least 20.').max(100, 'must be 100 or less.'),
    sessionLength: integer.min(0, 'must be 0 or greater.'),
    emailVerifyTokenValidityDuration: integer.positive('must be greater than 0.'),
    enableSingleSchemaCache: yup.boolean(),
    objectIdSize: integer.positive('must be greater than 0.'),
    publicServerURL: optionalUrl,
    databaseURI: yup.string().trim(),
    choosePassword: optionalUrl,
    verifyEmailSuccess: optionalUrl,
    parseFrameURL: optionalUrl,
    passwordResetSuccess: optionalUrl,
    invalidLink: optionalUrl,
    invalidVerificationLink: optionalUrl,
    linkSendSuccess: optionalUrl,
    linkSendFail: optionalUrl,
  }),
});
