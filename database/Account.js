module.exports.Model = (sequelize,DataTypes) => {
    const user = sequelize.define("User",{
        name : {
            type : DataTypes.STRING,
            allowNull : false,
            unique: true
        },
        password : {
            type : DataTypes.STRING,
            allowNull : false
        },
        sex : {
            type : DataTypes.STRING,
            allowNull : false
        },
        age : {
            type : DataTypes.NUMBER,
            allowNull : false
        }
    });
    return user;
}