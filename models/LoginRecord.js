'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuid } = require('uuid');

module.exports = (sequelize) => {

    class LoginRecord extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_options = {
        modelName: 'LoginRecord',
        tableName: 'login_records',
        timestamps: false,
        sequelize,
    };

    const model_attributes = {
        id_auto:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        user_id:            { type: DataTypes.STRING },
        bearer_token:       { type: DataTypes.STRING },
        login_time:         { type: DataTypes.BIGINT },
        logout_time:        { type: DataTypes.BIGINT },
    };

    LoginRecord.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return LoginRecord;

};