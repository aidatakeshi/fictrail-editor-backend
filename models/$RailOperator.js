'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { attributes:at } = require("./common");

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
    };

    //Sort modes (query: _sort, e.g. "id:asc", "id:desc")
    $RailOperator.sorts = {
        name: ($DIR) => [['name', $DIR]],
        sort: ($DIR) => [['sort', $DIR]],
    };
    $RailOperator.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $RailOperator.filters = {
        rail_operator_type_id: (val) => ({rail_operator_type_id: val}),
        name: (val) => ({ _names: { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ _names: { [Op.iLike]: `%${val}%`} }),
    };

    //Default & max display limit
    $RailOperator.limit_default = null;
    $RailOperator.limit_max = null;

    $RailOperator.allow_duplicate = true;
    $RailOperator.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $RailOperator.get_mode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  { exclude: ['_names'].concat(excluded_fields) };
        let include = [];
        let order = [];
        //Mode: rail_operator_type
        if (_mode == 'rail_operator_type'){
            const $model = {model: _m.$RailOperatorType, as: 'rail_operator_type'};
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
    $RailOperator.on_save = function(item, req){
        //_names
        item._names = `|${item.name}`;
        for (let l in item.name_l) item._names += `|${item.name_l[l]}`;
        if (item.name_short) item._names = `|${item.name_short}`;
        for (let l in item.name_short_l) item._names += `|${item.name_short_l[l]}`;
        //Done
        return item;
    };

    //Ignore fields in _history
    $RailOperator.history_ignore_fields = [];

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $RailOperator;

};