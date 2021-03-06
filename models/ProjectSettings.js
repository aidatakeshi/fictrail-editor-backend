'use strict';
const { Model, DataTypes: dt } = require('sequelize');
const { validations } = require("./common");

module.exports = (sequelize) => {

    class ProjectSettings extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_attributes = {
        id: { type: dt.STRING, allowNull: false, primaryKey: true, unique: true },
        project_id: { type: dt.STRING, allowNull: false },
        language_default: { type: dt.TEXT, allowNull: false, validate: validations.name },
        language_alt: { type: dt.JSON, allowNull: false, validate: validations.name_l_json },
        latitude_min: { type: dt.DOUBLE, allowNull: false, validate: validations.decimal },
        latitude_max: { type: dt.DOUBLE, allowNull: false, validate: validations.decimal },
        longitude_min: { type: dt.DOUBLE, allowNull: false, validate: validations.decimal },
        longitude_max: { type: dt.DOUBLE, allowNull: false, validate: validations.decimal },
    };

    const validate = {
        latitude(){
            let invalid = false;
            if (this.latitude_min < -90 || this.latitude_min > +90) invalid = true;
            if (this.latitude_max < -90 || this.latitude_max > +90) invalid = true;
            if (this.latitude_min >= this.latitude_max) invalid = true;
            if (invalid) throw new Error('Invalid Latitude Range. Latitude values should be -90 ~ +90.');
        },
        longitude(){
            let invalid = false;
            if (this.longitude_min < -360 || this.longitude_min > +360) invalid = true;
            if (this.longitude_max < -360 || this.longitude_max > +360) invalid = true;
            if (this.longitude_min >= this.longitude_max) invalid = true;
            if (this.longitude_max - this.longitude_min > 360) invalid = true;
            if (this.longitude_max + this.longitude_min > 360) invalid = true;
            if (this.longitude_max + this.longitude_min < -360) invalid = true;
            if (invalid) throw new Error('Invalid Longitude Range. Longitude values should be -360 ~ +360, the span should not be over 360, and the midpoint should be -180 ~ +180.');
        },
    };

    const defaultScope = {
    };

    const scopes = {
    };

    const model_options = {
        modelName: 'ProjectSettings',
        tableName: 'project_settings',
        timestamps: false,
        validate,
        defaultScope,
        scopes,
        sequelize,
    };

    ProjectSettings.init(model_attributes, model_options);

    /**
     * Default Values
     */
    ProjectSettings.default = {
        language_default: "English",
        language_alt: {},
        latitude_min: 42,
        latitude_max: 50,
        longitude_min: -25,
        longitude_max: -15,
    };

    /**
     * Model Specific Methods
     */
    ProjectSettings.filterQueries = function(queries){
        for (let f of ['id', 'project_id']) delete queries[f];
        return queries;
    };
    
    //Return Model Class
    return ProjectSettings;

};