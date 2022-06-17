'use strict';
const { Model, DataTypes:dt } = require('sequelize');
const { validations } = require("./common");

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
        id_auto: { type: dt.BIGINT, autoIncrement: true, primaryKey: true },
        user_id: { type: dt.STRING },
        bearer_token: { type: dt.STRING },
        login_time: { type: dt.BIGINT },
        logout_time: { type: dt.BIGINT },
    };

    LoginRecord.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return LoginRecord;

};