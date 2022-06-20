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
        language_default: { type: dt.TEXT, validate: validations.name },
        language_alt: { type: dt.JSON },
        latitude_min: { type: dt.DOUBLE, validate: validations.latitude },
        latitude_max: { type: dt.DOUBLE, validate: validations.latitude },
        longitude_min: { type: dt.DOUBLE, validate: validations.longitude },
        longitude_max: { type: dt.DOUBLE, validate: validations.longitude },
        earth_radius: { type: dt.DOUBLE, validate: validations.decimal },
    };

    ProjectSettings.init(model_attributes, model_options);

    /**
     * Default Settings
     */
    ProjectSettings.default = {
        language_default: "English",
        language_alt: {},
        latitude_min: -25,
        latitude_max: -15,
        longitude_min: 42,
        longitude_max: 50,
        earth_radius: 6371.0088,
    };

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return ProjectSettings;

};