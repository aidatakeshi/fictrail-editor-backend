'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { attributes:at } = require("./common");

module.exports = (sequelize) => {

    class $RailLineType extends Model {
        static associate(models) {
            models.$RailLineType.hasMany(models.$RailLine, {
                as: 'rail_line',
                foreignKey: 'rail_line_type_id',
            });
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        name: at.name(),
        name_l: at.name_l(),
        remarks: at.remarks(),
        map_color: at.color(),
        map_thickness: at.integer(),
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
        modelName: '$RailLineType',
        tableName: '_rail_line_types',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $RailLineType.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */

    //Default value for New Item
    $RailLineType.new_default = {
    };

    //Sort modes (query: _sort, e.g. "id:asc", "id:desc")
    $RailLineType.sorts = {
        name: ($DIR) => [['name', $DIR]],
        sort: ($DIR) => [['sort', $DIR]],
    };
    $RailLineType.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $RailLineType.filters = {
        name: (val) => ({ _names: { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ _names: { [Op.iLike]: `%${val}%`} }),
    };

    //Default & max display limit
    $RailLineType.limit_default = null;
    $RailLineType.limit_max = null;

    $RailLineType.allow_duplicate = true;
    $RailLineType.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $RailLineType.get_mode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  { exclude: ['_names'].concat(excluded_fields) };
        let include = [];
        let order = [];
        //Mode: rail_line
        if (_mode == 'rail_line'){
            const $model = {model: _m.$RailLine, as: 'rail_line'};
            include.push({
                ...$model, required: false, attributes,
                where: {project_id: req.params.project_id},
            });
            order.push([$model, 'name', 'ASC']);
        }
        //Return Mode
        return {attributes, include, order};
    };

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects _history.
    $RailLineType.on_save = function(item, req){
        //_names
        item._names = `|${item.name}`;
        for (let l in item.name_l) item._names += `|${item.name_l[l]}`;
        //Done
        return item;
    };

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $RailLineType;

};