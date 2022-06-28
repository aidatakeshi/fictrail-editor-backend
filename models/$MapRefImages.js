'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { validations } = require("./common");

module.exports = (sequelize) => {

    class $MapRefImages extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_attributes = {
        id: { type: dt.UUID, unique: true, primaryKey: true },
        project_id: { type: dt.STRING, allowNull: false },
        x_min: { type: dt.DOUBLE, allowNull: false, validate: validations.decimal },
        x_max: { type: dt.DOUBLE, allowNull: false, validate: validations.decimal },
        y_min: { type: dt.DOUBLE, allowNull: false, validate: validations.decimal },
        y_max: { type: dt.DOUBLE, allowNull: false, validate: validations.decimal },
        file_key: { type: dt.STRING, allowNull: false },
        hide_below_logzoom: {
            type: dt.DOUBLE, allowNull: false, defaultValue: 0, validate: validations.decimal,
        },
        sort: {
            type: dt.DOUBLE, allowNull: false, defaultValue: 0, validate: validations.integer,
        },
        is_locked: {
            type: dt.BOOLEAN, allowNull: false, defaultValue: false, validate: validations.boolean,
        },
        is_hidden: {
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
        "+history": {where: defaultScope.where},
    };

    const model_options = {
        modelName: '$MapRefImages',
        tableName: '_map_ref_images',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $MapRefImages.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */
    $MapRefImages.sorts = { //e.g. "id:asc", "id:desc"
        hide_below_logzoom: ($DIR) => [['hide_below_logzoom', $DIR]],
    };
    $MapRefImages.sort_default = [["sort", "ASC"]];

    $MapRefImages.filters = {
        x_min_lt: (val) => ({ x_min: { [Op.lte]: val} }),
        x_max_gt: (val) => ({ x_max: { [Op.gte]: val} }),
        y_min_lt: (val) => ({ y_min: { [Op.lte]: val} }),
        y_max_gt: (val) => ({ y_max: { [Op.gte]: val} }),
        hide_in_logzoom: (val) => ({ hide_below_logzoom: { [Op.gt]: val} }),
        show_in_logzoom: (val) => ({ hide_below_logzoom: { [Op.lte]: val} }),
        hidden: () => ({is_hidden: true}),
        shown: () => ({is_hidden: false}),
        locked: () => ({is_locked: true}),
        unlocked: () => ({is_locked: false}),
    };

    $MapRefImages.limit_default = null;
    $MapRefImages.limit_max = null;

    $MapRefImages.allow_duplicate = true;
    $MapRefImages.allow_reorder = true;

    //Display Modes in GET methods. Overrides display() if mapping function is specified.
    //get_modes[type] = {where, attributes, include, mapping}
    $MapRefImages.get_modes = { 
    };

    //Custom data display function (params: item, req) used in GET (default mode), PUT, POST and DELETE.
    //If not specified, the generic display function is used.
    $MapRefImages.display = null;

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects _history.
    $MapRefImages.on_save = null;

    //Ignore fields in _history
    $MapRefImages.history_ignore_fields = [];

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $MapRefImages;

};