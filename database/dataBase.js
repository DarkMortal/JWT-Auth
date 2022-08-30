const { Model } = require('./Account');
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database/database.sqlite3'
});
const userAccount = Model(sequelize,DataTypes);

// TODO: Test the Connection 
async function ConnectDB(){
    await sequelize.authenticate();
}

module.exports.DataModel = userAccount;