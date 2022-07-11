'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString, combineWords,
} = require("./common");
const {
    getAreaOfPolygons, getBoundingBoxOfPolygons,
} = require('../includes/longitude_latitude_calc');

module.exports = (sequelize) => {

    class $RegionSub extends Model {
        static associate(models) {
            models.$RegionSub.belongsTo(models.$Region, {
                as: 'region',
                foreignKey: 'region_id',
            });
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        region_id: at.foreign_id(),
        name: at.name(),
        name_l: at.name_l(),
        name_suffix: at.name_s(),
        name_suffix_l: at.name_l(),
        name_short: at.name_s(),
        name_short_l: at.name_l(),
        remarks: at.remarks(),
        is_locked: at.is_locked(),
        polygons: at.polygons(),
        sort: at.sort(),
        //
        $name_full: {
            type: dt.VIRTUAL,
            get: function() {
                return combineWords(this.get('name'), this.get('name_suffix'));
            },
            set: () => {},
        },
        $name_full_l: {
            type: dt.VIRTUAL,
            get: function() {
                const name_l = this.get('name_l');
                const name_suffix_l = this.get('name_suffix_l');
                let name_full_l = {};
                for (let l in name_l){
                    name_full_l = combineWords(name_l[l], name_suffix_l[l]);
                }
                return name_full_l;
            },
            set: () => {},
        },
        //
        _polygons: at._data(),
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
        modelName: '$RegionSub',
        tableName: '_regions_sub',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $RegionSub.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */
    
    //Default value for New Item
    $RegionSub.new_default = {
        _data: {},
        _polygons: {},
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $RegionSub.sortables = {
        name: ($DIR, $lang) => {
            if (!$lang) return [['name', $DIR]];
            return [[`name_l.${$lang}`, $DIR]];
        },
        sort: ($DIR) => [['sort', $DIR]],
        area: ($DIR) => [['_data.land_area', $DIR]],
    };
    $RegionSub.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $RegionSub.filters = {
        region_id: (val) => ({region_id: val}),
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
        locked: () => ({is_locked: true}),
        unlocked: () => ({is_locked: false}),
    };

    //Default & max display limit
    $RegionSub.limit_default = null;
    $RegionSub.limit_max = null;

    $RegionSub.allow_duplicate = true;
    $RegionSub.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $RegionSub.getMode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  { exclude: excluded_fields };
        let include = [];
        let order = [];
        //Complex mode, separated by ',' (e.g. 'region,polygons')
        const _modes = (_mode || '').split(',');
        //Mode: polygons
        if (!_modes.includes('polygons')){
            attributes.exclude = attributes.exclude.concat(['polygons', '_polygons']);
        }
        //Mode: region, region_broader
        if (_modes.includes('region') || _modes.includes('region_broader')){
            const $model = {model: _m.$Region, as: 'region'};
            const $model_b = {model: _m.$RegionBroader, as: 'region_broader'};
            let include_item = {
                ...$model, required: false, attributes,
                where: {project_id: req.params.project_id},
            };
            if (_modes.includes('region_broader')){
                include_item.include = {
                    ...$model_b, required: false, attributes,
                    where: {project_id: req.params.project_id},
                };
            }
            include.push(include_item);
        }
        //Return Mode
        return {attributes, include, order};
    };

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects edit history.
    $RegionSub.onSave = function(item, req){
        //x_min,y_min, x_max, y_max
        const bounding_box = getBoundingBoxOfPolygons(item.polygons) || {};
        item._data.x_min = bounding_box.x_min;
        item._data.x_max = bounding_box.x_max;
        item._data.y_min = bounding_box.y_min;
        item._data.y_max = bounding_box.y_max;
        //land_area, _polygons.land
        //...
        //name_search
        item._data.name_search = getSearchableNameString(item);
        //Done
        return item;
    };

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $RegionSub;

};