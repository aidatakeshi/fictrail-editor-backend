'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const {
    attributes:at, getSearchableNameString,
} = require("./common");

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
        _data: {
            length_km: null,
            x_min: null, x_max: null, y_min: null, y_max: null,
            name_search: '',
            station_ids: '',
        },
    };

    //Sort modes (query: _sort, e.g. "id:desc", "name:asc:en")
    $RailLineSub.sortables = {
        name: ($DIR, $lang) => {
            if (!$lang) return [['name', $DIR]];
            return [[`name_l.${$lang}`, $DIR]];
        },
        name_short: ($DIR, $lang) => {
            if (!$lang) return [['name_short', $DIR]];
            return [[`name_short_l.${$lang}`, $DIR]];
        },
        rail_line_id: ($DIR) => [['rail_line_id', $DIR]],
        rail_operator_id: ($DIR) => [['rail_operator_id', $DIR]],
        max_speed_kph: ($DIR) => [['max_speed_kph', $DIR]],
        length_km: ($DIR) => [['_data.length_km', $DIR]],
    };
    $RailLineSub.sort_default = [["name", "ASC"]];

    //Filters (query: [filtername])
    $RailLineSub.filters = {
        rail_line_id: (val) => ({rail_line_id: val}),
        rail_operator_id: (val) => ({rail_operator_id: val}),
        name: (val) => ({ '_data.name_search': { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ '_data.name_search': { [Op.iLike]: `%${val}%`} }),
        station_id: (val) => ({ '_data.station_ids': { [Op.iLike]: `|${val}%`} }),
    };

    //Default & max display limit
    $RailLineSub.limit_default = null;
    $RailLineSub.limit_max = null;

    $RailLineSub.allow_duplicate = true;
    $RailLineSub.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $RailLineSub.getMode = function(_mode, req, excluded_fields){
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
    $RailLineSub.onSave = async function(subline_data, req){
        let _data = {...$RailLineSub.new_default._data, ...subline_data._data};
        //Get Line
        const line = await $RailLineSub.getRailLine(subline_data);
        if (!line) return subline_data;
        //Update Length_km
        _data.length_km = $RailLineSub.getLengthInKm(subline_data.sections);
        //Update Bounding Box
        const sections = $RailLineSub.updateSectionsBoundingBoxes(subline_data.sections);
        _data = {..._data, ...$RailLineSub.getOverallBoundingBox(subline_data)};
        //name_search
        _data.name_search = getSearchableNameString(line.toJSON())
        + getSearchableNameString(subline_data);
        //Update Station IDs
        _data.station_ids = $RailLineSub.getStationIDs(subline_data.sections);
        //Call line (mother-type) to update
        line.onSubLineUpdated(subline_data);
        //Done
        return {...subline_data, _data};
    };

    /**
     * Association-Related
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
    $RailLineSub.prototype.getRailLine = async function(){
        return $RailLineSub.getRailLine(this);
    }

    //Called when Rail Line (mothertype) Item is updated
    $RailLineSub.prototype.onLineUpdated = async function(line_data){
        let _data = {...$RailLineSub.new_default._data, ...this._data};
        //name_search
        _data.name_search = getSearchableNameString(line_data)
         + getSearchableNameString(this.toJSON());
         //Update Me
        this._data = _data;
        this.changed('_data', true);
        this.save();
    }

    /**
     * Model Specific Methods
     */

    //Get Length in Km
    $RailLineSub.getLengthInKm = function(sections){
        return sections.map(s => s._distance_km)
        .filter(Number.isFinite).reduce((prev, curr) => (prev + curr), 0);
    }

    //Get Station IDs
    $RailLineSub.getStationIDs = function(sections){
        return sections.filter(s => s.station_id).map(s => `|${s.station_id}`).join('');
    }

    //Update Section Bounding Boxes
    $RailLineSub.updateSectionsBoundingBoxes = function(sections){
        for (let i in sections){
            const segments = sections[i].segments || [];
            const x_array = segments.map(s => s.x).filter(Number.isFinite);
            const y_array = segments.map(s => s.y).filter(Number.isFinite);
            sections[i]._x_min = Math.min(...x_array);
            sections[i]._x_max = Math.max(...x_array);
            sections[i]._y_min = Math.min(...y_array);
            sections[i]._y_max = Math.max(...y_array);
        }
        return sections;
    }
    
    //Get Overall Bounding Box
    $RailLineSub.getOverallBoundingBox = function(item){
        return {
            x_min: Math.min(...item.sections.map(s => s._x_min).filter(Number.isFinite)),
            x_max: Math.min(...item.sections.map(s => s._x_max).filter(Number.isFinite)),
            y_min: Math.min(...item.sections.map(s => s._y_min).filter(Number.isFinite)),
            y_max: Math.min(...item.sections.map(s => s._y_max).filter(Number.isFinite)),
        };
    }
    
    //Return Model Class
    return $RailLineSub;

};