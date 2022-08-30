var { randomBytes } = require('crypto');
const token = randomBytes(64).toString('hex');

console.log(token.trim());