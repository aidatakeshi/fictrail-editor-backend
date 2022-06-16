'use strict';
const { Model, DataTypes } = require('sequelize');

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
        id_auto:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id:                 { type: DataTypes.STRING, unique: true },
        name:               { type: DataTypes.TEXT },
        name_l:             { type: DataTypes.JSON },
        is_public:          { type: DataTypes.BOOLEAN },
        created_at:         { type: DataTypes.BIGINT },
        created_by:         { type: DataTypes.BIGINT },
        is_deleted:         { type: DataTypes.BOOLEAN },
    };

    Project.init(model_attributes, model_options);

    /**
     * Model Specific Methods
     */
    

    //Return Model Class
    return Project;

};