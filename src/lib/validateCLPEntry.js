import Parse from 'parse';

const pointerPrefix = "userField:";

export default function validateEntry(
  pointers,
  text,
  parseServerSupportsPointerPermissions
) {
  if (parseServerSupportsPointerPermissions) {
    let fieldName = text.startsWith(pointerPrefix)
      ? text.substring(pointerPrefix.length)
      : text;
    if (pointers.includes(fieldName)) {
      return Promise.resolve({ entry: fieldName, type: "pointer" });
    }
  }

  let userQuery;
  let roleQuery;

  if (text === "*") {
    return Promise.resolve({ entry: "*", type: "public" });
  }

  if (text.toLowerCase() === "requiresAuthentication") {
    return Promise.resolve({ entry: "requiresAuthentication", type: "auth" });
  }

  if (text.startsWith("user:")) {
    let user = text.substring(5);

    userQuery = new Parse.Query.or(
      new Parse.Query(Parse.User).equalTo("username", user),
      new Parse.Query(Parse.User).equalTo("objectId", user)
    );
    // no need to query roles
    roleQuery = {
      find: () => Promise.resolve([])
    };
  } else if (text.startsWith("role:")) {
    let role = text.substring(5);

    roleQuery = new Parse.Query.or(
      new Parse.Query(Parse.Role).equalTo("name", role),
      new Parse.Query(Parse.Role).equalTo("objectId", role)
    );
    // no need to query users
    userQuery = {
      find: () => Promise.resolve([])
    };
  } else {
    // query both
    userQuery = Parse.Query.or(
      new Parse.Query(Parse.User).equalTo("username", text),
      new Parse.Query(Parse.User).equalTo("objectId", text)
    );

    roleQuery = Parse.Query.or(
      new Parse.Query(Parse.Role).equalTo("name", text),
      new Parse.Query(Parse.Role).equalTo("objectId", text)
    );
  }

  return Promise.all([
    userQuery.find({ useMasterKey: true }),
    roleQuery.find({ useMasterKey: true })
  ]).then(([user, role]) => {
    if (user.length > 0) {
      return { entry: user[0], type: "user" };
    } else if (role.length > 0) {
      return { entry: role[0], type: "role" };
    } else {
      return Promise.reject();
    }
  });
}
