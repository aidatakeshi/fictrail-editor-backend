'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString,
} = require("./common");

module.exports = (sequelize) => {

    class $RailOperator extends Model {
        static associate(models) {
            models.$RailOperator.belongsTo(models.$RailOperatorType, {
                as: 'rail_operator_type',
                foreignKey: 'rail_operator_type_id',
            });
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        rail_operator_type_id: at.foreign_id(),
        name: at.name(),
        name_l: at.name_l(),
        name_short: at.name_s(),
        name_short_l: at.name_l(),
        color: at.color(),
        color_text: at.color(),
        logo_file_key: at.file_key(),
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
        modelName: '$RailOperator',
        tableName: '_rail_operators',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $RailOperator.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */

    //Default value for New Item
    $RailOperator.new_default = {
        _data: {},
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $RailOperator.sortables = {
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
    $RailOperator.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $RailOperator.filters = {
        rail_operator_type_id: (val) => ({rail_operator_type_id: val}),
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
    };

    //Default & max display limit
    $RailOperator.limit_default = 25;
    $RailOperator.limit_max = null;

    $RailOperator.allow_duplicate = true;
    $RailOperator.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $RailOperator.getMode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  { exclude: excluded_fields };
        let include = [];
        let order = [];
        //Mode: rail_operator_type
        if (_mode == 'rail_operator_type'){
            const $model = {model: _m.$RailOperatorType, as: 'rail_operator_type'};
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
    $RailOperator.onSave = function(item, req){
        //name_search
        item._data.name_search = getSearchableNameString(item);
        //Done
        return item;
    };
    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $RailOperator;

};