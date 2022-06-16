'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuid } = require('uuid');

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
        id_auto:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        user_id:            { type: DataTypes.STRING },
        bearer_token:       { type: DataTypes.STRING },
        login_time:         { type: DataTypes.BIGINT },
        last_activity_time: { type: DataTypes.BIGINT },
    };

    LoginSession.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return LoginSession;

};