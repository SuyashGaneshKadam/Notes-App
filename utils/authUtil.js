const userDataValidation = ({ username, password }) => {
  return new Promise((resolve, reject) => {
    if (!username.trim() || !password)
      reject("Missing credentials".trim());

    if (typeof username !== "string") reject("Email is not a text");
    if (typeof password !== "string") reject("Password is not a text");

    if (username.length <= 2 || username.length > 20)
      reject("Username length should be 3-20 characters");

    if (password.length <= 2 || password.length > 20)
      reject("Password length should be 3-20 characters");

    resolve();
  });
};

module.exports = { userDataValidation };