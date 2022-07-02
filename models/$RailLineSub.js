'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { attributes:at, combineWords } = require("./common");

module.exports = (sequelize) => {

    class $RailLineSub extends Model {
        static associate(models) {
            models.$RailLineSub.belongsTo(models.$RailLine, {
                as: 'rail_line',
                foreignKey: 'rail_line_id',
            });
            models.$RailLineSub.belongsTo(models.$RailOperator, {
                as: 'rail_operator',
                foreignKey: 'rail_operator_id',
            });
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        rail_line_id: at.foreign_id(),
        rail_operator_id: at.foreign_id(),
        name: at.name(),
        name_l: at.name_l(),
        name_short: at.name_s(),
        name_short_l: at.name_l(),
        color: at.color(),
        color_text: at.color(),
        remarks: at.remarks(),
        max_speed_kph: at.decimal(),
        sections: ({ type: dt.JSON, allowNull: false, defaultValue: [] }),
        _length_km: at.decimal(),
        _x_min: at.decimal(),
        _x_max: at.decimal(),
        _y_min: at.decimal(),
        _y_max: at.decimal(),
        _names: at._names(),
        _station_ids: at._ids(),
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
        modelName: '$RailLineSub',
        tableName: '_rail_lines_sub',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $RailLineSub.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */
    
    //Default value for New Item
    $RailLineSub.new_default = {
    };

    //Sort modes (query: _sort, e.g. "id:asc", "id:desc")
    $RailLineSub.sorts = {
        name: ($DIR) => [['name', $DIR]],
        name_short: ($DIR) => [['name_short', $DIR]],
        rail_line_id: ($DIR) => [['rail_line_id', $DIR]],
        rail_operator_id: ($DIR) => [['rail_operator_id', $DIR]],
        max_speed_kph: ($DIR) => [['max_speed_kph', $DIR]],
        length_km: ($DIR) => [['_length_km', $DIR]],
    };
    $RailLineSub.sort_default = [["name", "ASC"]];

    //Filters (query: [filtername])
    $RailLineSub.filters = {
        rail_line_id: (val) => ({rail_line_id: val}),
        rail_operator_id: (val) => ({rail_operator_id: val}),
        name: (val) => ({ _names: { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ _names: { [Op.iLike]: `%${val}%`} }),
    };

    //Default & max display limit
    $RailLineSub.limit_default = null;
    $RailLineSub.limit_max = null;

    $RailLineSub.allow_duplicate = true;
    $RailLineSub.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $RailLineSub.get_mode = function(_mode, req, excluded_fields){
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
        //Mode: rail_line, rail_line_type
        if (_modes.includes('rail_line') || _modes.includes('rail_line_type')){
            const $model = {model: _m.$RailLine, as: 'rail_line'};
            const $model_b = {model: _m.$RailLineType, as: 'rail_line_type'};
            let include_item = {
                ...$model, required: false, attributes,
                where: {project_id: req.params.project_id},
            };
            if (_modes.includes('rail_line_type')){
                include_item.include = {
                    ...$model_b, required: false, attributes,
                    where: {project_id: req.params.project_id},
                };
            }
            include.push(include_item);
        }
        //Mode: rail_operator, rail_operator_type
        if (_modes.includes('rail_operator') || _modes.includes('rail_operator_type')){
            const $model = {model: _m.$RailOperator, as: 'rail_operator'};
            const $model_b = {model: _m.$RailOperatorType, as: 'rail_operator_type'};
            let include_item = {
                ...$model, required: false, attributes,
                where: {project_id: req.params.project_id},
            };
            if (_modes.includes('rail_operator_type')){
                include_item.include = {
                    ...$model_b, required: false, attributes,
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
    $RailLineSub.on_save = async function(item, req){
        const line = await $RailLineSub.getRailLine(item);
        if (!line) return item;
        //_names
        item._names = $RailLineSub.getNamesForSearching(item, line);
        //Update Bounding Box
        item = $RailLineSub.updateBoundingBox(item);
        //Update Length_km
        item._length_km = $RailLineSub.getLengthInKm(item.sections);
        //Update Station IDs
        item._station_ids = $RailLineSub.getStationIDs(item.sections);
        //Call line (mother-type) to update
        line.sub_line_is_updated(item);
        //Done
        return item;
    };

    /**
     * Model Specific Methods
     */

    //Get Rail Line (mothertype) Item
    $RailLineSub.getRailLine = async function(subline){
        //Fetch name of rail line
        const line = await sequelize.models.$RailLine.findOne({where: {
            project_id: subline.project_id,
            id: subline.rail_line_id,
        }});
        return line;
    }

    //Called when Rail Line (mothertype) Item is updated
    $RailLineSub.prototype.line_is_updated = async function(line){
        await this.update({
            _names: $RailLineSub.getNamesForSearching(this.toJSON(), line),
        });
    }

    //Get Names for Searching
    $RailLineSub.getNamesForSearching = function(subline, line){
        let _name = '';
        //Line
        if (line.name) _name += `|${line.name}`;
        for (let l in line.name_l) _name += `|${line.name_l[l]}`;
        if (line.name_short) _name += `|${line.name_short}`;
        for (let l in line.name_short_l) _name += `|${line.name_short_l[l]}`;
        //Subline
        _name += `|${subline.name}`;
        for (let l in subline.name_l) _name += `|${subline.name_l[l]}`;
        if (subline.name_short) _name += `|${subline.name_short}`;
        for (let l in subline.name_short_l) _name += `|${subline.name_short_l[l]}`;
        return _name;
    }

    //Get Length in Km
    $RailLineSub.getLengthInKm = function(sections){
        const values = sections.filter(s => s._distance_km).map(s => s._distance_km);
        return values.reduce((prev, curr) => (prev + curr), 0);
    }

    //Get Station IDs
    $RailLineSub.getStationIDs = function(sections){
        return sections.filter(s => s.station_id).map(s => `|${s.station_id}`).join('');
    }
    
    //Update Bounding Box
    $RailLineSub.updateBoundingBox = function(item){
        const finite = Number.isFinite;
        for (let i in item.sections){
            const segments = item.sections[i].segments || [];
            const x_array = segments.filter(s => finite(s.x)).map(s => s.x);
            const y_array = segments.filter(s =>finite(s.y)).map(s => s.y);
            item.sections[i]._x_min = Math.min(...x_array);
            item.sections[i]._x_max = Math.max(...x_array);
            item.sections[i]._y_min = Math.min(...y_array);
            item.sections[i]._y_max = Math.max(...y_array);
        }
        item._x_min = Math.min(...item.sections.filter(s => finite(s._x_min)).map(s => s._x_min));
        item._x_max = Math.min(...item.sections.filter(s => finite(s._x_max)).map(s => s._x_max));
        item._y_min = Math.min(...item.sections.filter(s => finite(s._y_min)).map(s => s._y_min));
        item._y_max = Math.min(...item.sections.filter(s => finite(s._y_max)).map(s => s._y_max));
        return item;
    }
    
    //Return Model Class
    return $RailLineSub;

};