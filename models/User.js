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
        id: { type: dt.STRING, allowNull: false, unique: true, validate: validations.id },
        name: {
            type: dt.TEXT, allowNull: true, validate: validations.name,
            get(){ return this.getDataValue('name') || this.getDataValue('id') },
        },
        email: { type: dt.TEXT, allowNull: true, validate: validations.email },
        password: {
            type: dt.STRING, allowNull: false, validate: validations.password,
            set(value){
                if (value.length < 8 || value.length > 255){
                    this.setDataValue('password', null);
                }else{
                    this.setDataValue('password', bcrypt.hashSync(value, 10));
                }
            },
        },
        last_login_attempt: { type: dt.BIGINT },
        is_root_user: { type: dt.BOOLEAN },
        can_create_new_project: { type: dt.BOOLEAN },
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
    User.hiddenFields = ['id_auto', 'password', 'last_login_attempt', 'is_deleted'];
    User.uneditableFields = ['last_login_attempt'];
    User.uneditableFieldsForMyself = ['password', 'is_root_user', 'can_create_new_project', 'is_enabled'];

    /**
     * Model Specific Methods
     */
    User.prototype.getDisplayedObject = function(){
        let obj = this.toJSON();
        for (let field of User.hiddenFields) delete obj[field];
        return obj;
    };

    User.getFilteredParams = function(params, isMyself = true, isNew = false){
        if (!isNew) delete params.id;
        for (let f of ['id_auto', 'created_at', 'created_by', 'is_deleted']) delete params[f];
        for (let f of User.uneditableFields) delete params[f];
        if (isMyself) for (let f of User.uneditableFieldsForMyself) delete params[f];
        return params;
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