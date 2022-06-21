'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { validations } = require("./common");

module.exports = (sequelize) => {

    class Project extends Model {
        static associate(models) {
            models.Project.hasMany(models.ProjectAssignment, {foreignKey: 'project_id'});
        }
    }

    const model_attributes = {
        id: {
            type: dt.STRING, allowNull: false, primaryKey: true, unique: true, validate: validations.id,
        },
        name: { type: dt.TEXT, allowNull: false, validate: validations.name },
        name_l: {
            type: dt.JSON, allowNull: false, defaultValue: {}, validate: validations.name_l_json,
        },
        is_public: {
            type: dt.BOOLEAN, allowNull: false, defaultValue: false, validate: validations.boolean,
        },
        //
        created_at: { type: dt.BIGINT },
        created_by: { type: dt.STRING },
        deleted_at: { type: dt.BIGINT },
        deleted_by: { type: dt.STRING },
        _history: { type: dt.JSON },
    };

    const defaultScope = {
        where: { deleted_by: null },
        attributes: { exclude: ["_history"] },
    };

    const scopes = {
        _history: { attributes: ["_history"] },
    };

    const model_options = {
        modelName: 'Project',
        tableName: 'projects',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    Project.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */
    Project.sorts = { //e.g. "id:asc", "id:desc"
        id: ($DIR) => [
            [sequelize.fn('LOWER', sequelize.col('id')), $DIR],
        ],
        name: ($DIR) => [
            [sequelize.fn('LOWER', sequelize.fn('COALESCE', sequelize.col('name'), sequelize.col('id'))), $DIR],
        ],
    };
    Project.sort_default = [["created_at", "ASC"]];

    Project.filters = {
        id: (val) => ({
            id: { [Op.iLike]: `${val}%` }
        }),
        id_contains: (val) => ({
            id: { [Op.iLike]: `%${val}%` }
        }),
        name: (val) => ({
            name: { [Op.iLike]: `${val}%` }
        }),
        name_contains: (val) => ({
            name: { [Op.iLike]: `%${val}%` }
        }),
        public: () => ({is_public: true}),
        private: () => ({is_public: false}),
        public: () => ({ statement: `is_public = TRUE`, replacement: [], }),
        private: () => ({ statement: `is_public = FALSE`, replacement: [], }),
        created_before: (val) => ({created_at: {[Op.lte]: val}}),
        created_after: (val) => ({created_at: {[Op.gte]: val}}),
        created_by: (val) => ({created_by: val}),
    };

    Project.limit_default = 25;
    Project.limit_max = 100;

    /**
     * Model Specific Methods
     */
    Project.prototype.display = function(){
        let obj = { ...this.toJSON() }
        for(let f of ['deleted_at', 'deleted_by']) delete obj[f];
        return obj;
    };

    Project.filterQueries = function(queries, isNew){
        if (!isNew) delete queries.id;
        for (let f of ['created_at', 'created_by', 'deleted_at', 'deleted_by']) delete queries[f];
        return queries;
    };

    //Return Model Class
    return Project;

};