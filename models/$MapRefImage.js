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
        name: at.name(),
        name_l: at.name_l(),
        remarks: at.remarks(),
        x_min: at.longitude(),
        x_max: at.longitude(),
        y_min: at.latitude(),
        y_max:  at.latitude(),
        file_key: at.file_key(),
        hide_below_logzoom: at.logzoom(),
        sort: at.sort(),
        is_locked: at.is_locked(),
        is_hidden: at.is_hidden(),
        _names: at._names(),
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

    //Default value for New Item
    $MapRefImage.new_default = {
        hide_below_logzoom: 0,
    };

    //Sort modes (query: _sort, e.g. "id:asc", "id:desc")
    $MapRefImage.sorts = {
        name: ($DIR) => [['name', $DIR]],
        hide_below_logzoom: ($DIR) => [['hide_below_logzoom', $DIR]],
        sort: ($DIR) => [['sort', $DIR]],
    };
    $MapRefImage.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $MapRefImage.filters = {
        name: (val) => ({ _names: { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ _names: { [Op.iLike]: `%${val}%`} }),
        x_min_lt: (val) => ({ x_min: { [Op.lte]: val} }),
        x_max_gt: (val) => ({ x_max: { [Op.gte]: val} }),
        y_min_lt: (val) => ({ y_min: { [Op.lte]: val} }),
        y_max_gt: (val) => ({ y_max: { [Op.gte]: val} }),
        hide_in_logzoom: (val) => ({ hide_below_logzoom: { [Op.gt]: val} }),
        show_in_logzoom: (val) => ({ hide_below_logzoom: { [Op.lte]: val} }),
        locked: () => ({is_locked: true}),
        unlocked: () => ({is_locked: false}),
    };

    //Default & max display limit
    $MapRefImage.limit_default = null;
    $MapRefImage.limit_max = null;

    $MapRefImage.allow_duplicate = true;
    $MapRefImage.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //get_modes[type] = {where, attributes, include, include.order}
    //It can also be a function (params: item, req) returning the above-mentioned object
    $MapRefImage.get_default = {
        attributes: { exclude: ['_names'] },
    };
    $MapRefImage.get_modes = {
    };

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects _history.
    $MapRefImage.on_save = function(item, req){
        //_names
        item._names = `|${item.name}`;
        for (let l in item.name_l) item._names += `|${item.name_l[l]}`;
        //Done
        return item;
    };

    //Ignore fields in _history
    $MapRefImage.history_ignore_fields = [];

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $MapRefImage;

};