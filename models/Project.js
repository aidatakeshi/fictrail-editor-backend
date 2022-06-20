'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
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
        is_public: { type: dt.BOOLEAN, validate: validations.boolean },
        //
        created_at: { type: dt.BIGINT },
        created_by: { type: dt.STRING },
        is_deleted: { type: dt.BOOLEAN },
    };

    Project.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */
    Project.hidden_fields = ['id_auto', 'is_deleted'];
    Project.locked_fields = [];

    Project.sorts = { //e.g. "id:asc", "id:desc"
        id: "LOWER(id)",
        name: "LOWER(name)",
    };
    Project.sort_default = "id_auto DESC";

    Project.filters = {
        id: (val) => ({
            statement: `LOWER(id) LIKE ?`, replacement: [`${val.toLowerCase()}%`],
        }),
        id_contains: (val) => ({
            statement: `LOWER(id) LIKE ?`, replacement: [`%${val.toLowerCase()}%`],
        }),
        name: (val) => ({
            statement: `LOWER(name) LIKE ?`, replacement: [`${val.toLowerCase()}%`],
        }),
        name_contains: (val) => ({
            statement: `LOWER(name) LIKE ?`, replacement: [`%${val.toLowerCase()}%`],
        }),
        public: () => ({ statement: `is_public = TRUE`, replacement: [], }),
        private: () => ({ statement: `is_public = FALSE`, replacement: [], }),
        created_before: (val) => ({ statement: `created_at <= ?`, replacement: [val], }),
        created_after: (val) => ({ statement: `created_at >= ?`, replacement: [val], }),
        created_by: (val) => ({ statement: `created_by = ?`, replacement: [val], }),
    };

    Project.limit_default = 25;
    Project.limit_max = 100;

    /**
     * Model Specific Methods
     */
    

    //Return Model Class
    return Project;

};