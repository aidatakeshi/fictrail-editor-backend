'use strict';
const { Model, DataTypes:dt } = require('sequelize');
const { validations } = require("./common");

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
        id_auto: { type: dt.BIGINT, autoIncrement: true, primaryKey: true },
        id: { type: dt.STRING, unique: true, validate: validations.string },
        name: {
            type: dt.TEXT, allowNull: true, validate: validations.name,
            get(){ return this.getDataValue('name') || this.getDataValue('id') },
        },
        email: { type: dt.TEXT, allowNull: true, validate: validations.email },
        new_password: { //Virtual Field
            type: dt.VIRTUAL, validate: validations.password,
            set(value){ this.setDataValue('password', bcrypt.hashSync(value, 10)) },
        },
        password: { type: dt.STRING, set(){} },
        last_login_attempt: { type: dt.BIGINT },
        is_root_user: { type: dt.BOOLEAN },
        is_enabled: { type: dt.BOOLEAN },
        //
        created_at: { type: dt.BIGINT },
        created_by: { type: dt.STRING },
        is_deleted: { type: dt.BOOLEAN },
    };

    User.init(model_attributes, model_options);

    /**
     * Fields Settings
     */
    User.hiddenFields = ['id_auto', 'password', 'new_password', 'last_login_attempt', 'is_deleted'];
    User.editableFieldsForMyself =      ['name', 'email'];
    User.editableFieldsByRootUser =     ['name', 'email', 'new_password', 'is_root_user', 'is_enabled'];

    /**
     * Model Specific Methods
     */
    User.prototype.getDisplayedObject = function(){
        let obj = this.toJSON();
        for (let field of User.hiddenFields) delete obj[field];
        return obj;
    };

    User.getFilteredParams = function(params, isMyself = true, isNew = false){
        let editableFields = isMyself ? User.editableFieldsForMyself : User.editableFieldsByRootUser;
        if (isNew) editableFields.push('id');
        let obj = {};
        for (let field of editableFields) if (params[field] !== undefined) obj[field] = params[field];
        return obj;
    }

    User.prototype.verifyPassword = function(passwordToVerify){
        return bcrypt.compareSync(passwordToVerify, this.getDataValue('password'));
    };

    User.prototype.generateBearerToken = function(){
        return jwt.sign({data: uuid() + uuid()}, process.env.LOGIN_TOKEN_SECRET);
    };
    
    //Return Model Class
    return User;

};