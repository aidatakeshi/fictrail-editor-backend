'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { validations } = require("./common");

const bcrypt = require("bcrypt");
const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');

module.exports = (sequelize) => {

    class User extends Model {
        static associate(models) {
            models.User.hasMany(models.ProjectAssignment, {foreignKey: 'user_id'});
        }
    }

    const model_attributes = {
        id: {
            type: dt.STRING, allowNull: false, primaryKey: true, unique: true, validate: validations.id,
        },
        name: {
            type: dt.TEXT, validate: validations.name,
            get(){ return this.getDataValue('name') || this.getDataValue('id') },
        },
        email: { type: dt.TEXT, validate: validations.email },
        password: {
            type: dt.STRING, allowNull: false, validate: validations.password,
            set(value){
                if (value === null || value === '') return this.setDataValue('password', '');
                if (value.length < 8) return this.setDataValue('password', '#');
                if (value.length > 255) return this.setDataValue('password', '#');
                return this.setDataValue('password', bcrypt.hashSync(value, 10));
            },
        },
        last_login_attempt: { type: dt.BIGINT },
        is_root_user: { type: dt.BOOLEAN, validate: validations.boolean },
        can_create_new_project: { type: dt.BOOLEAN, validate: validations.boolean },
        is_enabled: { type: dt.BOOLEAN, validate: validations.boolean },
        //
        created_at: { type: dt.BIGINT },
        created_by: { type: dt.STRING },
        deleted_at: { type: dt.BIGINT },
        deleted_by: { type: dt.STRING },
    };

    const defaultScope = {
        where: { deleted_by: null },
    };

    const scopes = {};

    const model_options = {
        modelName: 'User',
        tableName: 'users',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    User.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */
    User.sorts = { //e.g. "id:asc", "id:desc"
        id: ($DIR) => [
            [sequelize.fn('LOWER', sequelize.col('id')), $DIR],
        ],
        name: ($DIR) => [
            [sequelize.fn('LOWER', sequelize.fn('COALESCE', sequelize.col('name'), sequelize.col('id'))), $DIR],
        ],
        email: ($DIR) => [["email", $DIR]],
        created_at: ($DIR) => [["created_at", $DIR]],
    };
    User.sort_default = [["created_at", "ASC"]];

    User.filters = {
        id: (val) => ({
            id: { [Op.iLike]: `${val}%` }
        }),
        id_contains: (val) => ({
            id: { [Op.iLike]: `%${val}%` }
        }),
        name: (val) => (sequelize.where(
            sequelize.fn('COALESCE', sequelize.col('name'), sequelize.col('id')), { [Op.iLike]: `${val}%` },
        )),
        name_contains: (val) => (sequelize.where(
            sequelize.fn('COALESCE', sequelize.col('name'), sequelize.col('id')), { [Op.iLike]: `%${val}%` },
        )),
        email: (val) => ({
            email: { [Op.iLike]: `${val}%` }
        }),
        email_contains: (val) => ({
            email: { [Op.iLike]: `%${val}%` }
        }),
        enabled: () => ({is_enabled: true}),
        disabled: () => ({is_enabled: false}),
        root_user: () => ({is_root_user: true}),
        normal_user: () => ({is_root_user: false}),
        can_create_new_project: () => ({can_create_new_project: true}),
        cannot_create_new_project: () => ({can_create_new_project: false}),
        created_before: (val) => ({created_at: {[Op.lte]: val}}),
        created_after: (val) => ({created_at: {[Op.gte]: val}}),
        created_by: (val) => ({created_by: val}),
    };

    User.limit_default = 25;
    User.limit_max = 100;

    /**
     * Model Specific Methods
     */
    User.prototype.display = function(){
        let obj = { ...this.toJSON() }
        for(let f of ['password', 'last_login_attempt', 'deleted_at', 'deleted_by']) delete obj[f];
        return obj;
    };

    User.filterQueries = function(queries, isMyself, isNew){
        if (!isNew) delete queries.id;
        for (let f of ['created_at', 'created_by', 'deleted_at', 'deleted_by']) delete queries[f];
        for (let f of ['last_login_attempt']) delete queries[f];
        if (isMyself){
            for (let f of ['password', 'is_root_user', 'can_create_new_project', 'is_enabled']) delete queries[f];
        }
        return queries;
    };

    User.prototype.verifyPassword = function(passwordToVerify){
        return bcrypt.compareSync(passwordToVerify, this.password);
    };

    User.prototype.generateBearerToken = function(){
        return jwt.sign({data: uuid() + uuid()}, process.env.LOGIN_TOKEN_SECRET);
    };
    
    //Return Model Class
    return User;

};