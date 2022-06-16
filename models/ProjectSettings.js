'use strict';
const { Model, DataTypes } = require('sequelize');
const bcrypt = require("bcrypt");

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
        id_auto:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        project_id:         { type: DataTypes.STRING },
        bearer_token:       { type: DataTypes.STRING },
        language_default:   { type: DataTypes.TEXT },
        language_alt:       { type: DataTypes.JSON },
        latitude_min:       { type: DataTypes.DOUBLE, validate: { min: -90, max: 90 } },
        latitude_max:       { type: DataTypes.DOUBLE, validate: { min: -90, max: 90 } },
        longitude_min:      { type: DataTypes.DOUBLE, validate: { min: -360, max: +360 } },
        longitude_max:      { type: DataTypes.DOUBLE, validate: { min: -360, max: +360 } },
        earth_radius:       { type: DataTypes.DOUBLE },
    };

    ProjectSettings.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return ProjectSettings;

};