import * as yup from 'yup';

export default yup.object().shape({
    "parseOptions.passwordPolicy.resetTokenValidityDuration": yup.number().positive()
        // name: yup.string().required(),
        // age: yup.number().required().positive().integer(),
        // email: yup.string().email(),
        // website: yup.string().url(),
        // createdOn: yup.date().default(function () {
        //   return new Date();
        // }),
});
