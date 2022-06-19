'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
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
     * CRUD-Related
     */
    User.hidden_fields = ['id_auto', 'password', 'last_login_attempt', 'is_deleted'];
    User.locked_fields_root = ['last_login_attempt'];
    User.locked_fields_myself = [
        'last_login_attempt', 'password', 'is_root_user', 'can_create_new_project', 'is_enabled'
    ];

    User.sorts = { //e.g. "id_asc", "id_desc"
        id: "LOWER(id)",
        name: "LOWER(COALESCE(name,id))",
        email: "email",
        created_at: "created_at",
    };
    User.sort_default = "id_auto DESC";

    User.filters = {
        id: (val) => ({
            statement: `LOWER(id) LIKE ?`, replacement: [`${val.toLowerCase()}%`],
        }),
        id_contains: (val) => ({
            statement: `LOWER(id) LIKE ?`, replacement: [`%${val.toLowerCase()}%`],
        }),
        name: (val) => ({
            statement: `LOWER(COALESCE(name,id)) LIKE ?`, replacement: [`${val.toLowerCase()}%`],
        }),
        name_contains: (val) => ({
            statement: `LOWER(COALESCE(name,id)) LIKE ?`, replacement: [`%${val.toLowerCase()}%`],
        }),
        email: (val) => ({
            statement: `LOWER(email) LIKE ?`, replacement: [`${val.toLowerCase()}%`],
        }),
        email_contains: (val) => ({
            statement: `LOWER(email) LIKE ?`, replacement: [`%${val.toLowerCase()}%`],
        }),
        enabled: () => ({ statement: `is_enabled = TRUE`, replacement: [], }),
        disabled: () => ({ statement: `is_enabled = FALSE`, replacement: [], }),
        root_user: () => ({ statement: `is_root_user = TRUE`, replacement: [], }),
        normal_user: () => ({ statement: `is_root_user = FALSE`, replacement: [], }),
        can_create_new_project: () => ({ statement: `can_create_new_project = TRUE`, replacement: [], }),
        cannot_create_new_project: () => ({ statement: `can_create_new_project = FALSE`, replacement: [], }),
        created_before: (val) => ({ statement: `created_at <= ?`, replacement: [val], }),
        created_after: (val) => ({ statement: `created_at >= ?`, replacement: [val], }),
        created_by: (val) => ({ statement: `created_by = ?`, replacement: [val], }),
    };

    User.limit_default = 25;
    User.limit_max = 100;

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