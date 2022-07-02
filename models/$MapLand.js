'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString,
} = require("./common");
const {
    getAreaOfPolygons, getBoundingBoxOfPolygons,
} = require('../includes/longitude_latitude_calc');

module.exports = (sequelize) => {

    class $MapLand extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        polygons: at.polygons(),
        name: at.name(),
        name_l: at.name_l(),
        remarks: at.remarks(),
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
        modelName: '$MapLand',
        tableName: '_map_lands',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $MapLand.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */

    //Default value for New Item
    $MapLand.new_default = {
        hide_below_logzoom: 0,
        _data: {},
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $MapLand.sortables = {
        name: ($DIR, $lang) => {
            if (!$lang) return [['name', $DIR]];
            return [[`name_l.${$lang}`, $DIR]];
        },
        hide_below_logzoom: ($DIR) => [['hide_below_logzoom', $DIR]],
        sort: ($DIR) => [['sort', $DIR]],
        area: ($DIR) => [['_data.area', $DIR]],
    };
    $MapLand.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $MapLand.filters = {
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
        x_min_lt: (val) => ({ '_data.x_min': { [Op.lte]: val} }),
        x_max_gt: (val) => ({ '_data.x_max': { [Op.gte]: val} }),
        y_min_lt: (val) => ({ '_data.y_min': { [Op.lte]: val} }),
        y_max_gt: (val) => ({ '_data.y_max': { [Op.gte]: val} }),
        hide_in_logzoom: (val) => ({ hide_below_logzoom: { [Op.gt]: val} }),
        show_in_logzoom: (val) => ({ hide_below_logzoom: { [Op.lte]: val} }),
        locked: () => ({is_locked: true}),
        unlocked: () => ({is_locked: false}),
    };

    //Default & max display limit
    $MapLand.limit_default = null;
    $MapLand.limit_max = null;

    $MapLand.allow_duplicate = true;
    $MapLand.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $MapLand.getMode = function(_mode, req, excluded_fields){
        //Mode: polygons
        if (_mode == "polygons") return { attributes: { exclude: excluded_fields } };
        //Default
        return { attributes: { exclude: ['polygons'].concat(excluded_fields) } };
    };

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects _history.
    $MapLand.onSave = function(item, req){
        //x_min,y_min, x_max, y_max
        const bounding_box = getBoundingBoxOfPolygons(item.polygons) || {};
        item._data.x_min = bounding_box.x_min;
        item._data.x_max = bounding_box.x_max;
        item._data.y_min = bounding_box.y_min;
        item._data.y_max = bounding_box.y_max;
        //area
        item._data.area = getAreaOfPolygons(item.polygons, true);
        //name_search
        item._data.name_search = getSearchableNameString(item);
        //Done
        return item;
    };

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $MapLand;

};