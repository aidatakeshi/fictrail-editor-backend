'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString,
} = require("./common");

module.exports = (sequelize) => {

    class $RegionBroader extends Model {
        static associate(models) {
            models.$RegionBroader.hasMany(models.$Region, {
                as: 'region',
                foreignKey: 'region_broader_id',
            });
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        name: at.name(),
        name_l: at.name_l(),
        name_short: at.name(),
        name_short_l: at.name_l(),
        remarks: at.remarks(),
        sort: at.sort(),
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
        modelName: '$RegionBroader',
        tableName: '_regions_broader',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $RegionBroader.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */

    //Default value for New Item
    $RegionBroader.new_default = {
        _data: {},
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $RegionBroader.sortables = {
        name: ($DIR, $lang) => {
            if (!$lang) return [['name', $DIR]];
            return [[`name_l.${$lang}`, $DIR]];
        },
        sort: ($DIR) => [['sort', $DIR]],
    };
    $RegionBroader.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $RegionBroader.filters = {
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
    };

    //Default & max display limit
    $RegionBroader.limit_default = null;
    $RegionBroader.limit_max = null;

    $RegionBroader.allow_duplicate = true;
    $RegionBroader.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $RegionBroader.getMode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  { exclude: excluded_fields };
        let include = [];
        let order = [];
        //Complex mode, separated by ',' (e.g. 'region_sub,polygons')
        const _modes = (_mode || '').split(',');
        //Mode: polygons
        if (!_modes.includes('polygons')){
            attributes.exclude = attributes.exclude.concat(['polygons', '_land_polygons']);
        }
        //Mode: region / region_sub
        if (_modes.includes('region') || _modes.includes('region_sub')){
            const $model = {model: _m.$Region, as: 'region'};
            const $model_sub = {model: _m.$RegionSub, as: 'region_sub'};
            let include_item = {
                ...$model, required: false, attributes,
                where: {project_id: req.params.project_id},
            };
            order.push([$model, 'sort', 'ASC']);
            if (_modes.includes('region_sub')){
                include_item.include = {
                    ...$model_sub, required: false, attributes,
                    where: {project_id: req.params.project_id},
                };
                order.push([$model, $model_sub, 'sort', 'ASC']);
            }
            include.push(include_item);
        }
        //Return Mode
        return {attributes, include, order};
    };

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects edit history.
    $RegionBroader.onSave = function(item, req){
        //name_search
        item._data.name_search = getSearchableNameString(item);
        //Done
        return item;
    };

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $RegionBroader;

};