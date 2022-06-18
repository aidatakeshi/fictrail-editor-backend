'use strict';
const { Model, DataTypes:dt } = require('sequelize');
const { validations } = require("./common");

module.exports = (sequelize) => {

    class Project extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_options = {
        modelName: 'Project',
        tableName: 'projects',
        timestamps: false,
        sequelize,
    };

    const model_attributes = {
        id_auto: { type: dt.BIGINT, autoIncrement: true, primaryKey: true },
        id: { type: dt.STRING, allowNull: false, unique: true, validate: validations.id },
        name: { type: dt.TEXT, allowNull: true, validate: validations.name },
        name_l: { type: dt.JSON },
        is_public: { type: dt.BOOLEAN },
        //
        created_at: { type: dt.BIGINT },
        created_by: { type: dt.STRING },
        is_deleted: { type: dt.BOOLEAN },
    };

    Project.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    

    //Return Model Class
    return Project;

};