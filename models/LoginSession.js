'use strict';
const { Model, DataTypes:dt } = require('sequelize');
const { validations } = require("./common");

const File = require("./File");

module.exports = (sequelize) => {

    class LoginSession extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_options = {
        modelName: 'LoginSession',
        tableName: 'login_sessions',
        timestamps: false,
        sequelize,
    };

    const model_attributes = {
        id_auto: { type: dt.BIGINT, autoIncrement: true, primaryKey: true },
        user_id: { type: dt.STRING, allowNull: false },
        bearer_token: { type: dt.STRING },
        login_time: { type: dt.BIGINT, allowNull: false },
        last_activity_time: { type: dt.BIGINT, allowNull: false },
        file_token: { type: dt.STRING },
    };

    LoginSession.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return LoginSession;

};