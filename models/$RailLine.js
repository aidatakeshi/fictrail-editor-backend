'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString,
} = require("./common");

const {sum, sumObjects} = require('../includes/misc');

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
        _data: {
            length_km: null,
            x_min: null, x_max: null, y_min: null, y_max: null,
            name_search: '',
            rail_operator_ids: '',
        },
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $RailLine.sortables = {
        name: ($DIR, $lang) => {
            if (!$lang) return [['name', $DIR]];
            return [[`name_l.${$lang}`, $DIR]];
        },
        name_short: ($DIR, $lang) => {
            if (!$lang) return [['name_short', $DIR]];
            return [[`name_short_l.${$lang}`, $DIR]];
        },
        rail_line_type_id: ($DIR) => [['rail_line_type_id', $DIR]],
        length_km: ($DIR) => [['_data.length_km', $DIR]],
    };
    $RailLine.sort_default = [["name", "ASC"]];

    //Filters (query: [filtername])
    $RailLine.filters = {
        rail_line_type_id: (val) => ({rail_line_type_id: val}),
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
        rail_operator_id: (val) => ({ '_data.rail_operator_ids': { [Op.iLike]: `|${val}%`} }),
    };

    //Default & max display limit
    $RailLine.limit_default = 25;
    $RailLine.limit_max = null;

    $RailLine.allow_duplicate = true;
    $RailLine.allow_reorder = false;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $RailLine.getMode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  { exclude: excluded_fields };
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
    $RailLine.onSave = async function(line_data, req){
        let _data = {...$RailLine.new_default._data, ...line_data._data};
        //name_search
        _data.name_search = getSearchableNameString(line_data);
        //Call sub-lines to update
        const sublines = await $RailLine.getSubLines(line_data);
        if (sublines){
            for (const subline of sublines){
                await subline.onLineUpdated(line_data);
            }
        }
        //Done
        return {...line_data, _data};
    };

    /**
     * Association-Related
     */

    //Get Sub-Line (childrentype) Items
    $RailLine.getSubLines = async function(line){
        try{
            let sub_lines = await sequelize.models.$RailLineSub.findAll({where: {
                project_id: line.project_id,
                rail_line_id: line.id,
            }});
            return sub_lines;
        }catch(error){
            return null;
        }
    }
    $RailLine.prototype.getSubLines = async function(){
        return await $RailLine.getSubLines(this);
    }

    //Called Sub-Line (childrentype) Item is updated
    $RailLine.prototype.onSubLineUpdated = async function(subline_data = null){
        let _data = {...$RailLine.new_default._data, ...this._data};
        //Get Sub-Lines
        const sublines = await $RailLine.getSubLines(this);
        let sublines_data = sublines.map(item => item.toJSON());
        //Replace old data with new data
        if (subline_data){
            for (let i in sublines_data){
                if (sublines_data[i].id == subline_data.id){
                    sublines_data[i] = subline_data;
                }
            }
        }
        //Set x/y_min/max
        _data.x_min = Math.min(...sublines_data.map(sl => sl._data.x_min).filter(Number.isFinite));
        _data.x_max = Math.max(...sublines_data.map(sl => sl._data.x_max).filter(Number.isFinite));
        _data.y_min = Math.min(...sublines_data.map(sl => sl._data.y_min).filter(Number.isFinite));
        _data.y_max = Math.max(...sublines_data.map(sl => sl._data.y_max).filter(Number.isFinite));
        //Set length_km
        _data.length_km = sum(sublines_data.map(sl => sl._data.length_km).filter(Number.isFinite));
        //Set rail_operator_ids
        _data.rail_operator_ids = sublines_data.map(sl => `|${sl.rail_operator_id}`)
        .filter((val, index, self) => (self.indexOf(val) === index)).join('');
        //Update Me
        this._data = _data;
        this.changed('_data', true);
        this.save();
    };

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $RailLine;

};