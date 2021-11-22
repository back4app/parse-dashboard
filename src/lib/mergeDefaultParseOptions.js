export default function mergeDefaultParseOptions( parseOptions ) {
  return {
    passwordPolicy: {
      resetTokenValidityDuration: parseOptions?.passwordPolicy?.resetTokenValidityDuration || 24 * 60 * 60,
      resetTokenReuseIfValid: parseOptions?.passwordPolicy?.resetTokenReuseIfValid || false,
      validatorPattern: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/',
      validationError: 'Password must contain at least 1 digit.',
      doNotAllowUsername: false,
      maxPasswordAge: 90,
      maxPasswordHistory: 5,
      ...parseOptions.passwordPolicy
    },
    accountLockout: {
      duration: 5,
      threshold: 3,
      ...parseOptions.accountLockout
    },
    ...parseOptions
  };
}
