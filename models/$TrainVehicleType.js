'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString,
} = require("./common");

module.exports = (sequelize) => {

    class $TrainVehicleType extends Model {
        static associate(models) {
            models.$TrainVehicleType.hasMany(models.$TrainVehicleSpec, {
                as: 'train_vehicle_spec',
                foreignKey: 'train_vehicle_type_id',
            });
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        name: at.name(),
        name_l: at.name_l(),
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
        modelName: '$TrainVehicleType',
        tableName: '_train_vehicle_types',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $TrainVehicleType.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */

    //Default value for New Item
    $TrainVehicleType.new_default = {
        _data: {},
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $TrainVehicleType.sortables = {
        name: ($DIR, $lang) => {
            if (!$lang) return [['name', $DIR]];
            return [[`name_l.${$lang}`, $DIR]];
        },
        sort: ($DIR) => [['sort', $DIR]],
    };
    $TrainVehicleType.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $TrainVehicleType.filters = {
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
    };

    //Default & max display limit
    $TrainVehicleType.limit_default = null;
    $TrainVehicleType.limit_max = null;

    $TrainVehicleType.allow_duplicate = true;
    $TrainVehicleType.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $TrainVehicleType.getMode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  {
            exclude: excluded_fields.concat('_results', '_results_by_kph'),
        };
        let include = [];
        let order = [];
        //Mode: train_vehicle_spec
        if (_mode == 'train_vehicle_spec'){
            const $model = {model: _m.$TrainVehicleSpec, as: 'train_vehicle_spec'};
            include.push({
                ...$model, required: false, attributes,
                where: {project_id: req.params.project_id},
            });
            order.push([$model, 'sort', 'ASC']);
        }
        //Return Mode
        return {attributes, include, order};
    };

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects _history.
    $TrainVehicleType.onSave = function(item, req){
        //name_search
        item._data.name_search = getSearchableNameString(item);
        //Done
        return item;
    };

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $TrainVehicleType;

};