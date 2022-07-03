'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString,
} = require("./common");

module.exports = (sequelize) => {

    class $TrainVehicleSpec extends Model {
        static associate(models) {
            models.$TrainVehicleSpec.belongsTo(models.$TrainVehicleType, {
                as: 'train_vehicle_type',
                foreignKey: 'train_vehicle_type_id',
            });
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        train_vehicle_type_id: at.foreign_id(),
        name: at.name(),
        name_l: at.name_l(),
        remarks: at.remarks(),
        specs: at.object(),
        sort: at.sort(),
        //
        _data: at._data(),
        _results: at.object(),
        _results_by_kph: at.array(),
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
        modelName: '$TrainVehicleSpec',
        tableName: '_train_vehicle_specs',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $TrainVehicleSpec.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */

    //Default value for New Item
    $TrainVehicleSpec.new_default = {
        specs: {},
        _data: {},
        _results: {},
        _results_by_kph: [],
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $TrainVehicleSpec.sortables = {
        name: ($DIR, $lang) => {
            if (!$lang) return [['name', $DIR]];
            return [[`name_l.${$lang}`, $DIR]];
        },
        sort: ($DIR) => [['sort', $DIR]],
    };
    $TrainVehicleSpec.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $TrainVehicleSpec.filters = {
        train_vehicle_type_id: (val) => ({train_vehicle_type_id: val}),
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
    };

    //Default & max display limit
    $TrainVehicleSpec.limit_default = 25;
    $TrainVehicleSpec.limit_max = null;

    $TrainVehicleSpec.allow_duplicate = true;
    $TrainVehicleSpec.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $TrainVehicleSpec.getMode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  { exclude: excluded_fields };
        let include = [];
        let order = [];
        //Complex mode type (comma-separated)
        const _modes = (_mode || '').split(',');
        //Mode: results
        console.log(_modes);
        if (!_modes.includes('results')){
            attributes.exclude.push('_results', '_results_by_kph');
        }
        //Mode: train_vehicle_type
        if (_modes.includes('train_vehicle_type')){
            const $model = {model: _m.$TrainVehicleType, as: 'train_vehicle_type'};
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
    $TrainVehicleSpec.onSave = function(item, req){
        //name_search
        item._data.name_search = getSearchableNameString(item);
        //Done
        return item;
    };
    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $TrainVehicleSpec;

};