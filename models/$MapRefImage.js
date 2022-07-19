'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString,
} = require("./common");

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
        //
        _data: at._data(),
        //
        created_at: at.created_at(),
        created_by: at.created_by(),
        deleted_at: at.deleted_at(),
        deleted_by: at.deleted_by(),
        
    };

    const defaultScope = {
        where: { deleted_by: null },
    };

    const scopes = {
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
        _data: {},
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $MapRefImage.sortables = {
        name: ($DIR, $lang) => {
            if (!$lang) return [['name', $DIR]];
            return [[`name_l.${$lang}`, $DIR]];
        },
        hide_below_logzoom: ($DIR) => [['hide_below_logzoom', $DIR]],
        sort: ($DIR) => [['sort', $DIR]],
    };
    $MapRefImage.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $MapRefImage.filters = {
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
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
    //Returns {where, attributes, include, order}
    $MapRefImage.getMode = function(_mode, req, excluded_fields){
        //Default
        return { attributes: { exclude: excluded_fields } };
    };

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects edit history.
    $MapRefImage.onSave = function(item, req){
        //name_search
        item._data.name_search = getSearchableNameString(item);
        //Done
        return item;
    };

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $MapRefImage;

};