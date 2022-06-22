'use strict';
const { Model, DataTypes:dt } = require('sequelize');
const { validations } = require("./common");

module.exports = (sequelize) => {

    class ProjectAssignment extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_attributes = {
        id: { type: dt.UUID, unique: true, primaryKey: true },
        user_id: { type: dt.STRING, allowNull: false },
        project_id: { type: dt.STRING, allowNull: false },
        rights: { type: dt.STRING },
        //
        created_at: { type: dt.BIGINT },
        created_by: { type: dt.STRING },
        deleted_at: { type: dt.BIGINT },
        deleted_by: { type: dt.STRING },
    };

    const defaultScope = {
        where: { deleted_by: null },
    };

    const scopes = {};

    const model_options = {
        modelName: 'ProjectAssignment',
        tableName: 'project_assignments',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };


    ProjectAssignment.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    

    //Return Model Class
    return ProjectAssignment;

};