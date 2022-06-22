'use strict';
const { Model, DataTypes:dt } = require('sequelize');
const { validations } = require("./common");

module.exports = (sequelize) => {

    class File extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_options = {
        modelName: 'File',
        tableName: 'files',
        timestamps: false,
        sequelize,
    };

    const model_attributes = {
        id_auto: { type: dt.BIGINT, autoIncrement: true, primaryKey: true },
        id: { type: dt.STRING, unique: true, validate: validations.id },
        project_id: { type: dt.STRING, allowNull: false },
        directory: { type: dt.STRING, allowNull: false },
        filename: { type: dt.STRING, allowNull: false },
        extension: { type: dt.STRING, allowNull: false },
        mimetype: { type: dt.STRING, allowNull: false },
        size: { type: dt.BIGINT },
        //
        created_at: { type: dt.BIGINT },
        created_by: { type: dt.STRING },
        deleted_at: { type: dt.BIGINT },
        deleted_by: { type: dt.STRING },
    };

    File.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    File.getNewFileToken = function(){
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 16; i++){ //token.length = 16
            token += chars.charAt(Math.floor(Math.random() * 62)); //chars.length = 62
        }
        return token;
    };
    
    //Return Model Class
    return File;

};