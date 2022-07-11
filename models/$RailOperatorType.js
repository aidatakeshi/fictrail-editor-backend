'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString,
} = require("./common");

module.exports = (sequelize) => {

    class $RailOperatorType extends Model {
        static associate(models) {
            models.$RailOperatorType.hasMany(models.$RailOperator, {
                as: 'rail_operator',
                foreignKey: 'rail_operator_type_id',
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
        
    };

    const defaultScope = {
        where: { deleted_by: null },
    };

    const scopes = {
    };

    const model_options = {
        modelName: '$RailOperatorType',
        tableName: '_rail_operator_types',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $RailOperatorType.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */

    //Default value for New Item
    $RailOperatorType.new_default = {
        _data: {},
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $RailOperatorType.sortables = {
        name: ($DIR, $lang) => {
            if (!$lang) return [['name', $DIR]];
            return [[`name_l.${$lang}`, $DIR]];
        },
        sort: ($DIR) => [['sort', $DIR]],
    };
    $RailOperatorType.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $RailOperatorType.filters = {
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
    };

    //Default & max display limit
    $RailOperatorType.limit_default = null;
    $RailOperatorType.limit_max = null;

    $RailOperatorType.allow_duplicate = true;
    $RailOperatorType.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $RailOperatorType.getMode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  { exclude: excluded_fields };
        let include = [];
        let order = [];
        //Mode: rail_operator
        if (_mode == 'rail_operator'){
            const $model = {model: _m.$RailOperator, as: 'rail_operator'};
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
    //Notice that the updated data affects edit history.
    $RailOperatorType.onSave = function(item, req){
        //name_search
        item._data.name_search = getSearchableNameString(item);
        //Done
        return item;
    };

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $RailOperatorType;

};