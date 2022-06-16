'use strict';
const { Model, DataTypes } = require('sequelize');

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
        id_auto:    { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        user_id:    { type: DataTypes.STRING },
        project_id: { type: DataTypes.STRING },
        rights:     {
            type: DataTypes.STRING,
            validate: {
                isIn: [['owner', 'editor', 'viewer', null]],
            }
        }
    };

    ProjectAssignment.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    

    //Return Model Class
    return ProjectAssignment;

};