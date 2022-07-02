'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { attributes:at } = require("./common");

module.exports = (sequelize) => {

    class $RailLine extends Model {
        static associate(models) {
            models.$RailLine.belongsTo(models.$RailLineType, {
                as: 'rail_line_type',
                foreignKey: 'rail_line_type_id',
            });
            models.$RailLine.hasMany(models.$RailLineSub, {
                as: 'rail_line_sub',
                foreignKey: 'rail_line_id',
            });
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        rail_line_type_id: at.foreign_id(),
        name: at.name(),
        name_l: at.name_l(),
        name_short: at.name_s(),
        name_short_l: at.name_l(),
        remarks: at.remarks(),
        //
        _names: at._names(),
        _rail_operator_ids: at._ids(),
        _length_km: at.decimal(),
        _x_min: at.decimal(),
        _x_max: at.decimal(),
        _y_min: at.decimal(),
        _y_max: at.decimal(),
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
        modelName: '$RailLine',
        tableName: '_rail_lines',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $RailLine.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */

    //Default value for New Item
    $RailLine.new_default = {
    };

    //Sort modes (query: _sort, e.g. "id:asc", "id:desc")
    $RailLine.sorts = {
        name: ($DIR) => [['name', $DIR]],
        name_short: ($DIR) => [['name_short', $DIR]],
        rail_line_type_id: ($DIR) => [['rail_line_type_id', $DIR]],
        length_km: ($DIR) => [['_length_km', $DIR]],
    };
    $RailLine.sort_default = [["name", "ASC"]];

    //Filters (query: [filtername])
    $RailLine.filters = {
        rail_line_type_id: (val) => ({rail_line_type_id: val}),
        name: (val) => ({ _names: { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ _names: { [Op.iLike]: `%${val}%`} }),
    };

    //Default & max display limit
    $RailLine.limit_default = 25;
    $RailLine.limit_max = null;

    $RailLine.allow_duplicate = true;
    $RailLine.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $RailLine.get_mode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let exclude = excluded_fields.concat([
            '_names', '_station_ids', '_rail_operator_ids'
        ]);
        let attributes =  { exclude };
        let include = [];
        let order = [];
        //Complex mode, separated by ',' (e.g. 'rail_line,sections')
        const _modes = (_mode || '').split(',');
        //Mode: sections
        if (!_modes.includes('sections')){
            attributes.exclude = attributes.exclude.concat(['sections']);
        }
        //Mode: rail_line_type
        if (_modes.includes('rail_line_type')){
            const $model = {model: _m.$RailLineType, as: 'rail_line_type'};
            include.push({
                ...$model, required: false, attributes,
                where: {project_id: req.params.project_id},
            });
        }
        //Mode: rail_line_sub, rail_operator
        if (_modes.includes('rail_line_sub') || _modes.includes('rail_operator')){
            const $model = {model: _m.$RailLineSub, as: 'rail_line_sub'};
            const $model_o = {model: _m.$RailOperator, as: 'rail_operator'};
            let include_item = {
                ...$model, required: false, attributes,
                where: {project_id: req.params.project_id},
            };
            order.push([$model, 'name', 'ASC']);
            if (_modes.includes('rail_operator')){
                include_item.include = {
                    ...$model_o, required: false, attributes,
                    where: {project_id: req.params.project_id},
                };
            }
            include.push(include_item);
        }
        //Return Mode
        return {attributes, include, order};
    };

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects _history.
    $RailLine.on_save = async function(item, req){
        //_names
        item._names = `|${item.name}`;
        for (let l in item.name_l) item._names += `|${item.name_l[l]}`;
        if (item.name_short) item._names = `|${item.name_short}`;
        for (let l in item.name_short_l) item._names += `|${item.name_short_l[l]}`;
        //Call sub-lines to update
        const sub_lines = await $RailLine.getSubLines(item);
        for (const sub_line of sub_lines){
            await sub_line.line_is_updated(item);
        }
        //Done
        return item;
    };

    /**
     * Model Specific Methods
     */

    //Get Sub-Line (childrentype) Items
    $RailLine.getSubLines = async function(line){
        const sub_lines = await sequelize.models.$RailLineSub.findAll({where: {
            project_id: line.project_id,
            rail_line_id: line.id,
        }});
        return sub_lines;
    }

    //Called Sub-Line (childrentype) Item is updated
    $RailLine.prototype.sub_line_is_updated = async function(item){
        let data = {};
        //Get My Sub-lines
        const sub_lines_obj = await $RailLine.getSubLines(this);
        let sub_lines = sub_lines_obj.map(item => item.toJSON());
        for (let i in sub_lines){
            if (sub_lines[i].id == item.id) sub_lines.splice(i, 1);
        }
        //Set _x/y_min/max
        data = {
            _x_min: Math.min(...sub_lines.filter(s => Number.isFinite(s._x_min)).map(s => s._x_min)),
            _x_max: Math.max(...sub_lines.filter(s => Number.isFinite(s._x_max)).map(s => s._x_max)),
            _y_min: Math.min(...sub_lines.filter(s => Number.isFinite(s._y_min)).map(s => s._y_min)),
            _y_max: Math.max(...sub_lines.filter(s => Number.isFinite(s._y_max)).map(s => s._y_max)),
        ...data};
        //Set _length_km
        data._length_km = sub_lines.filter(s => Number.isFinite(s._length_km)).map(s => s._length_km)
        .reduce((prev, curr) => (prev + curr), 0);
        //Set _rail_operator_ids
        data._rail_operator_ids = sub_lines.filter(s => s.rail_operator_id).map(s => `|${s.rail_operator_id}`)
        .filter((val, index, self) => (self.indexOf(val) === index)).join('');
        //Update Me
        await this.update(data);
    };
    
    //Return Model Class
    return $RailLine;

};