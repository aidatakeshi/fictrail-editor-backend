'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString,
} = require("./common");

module.exports = (sequelize) => {

    class $TrainServiceName extends Model {
        static associate(models) {
            models.$TrainServiceName.belongsTo(models.$TrainServiceType, {
                as: 'train_service_type',
                foreignKey: 'train_service_type_id',
            });
            models.$TrainServiceName.belongsTo(models.$RailOperator, {
                as: 'rail_operator',
                foreignKey: 'major_rail_operator_id',
            });
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        train_service_type_id: at.foreign_id(),
        major_rail_operator_id: at.foreign_id(),
        name: at.name(),
        name_l: at.name_l(),
        name_short: at.name_s(),
        name_short_l: at.name_l(),
        color: at.color(),
        color_text: at.color(),
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
        modelName: '$TrainServiceName',
        tableName: '_train_service_names',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $TrainServiceName.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */

    //Default value for New Item
    $TrainServiceName.new_default = {
        _data: {},
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $TrainServiceName.sortables = {
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
    $TrainServiceName.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $TrainServiceName.filters = {
        rail_operator_id: (val) => ({major_rail_operator_id: val}),
        train_service_type_id: (val) => ({train_service_type_id: val}),
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
    };

    //Default & max display limit
    $TrainServiceName.limit_default = 25;
    $TrainServiceName.limit_max = null;

    $TrainServiceName.allow_duplicate = true;
    $TrainServiceName.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $TrainServiceName.getMode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  { exclude: excluded_fields };
        let include = [];
        let order = [];
        //Complex mode, separated by ',' (e.g. 'train_service_type,rail_operator')
        const _modes = (_mode || '').split(',');
        //Mode: train_service_type
        if (_modes.includes('train_service_type')){
            const $model = {model: _m.$TrainServiceType, as: 'train_service_type'};
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
    $TrainServiceName.onSave = function(item, req){
        //name_search
        item._data.name_search = getSearchableNameString(item);
        //Done
        return item;
    };
    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $TrainServiceName;

};