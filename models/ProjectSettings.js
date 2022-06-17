'use strict';
const { Model, DataTypes: dt } = require('sequelize');
const { validations } = require("./common");

module.exports = (sequelize) => {

    class ProjectSettings extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_options = {
        modelName: 'ProjectSettings',
        tableName: 'project_settings',
        timestamps: false,
        sequelize,
    };

    const model_attributes = {
        id_auto: { type: dt.BIGINT, autoIncrement: true, primaryKey: true },
        project_id: { type: dt.STRING },
        language_default: { type: dt.TEXT, allowNull: true, validate: validations.name },
        language_alt: { type: dt.JSON },
        latitude_min: { type: dt.DOUBLE },
        latitude_max: { type: dt.DOUBLE },
        longitude_min: { type: dt.DOUBLE },
        longitude_max: { type: dt.DOUBLE },
        earth_radius: { type: dt.DOUBLE },
    };

    ProjectSettings.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return ProjectSettings;

};