'use strict';
const { Model, DataTypes:dt } = require('sequelize');
const { validations } = require("./common");

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
        id_auto: { type: dt.BIGINT, autoIncrement: true, primaryKey: true },
        id: { type: dt.STRING, unique: true, validate: validations.id },
        project_id: { type: dt.STRING },
        directory: { type: dt.STRING },
        extension: { type: dt.STRING },
        mimetype: { type: dt.STRING },
        size: { type: dt.BIGINT },
        //
        created_at: { type: dt.BIGINT },
        created_by: { type: dt.STRING },
        deleted_at: { type: dt.BIGINT },
        deleted_by: { type: dt.STRING },
    };

    Files.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return Files;

};