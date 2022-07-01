'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { attributes:at } = require("./common");

const {
    getAreaOfPolygons, getBoundingBoxOfPolygons
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
        _x_min: at._decimal(),
        _x_max: at._decimal(),
        _y_min: at._decimal(),
        _y_max: at._decimal(),
        _area: at._decimal(),
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
    };

    //Sort modes (query: _sort, e.g. "id:asc", "id:desc")
    $MapLand.sorts = {
        name: ($DIR) => [['name', $DIR]],
        hide_below_logzoom: ($DIR) => [['hide_below_logzoom', $DIR]],
        sort: ($DIR) => [['sort', $DIR]],
        area: ($DIR) => [['_area', $DIR]],
    };
    $MapLand.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $MapLand.filters = {
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
    $MapLand.limit_default = null;
    $MapLand.limit_max = null;

    $MapLand.allow_duplicate = true;
    $MapLand.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //get_modes[type] = {where, attributes, include, include.order}
    //It can also be a function (params: item, req) returning the above-mentioned object
    $MapLand.get_default = {
        attributes: { exclude: ['_names', 'polygons'] },
    };
    $MapLand.get_modes = {
        polygons: {
            attributes: { exclude: ['_names'] },
        },
    };

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects _history.
    $MapLand.on_save = function(item, req){
        //_names
        item._names = `|${item.name}`;
        for (let l in item.name_l) item._names += `|${item.name_l[l]}`;
        //_x_min, y_min, x_max, y_max
        const bounding_box = getBoundingBoxOfPolygons(item.polygons) || {};
        item._x_min = bounding_box.x_min;
        item._x_max = bounding_box.x_max;
        item._y_min = bounding_box.y_min;
        item._y_max = bounding_box.y_max;
        //_area
        item._area = getAreaOfPolygons(item.polygons, true);
        //Done
        return item;
    };

    //Ignore fields in _history
    $MapLand.history_ignore_fields = [];

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $MapLand;

};