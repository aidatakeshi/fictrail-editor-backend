'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString,
} = require("./common");

module.exports = (sequelize) => {

    class $TrainServiceType extends Model {
        static associate(models) {
            models.$TrainServiceType.hasMany(models.$TrainServiceName, {
                as: 'train_service_name',
                foreignKey: 'train_service_type_id',
            });
            models.$TrainServiceType.belongsTo(models.$RailOperator, {
                as: 'rail_operator',
                foreignKey: 'rail_operator_id',
            });
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        rail_operator_id: at.foreign_id(),
        name: at.name(),
        name_l: at.name_l(),
        name_short: at.name_s(),
        name_short_l: at.name_l(),
        color: at.color(),
        color_text: at.color(),
        is_premium: at.boolean(),
        remarks: at.remarks(),
        sort: at.sort(),
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
        modelName: '$TrainServiceType',
        tableName: '_train_service_types',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $TrainServiceType.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */

    //Default value for New Item
    $TrainServiceType.new_default = {
        _data: {},
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $TrainServiceType.sortables = {
        name: ($DIR, $lang) => {
            if (!$lang) return [['name', $DIR]];
            return [[`name_l.${$lang}`, $DIR]];
        },
        name_short: ($DIR, $lang) => {
            if (!$lang) return [['name_short', $DIR]];
            return [[`name_short_l.${$lang}`, $DIR]];
        },
        sort: ($DIR) => [['sort', $DIR]],
    };
    $TrainServiceType.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $TrainServiceType.filters = {
        rail_operator_id: (val) => ({rail_operator_id: val}),
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
        premium: () => ({is_premium: true}),
        ordinary: () => ({is_premium: false}),
    };

    //Default & max display limit
    $TrainServiceType.limit_default = 25;
    $TrainServiceType.limit_max = null;

    $TrainServiceType.allow_duplicate = true;
    $TrainServiceType.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $TrainServiceType.getMode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  { exclude: excluded_fields };
        let include = [];
        let order = [];
        //Complex mode, separated by ',' (e.g. 'train_service_name,rail_operator')
        const _modes = (_mode || '').split(',');
        //Mode: train_service_name
        if (_modes.includes('train_service_name')){
            const $model = {model: _m.$TrainServiceName, as: 'train_service_name'};
            include.push({
                ...$model, required: false, attributes,
                where: {project_id: req.params.project_id},
            });
            order.push([$model, 'sort', 'ASC']);
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
    //Notice that the updated data affects _history.
    $TrainServiceType.onSave = function(item, req){
        //name_search
        item._data.name_search = getSearchableNameString(item);
        //Done
        return item;
    };

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $TrainServiceType;

};