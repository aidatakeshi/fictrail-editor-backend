'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString,
} = require("./common");

module.exports = (sequelize) => {

    class $Station extends Model {
        static associate(models) {
            models.$Station.belongsTo(models.$RailOperator, {
                as: 'rail_operator',
                foreignKey: 'major_rail_operator_id',
            });
            models.$Station.belongsTo(models.$Region, {
                as: 'region',
                foreignKey: 'region_id',
            });
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        major_rail_operator_id: at.foreign_id(),
        region_id: at.foreign_id(),
        name: at.name(),
        name_l: at.name_l(),
        name_short: at.name_s(),
        name_short_l: at.name_l(),
        x: at.longitude(),
        y: at.latitude(),
        altitude_m: at.decimal(),
        tracks: at.tracks(),
        track_info: at.object(),
        is_major: at.boolean(),
        is_signal_only: at.boolean(),
        is_in_use: at.boolean(),
        remarks: at.remarks(),
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
        modelName: '$Station',
        tableName: '_stations',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $Station.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */

    //Default value for New Item
    $Station.new_default = {
        _data: {},
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $Station.sortables = {
        name: ($DIR, $lang) => {
            if (!$lang) return [['name', $DIR]];
            return [[`name_l.${$lang}`, $DIR]];
        },
        name_short: ($DIR, $lang) => {
            if (!$lang) return [['name_short', $DIR]];
            return [[`name_short_l.${$lang}`, $DIR]];
        },
        x: ($DIR) => [['x', $DIR]],
        y: ($DIR) => [['y', $DIR]],
    };
    $Station.sort_default = [["name", "ASC"]];

    //Filters (query: [filtername])
    $Station.filters = {
        rail_operator_id: (val) => ({major_rail_operator_id: val}),
        region_id: (val) => ({region_id: val}),
        west: (val) => ({ x: { [Op.lte]: val} }),
        east: (val) => ({ x: { [Op.gte]: val} }),
        south: (val) => ({ y: { [Op.lte]: val} }),
        north: (val) => ({ y: { [Op.gte]: val} }),
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
        major: (val) => ({ is_major: true }),
        minor: (val) => ({ is_major: false }),
        signal_only: (val) => ({ is_signal_only: true }),
        passenger: (val) => ({ is_signal_only: false }),
        in_use: (val) => ({ is_in_use: true }),
        not_in_use: (val) => ({ is_in_use: false }),
    };

    //Default & max display limit
    $Station.limit_default = 25;
    $Station.limit_max = null;

    $Station.allow_duplicate = true;
    $Station.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $Station.getMode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  { exclude: excluded_fields };
        let include = [];
        let order = [];
        //Complex mode, separated by ',' (e.g. 'region,rail_operator')
        const _modes = (_mode || '').split(',');
        //Mode: rail_operator
        if (_modes.includes('region')){
            const $model = {model: _m.$Region, as: 'region'};
            include.push({
                ...$model, required: false, attributes,
                where: {project_id: req.params.project_id},
            });
        }
        //Mode: rail_operator
        if (_modes.includes('rail_operator')){
            const $model = {model: _m.$RailOperator, as: 'rail_operator'};
            include.push({
                ...$model, required: false, attributes,
                where: {project_id: req.params.project_id},
            });
        }
        //Return Mode
        return {attributes, include, order};
    };

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects edit history.
    $Station.onSave = function(item, req){
        //name_search
        item._data.name_search = getSearchableNameString(item);
        //Done
        return item;
    };
    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $Station;

};