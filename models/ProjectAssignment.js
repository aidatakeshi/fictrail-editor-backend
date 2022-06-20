'use strict';
const { Model, DataTypes:dt } = require('sequelize');
const { validations } = require("./common");

module.exports = (sequelize) => {

    class ProjectAssignment extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_options = {
        modelName: 'ProjectAssignment',
        tableName: 'project_assignments',
        timestamps: false,
        sequelize,
    };

    const model_attributes = {
        id: { type: dt.UUID, unique: true, primaryKey: true },
        user_id: { type: dt.STRING },
        project_id: { type: dt.STRING },
        rights: { type: dt.STRING },
    };

    ProjectAssignment.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    

    //Return Model Class
    return ProjectAssignment;

};