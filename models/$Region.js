'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { attributes:at } = require("./common");

module.exports = (sequelize) => {

    class $Region extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_attributes = {
        id: at.id_uuid(),
        project_id: at.project_id(),
        region_broader_id: at.foreign_id(),
        name: at.name(),
        name_l: at.name_l(),
        name_suffix: at.name(),
        name_suffix_l: at.name_l(),
        name_short: at.name(),
        name_short_l: at.name_l(),
        $name_full: {
            type: dt.VIRTUAL,
            get: function() {
                return $Region.combineWords(this.get('name'), this.get('name_suffix'));
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
                    name_full_l = $Region.combineWords(name_l[l], name_suffix_l[l]);
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
        modelName: '$Region',
        tableName: '_regions',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    $Region.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */
    
    //Default value for New Item
    $Region.new_default = {
    };

    //Sort modes (query: _sort, e.g. "id:asc", "id:desc")
    $Region.sorts = {
        name: ($DIR) => [['name', $DIR]],
        sort: ($DIR) => [['sort', $DIR]],
        area: ($DIR) => [['_area', $DIR]],
    };
    $Region.sort_default = [["sort", "ASC"]];

    //Filters (query: [filtername])
    $Region.filters = {
        region_broader_id: (val) => ({region_broader_id: val}),
        name: (val) => ({ _names: { [Op.iLike]: `%|${val}%`} }),
        name_contains: (val) => ({ _names: { [Op.iLike]: `%${val}%`} }),
        locked: () => ({is_locked: true}),
        unlocked: () => ({is_locked: false}),
    };

    //Default & max display limit
    $Region.limit_default = null;
    $Region.limit_max = null;

    $Region.allow_duplicate = true;
    $Region.allow_reorder = true;

    //Display Modes for GET methods (query: _mode).
    //get_modes[type] = {where, attributes, include, include.order}
    //It can also be a function (params: item, req) returning the above-mentioned object
    $Region.get_default = {
        attributes: { exclude: ['_names', 'polygons', '_land_polygons'] },
    };
    $Region.get_modes = {
        polygons: {
            attributes: { exclude: ['_names'] },
        },
    };

    //Custom data process function (params: item, req) used before saving in PUT, POST.
    //Notice that the updated data affects _history.
    $Region.on_save = function(item, req){
        //_names
        item._names = `|${$Region.combineWords(item.name, item.name_suffix)}`;
        for (let l in item.name_l) item._names += `|${$Region.combineWords(item.name_l[l], item.name_suffix_l[l])}`;
        item._names += `|${item.name_short}`;
        for (let l in item.name_short_l) item._names += `|${item.name_short_l[l]}`;
        //_land_polygon, _area
        //...
        //Done
        return item;
    };

    //Ignore fields in _history
    $Region.history_ignore_fields = [];

    /**
     * Model Specific Methods
     */
    //Combine words, keep space if 
    $Region.combineWords = function(word1, word2){
        let str = word1;
        if (word1.match(/^[0-9a-zA-Z]+$/)) str += " ";
        str += (word2 || "");
        return str;
    }
    
    //Return Model Class
    return $Region;

};