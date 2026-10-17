const bcrypt = require("bcryptjs");

const password = "123456";

async function hashPassword(plainPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    return hashedPassword;
}

async function comparePasswords(plainPassword, hashedPassword) {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
}

module.exports = {
    hashPassword,
    comparePasswords,
};