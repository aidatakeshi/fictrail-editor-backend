'use strict';
const { Model, DataTypes } = require('sequelize');
const bcrypt = require("bcrypt");
const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');

module.exports = (sequelize) => {

    class User extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_options = {
        modelName: 'User',
        tableName: 'users',
        timestamps: false,
        sequelize,
    };

    const model_attributes = {
        id_auto: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id: {
            type: DataTypes.STRING, unique: true, validate: {
                len: {
                    args: [[4, 255]],
                    msg: "Length Should be Between 4 and 255",
                },
            },
        },
        name: {
            type: DataTypes.STRING,
            get(){
                return this.getDataValue('name') || this.getDataValue('id');
            },
        },
        email: { type: DataTypes.STRING },
        password: {
            type: DataTypes.STRING,
            set(value){
                this.setDataValue('password', bcrypt.hashSync(value, 10));
            },
        },
        last_login_attempt: { type: DataTypes.BIGINT },
        is_root_user: { type: DataTypes.BOOLEAN },
        is_enabled: { type: DataTypes.BOOLEAN },
        created_at: { type: DataTypes.BIGINT },
        created_by: { type: DataTypes.BIGINT },
        is_deleted: { type: DataTypes.BOOLEAN },
    };

    User.init(model_attributes, model_options);

    /**
     * Fields Settings
     */
    User.hiddenFields = ['id_auto', 'password', 'last_login_attempt', 'is_deleted'];

    /**
     * Model Specific Methods
     */

    User.prototype.verifyPassword = function(passwordToVerify){
        return bcrypt.compareSync(passwordToVerify, this.getDataValue('password'));
    };

    User.prototype.generateBearerToken = function(){
        return jwt.sign({data: uuid() + uuid()}, process.env.LOGIN_TOKEN_SECRET);
    };
    
    //Return Model Class
    return User;

};