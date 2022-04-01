import * as yup from 'yup';

export default yup.object({
    appName: yup.string().min(0).max(255),
    collaborators: yup.array(),
    parseOptions: yup.object({
        passwordPolicy: yup.object({
            resetTokenValidityDuration: yup.number().positive(),
            validatorPattern: yup.string().trim().max(1000).min(3),
            validationError: yup.string().trim().max(1000).min(1),
            maxPasswordAge: yup.number().integer().min(0),
            maxPasswordHistory: yup.number().integer().min(0).max(20)
        }),
        accountLockout: yup.object({
            duration: yup.number().positive().max(100000),
            threshold: yup.number().positive().max(1000)
        })
    })
});
