export default ( errors, field ) => 
    errors.find( error => error.startsWith(field) )?.replace(field, '');
