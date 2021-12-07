import * as yup from 'yup';

yup.object

export default yup.object({
    parseOptions: yup.object({
        passwordPolicy: yup.object({
            resetTokenValidityDuration: yup.number().positive(),
            validatorPattern: yup.string().max(1000).min(3),
            validationError: yup.string().max(1000).min(1),
            maxPasswordAge: yup.number().integer().min(0),
            maxPasswordHistory: yup.number().integer().min(0).max(20)
        }),
        accountLockout: yup.object({
            duration: yup.number().positive().max(100000),
            threshold: yup.number().positive().max(1000)
        })
    })
});
