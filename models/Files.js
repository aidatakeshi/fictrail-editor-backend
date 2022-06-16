'use strict';
const { Model, DataTypes } = require('sequelize');
const bcrypt = require("bcrypt");

module.exports = (sequelize) => {

    class Files extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_options = {
        modelName: 'Files',
        tableName: 'files',
        timestamps: false,
        sequelize,
    };

    const model_attributes = {
        id_auto:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id:                 { type: DataTypes.STRING },
        project_id:         { type: DataTypes.STRING },
        uploader_id:        { type: DataTypes.STRING },
        directory:          { type: DataTypes.STRING },
        extension:          { type: DataTypes.STRING },
        mimetype:           { type: DataTypes.STRING },
        size:               { type: DataTypes.BIGINT },
        upload_time:        { type: DataTypes.BIGINT },
        is_deleted:         { type: DataTypes.BOOLEAN },
    };

    Files.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return Files;

};