'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { attributes:at } = require("./common");

module.exports = (sequelize) => {

    class $MapRefImage extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        x_min: at.longitude(),
        x_max: at.longitude(),
        y_min: at.latitude(),
        y_max:  at.latitude(),
        file_key: at.file_key(),
        hide_below_logzoom: at.logzoom(),
        sort: at.sort(),
        is_locked: at.is_locked(),
        is_hidden: at.is_hidden(),
        //
        created_at: at.created_at(),
        created_by: at.created_by(),
        deleted_at: at.deleted_at(),
        deleted_by: at.deleted_by(),
        _history: at._history(),
    };

    const defaultScope = {
        where: { deleted_by: null },
        attributes: { exclude: ["_history"] },
    };

    const scopes = {
        "+history": {where: defaultScope.where},
    };

    const model_options = {
        modelName: '$MapRefImage',
        tableName: '_map_ref_images',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $MapRefImage.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */
    $MapRefImage.default = { //Default value
        hide_below_logzoom: 0,
    };

    $MapRefImage.sorts = { //e.g. "id:asc", "id:desc"
        hide_below_logzoom: ($DIR) => [['hide_below_logzoom', $DIR]],
        sort: ($DIR) => [['sort', $DIR]],
    };
    $MapRefImage.sort_default = [["sort", "ASC"]];

    $MapRefImage.filters = {
        x_min_lt: (val) => ({ x_min: { [Op.lte]: val} }),
        x_max_gt: (val) => ({ x_max: { [Op.gte]: val} }),
        y_min_lt: (val) => ({ y_min: { [Op.lte]: val} }),
        y_max_gt: (val) => ({ y_max: { [Op.gte]: val} }),
        hide_in_logzoom: (val) => ({ hide_below_logzoom: { [Op.gt]: val} }),
        show_in_logzoom: (val) => ({ hide_below_logzoom: { [Op.lte]: val} }),
        locked: () => ({is_locked: true}),
        unlocked: () => ({is_locked: false}),
    };

    $MapRefImage.limit_default = null;
    $MapRefImage.limit_max = null;

    $MapRefImage.allow_duplicate = true;
    $MapRefImage.allow_reorder = true;

    //Display Modes in GET methods. Overrides display() if mapping function is specified.
    //get_modes[type] = {where, attributes, include, mapping}
    $MapRefImage.get_modes = { 
    };

    //Custom data display function (params: item, req) used in GET (default mode), PUT, POST and DELETE.
    //If not specified, the generic display function is used.
    $MapRefImage.display = null;

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects _history.
    $MapRefImage.on_save = null;

    //Ignore fields in _history
    $MapRefImage.history_ignore_fields = [];

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $MapRefImage;

};