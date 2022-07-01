'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { attributes:at, combineWords } = require("./common");

module.exports = (sequelize) => {

    class $RegionSub extends Model {
        static associate(models) {
            models.$RegionSub.belongsTo(models.$Region, {
                as: 'region',
                foreignKey: 'region_id',
            });
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        region_id: at.foreign_id(),
        name: at.name(),
        name_l: at.name_l(),
        name_suffix: at.name_s(),
        name_suffix_l: at.name_l(),
        name_short: at.name_s(),
        name_short_l: at.name_l(),
        $name_full: {
            type: dt.VIRTUAL,
            get: function() {
                return combineWords(this.get('name'), this.get('name_suffix'));
            },
            set: () => {},
        },
        $name_full_l: {
            type: dt.VIRTUAL,
            get: function() {
                const name_l = this.get('name_l');
                const name_suffix_l = this.get('name_suffix_l');
                let name_full_l = {};
                for (let l in name_l){
                    name_full_l = combineWords(name_l[l], name_suffix_l[l]);
                }
                return name_full_l;
            },
            set: () => {},
        },
        remarks: at.remarks(),
        is_locked: at.is_locked(),
        polygons: at.polygons(),
        sort: at.sort(),
        _land_polygons: at.polygons(),
        _area: at._decimal(),
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
        modelName: '$RegionSub',
        tableName: '_regions_sub',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $RegionSub.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */
    
    //Default value for New Item
    $RegionSub.new_default = {
    };

    //Sort modes (query: _sort, e.g. "id:asc", "id:desc")
    $RegionSub.sorts = {
        name: ($DIR) => [['name', $DIR]],
        sort: ($DIR) => [['sort', $DIR]],
        area: ($DIR) => [['_area', $DIR]],
    };
    $RegionSub.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $RegionSub.filters = {
        region_id: (val) => ({region_id: val}),
        name: (val) => ({ _names: { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ _names: { [Op.iLike]: `%${val}%`} }),
        locked: () => ({is_locked: true}),
        unlocked: () => ({is_locked: false}),
    };

    //Default & max display limit
    $RegionSub.limit_default = null;
    $RegionSub.limit_max = null;

    $RegionSub.allow_duplicate = true;
    $RegionSub.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //Returns {where, attributes, include, order}
    $RegionSub.get_mode = function(_mode, req, excluded_fields){
        const _m = sequelize.models;
        let attributes =  { exclude: ['_names'].concat(excluded_fields) };
        let include = [];
        let order = [];
        //Complex mode, separated by ',' (e.g. 'region,polygons')
        const _modes = (_mode || '').split(',');
        //Mode: polygons
        if (!_modes.includes('polygons')){
            attributes.exclude = attributes.exclude.concat(['polygons', '_land_polygons']);
        }
        //Mode: region, region_broader
        if (_modes.includes('region') || _modes.includes('region_broader')){
            const $model = {model: _m.$Region, as: 'region'};
            const $model_b = {model: _m.$RegionBroader, as: 'region_broader'};
            let include_item = {
                ...$model, required: false, attributes,
                where: {project_id: req.params.project_id},
            };
            if (_modes.includes('region_broader')){
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
    $RegionSub.on_save = function(item, req){
        //_names
        item._names = `|${combineWords(item.name, item.name_suffix)}`;
        for (let l in item.name_l) item._names += `|${combineWords(item.name_l[l], item.name_suffix_l[l])}`;
        if (item.name_short) item._names += `|${item.name_short}`;
        for (let l in item.name_short_l) item._names += `|${item.name_short_l[l]}`;
        //_land_polygon, _area
        //...
        //Done
        return item;
    };

    //Ignore fields in _history
    $RegionSub.history_ignore_fields = [];

    /**
     * Model Specific Methods
     */
    
    //Return Model Class
    return $RegionSub;

};