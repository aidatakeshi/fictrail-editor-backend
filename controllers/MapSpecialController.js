const $RailLineType = $models.$RailLineType;
const $RailLine = $models.$RailLine;
const $RailLineSub = $models.$RailLineSub;
const $RailOperatorType = $models.$RailOperatorType;
const $RailOperator = $models.$RailOperator;
const $Station = $models.$Station;
const $Region = $models.$Region;

const { QueryTypes, Op } = require('sequelize');
const {e, val_e, w} = require("./common");
const {getObjectExceptField} = require('../includes/misc');

const { v4: uuid } = require('uuid');
const multer  = require('multer');
const fs = require('fs-extra');

/**
 * Note: 404 "project_not_found" already handled in AuthMiddleware
 */

/**
 * GET /p/:project_id/map-display
 */
exports.mapDisplay = async (req, res) => { await w(res, async (t) => {

    const options = {
        ...req.params,
        ...req.query,
    };

    //Params: x_min, x_max, y_min, y_max, zoom
    //Check if they are all valid decimals
    for (let param of ['x_min', 'x_max', 'y_min', 'y_max', 'logzoom']){
        if (!options[param]){
            return e(400, res, "missing_params", "Missing Params");
        }
        if (isNaN(options[param] = parseFloat(options[param]))){
            return e(400, res, "invalid_params", "Invalid Params");
        }
    }
    
    if (!options.type){
        let data = {};
        for (let type in functionByType){
            data[type] = await functionByType[type](options, t);
        }
        return res.send({data});
    }else if (functionByType[options.type]){
        return res.send({
            data: await functionByType[options.type](options, t),
        })
    }

    return e(400, res, "route_not_found", "Route Not Found");

})};

//regions, regions_sub
const getRegions = async function(options, t){

    //Get regions_sub
    let [result_sub, meta_sub] = await $models.sequelize.query(`
        select "id", "region_id", "name", "name_l", "name_suffix", "name_suffix_l","name_short", "name_short_l",
        "polygons", "is_locked",
        cast("_polygons"->>'land' as json) as "_polygons.land",
        cast("_data"->>'land_area' as decimal) as "_data.land_area"
        from "_regions_sub"
        where "project_id" = :project_id
        and (cast(_data->>'x_min' as decimal) <= :x_max or _data->>'x_min' is null)
        and (cast(_data->>'x_max' as decimal) >= :x_min or _data->>'x_max' is null)
        and (cast(_data->>'y_min' as decimal) <= :y_max or _data->>'y_min' is null)
        and (cast(_data->>'y_max' as decimal) >= :y_min or _data->>'y_max' is null)
        order by "sort" asc
    `, { replacements: options, ...t });

    result_sub = result_sub.map(item => ({
        ...item,
        "polygons": roundValuePolygons(item["polygons"], options),
        "_polygons.land": roundValuePolygons(item["_polygons.land"], options),
    }));

    let result_sub_by_region_id = {};

    for (const item of result_sub){
        if (!result_sub_by_region_id[item.region_id]){
            result_sub_by_region_id[item.region_id] = [];
        }
        result_sub_by_region_id[item.region_id].push(getObjectExceptField(item, 'region_id'));
    }

    //Get regions
    let [result, meta] = await $models.sequelize.query(`
        select "id", "name", "name_l", "name_suffix", "name_suffix_l", "name_short", "name_short_l",
        "polygons", "is_locked",
        cast("_polygons"->>'land' as json) as "_polygons.land",
        cast("_data"->>'land_area' as decimal) as "_data.land_area"
        from "_regions"
        where "project_id" = :project_id
        and (cast(_data->>'x_min' as decimal) <= :x_max or _data->>'x_min' is null)
        and (cast(_data->>'x_max' as decimal) >= :x_min or _data->>'x_max' is null)
        and (cast(_data->>'y_min' as decimal) <= :y_max or _data->>'y_min' is null)
        and (cast(_data->>'y_max' as decimal) >= :y_min or _data->>'y_max' is null)
        order by "sort" asc
    `, { replacements: options, ...t });
    result = result.map(item => ({
        ...item,
        region_sub: result_sub_by_region_id[item.id] || [],
        "polygons": roundValuePolygons(item["polygons"], options),
        "_polygons.land": roundValuePolygons(item["_polygons.land"], options),
    }));

    return result;
}

//map_ref_images
const getMapRefImages = async function(options, t){

    let [result, meta] = await $models.sequelize.query(`
        select "id", "name", "name_l", "file_key", "is_locked",
        "x_min", "x_max", "y_min", "y_max"
        from "_map_ref_images"
        where "project_id" = :project_id
        and "x_min" <= :x_max or "x_min" is null
        and "x_max" >= :x_min or "x_max" is null
        and "y_min" <= :y_max or "y_min" is null
        and "y_max" >= :y_min or "y_max" is null
        and "hide_below_logzoom" <= :logzoom
        order by "sort" asc
    `, { replacements: options, ...t });

    return result;

}

//map_lands, map_waters
const getMapLandsOrWaters = async function(type, options, t){

    let [result, meta] = await $models.sequelize.query(`
        select "id", "name", "name_l", "polygons", "is_locked",
        cast("_data"->>'area' as decimal) as "_data.area"
        from "_${type}"
        where "project_id" = :project_id
        and (cast(_data->>'x_min' as decimal) <= :x_max or _data->>'x_min' is null)
        and (cast(_data->>'x_max' as decimal) >= :x_min or _data->>'x_max' is null)
        and (cast(_data->>'y_min' as decimal) <= :y_max or _data->>'y_min' is null)
        and (cast(_data->>'y_max' as decimal) >= :y_min or _data->>'y_max' is null)
        and "hide_below_logzoom" <= :logzoom
        order by "sort" asc
    `, { replacements: options, ...t });

    return result.map(item => ({
        ...item,
        "polygons": roundValuePolygons(item["polygons"], options),
    }));

}

const getMapLands = async function(options, t){
    return await getMapLandsOrWaters('map_lands', options, t);
}

const getMapWaters = async function(options, t){
    return await getMapLandsOrWaters('map_waters', options, t);
}

//rail_lines, rail_line_sub
const getRailLines = async function(options, t){

    const _RL = `"_rail_lines"`;
    const _RLT = `"_rail_line_types"`;

    //Get rail_lines
    let [result, meta] = await $models.sequelize.query(`
        select ${_RL}."id", ${_RL}."name", ${_RL}."name_l",
        ${_RL}."name_short",${_RL}."name_short_l",
        ${_RL}._data->>'length_km' as "_data.length_km"
        from ${_RL}
        inner join ${_RLT} on ${_RLT}."id" = ${_RL}."rail_line_type_id"
        where ${_RL}."project_id" = :project_id
        and ${_RLT}."project_id" = :project_id 
        and (cast(${_RL}._data->>'x_min' as decimal) <= :x_max or ${_RL}._data->>'x_min' is null)
        and (cast(${_RL}._data->>'x_max' as decimal) >= :x_min or ${_RL}._data->>'x_max' is null)
        and (cast(${_RL}._data->>'y_min' as decimal) <= :y_max or ${_RL}._data->>'y_min' is null)
        and (cast(${_RL}._data->>'y_max' as decimal) >= :y_min or ${_RL}._data->>'y_max' is null)
        and "hide_below_logzoom" <= 0
    `, { replacements: options, ...t });

    result = result.map(item => {
        item['_data.length_km'] = parseFloat(item['_data.length_km']);
        item.rail_line_sub = [];
        return item;
    });

    const rail_line_ids = result.map(item => item.id);

    const _RLS = `"_rail_lines_sub"`;
    const _RO = `"_rail_operators"`;

    //Get rail_lines_sub
    let [result_sub, meta_sub] = await $models.sequelize.query(`
        select ${_RLS}."rail_line_id", ${_RLS}."id",
        ${_RLS}."name", ${_RLS}."name_l", ${_RLS}."name_short", ${_RLS}."name_short_l",
        ${_RLS}."color", ${_RLS}."color_text", ${_RLS}."sections",
        ${_RLS}."_data"->>'length_km' as "_data.length_km",
        json_build_object(
            'name', ${_RO}."name", 'name_short', ${_RO}."name_short",
            'color', ${_RO}."color"
        ) as "_rail_operator"
        from ${_RLS}
        inner join ${_RO} on ${_RO}."id" = ${_RLS}."rail_operator_id"
        where ${_RLS}."project_id" = :project_id
        and ${_RO}."project_id" = :project_id
        and (cast(${_RLS}._data->>'x_min' as decimal) <= :x_max or ${_RLS}._data->>'x_min' is null)
        and (cast(${_RLS}._data->>'x_max' as decimal) >= :x_min or ${_RLS}._data->>'x_max' is null)
        and (cast(${_RLS}._data->>'y_min' as decimal) <= :y_max or ${_RLS}._data->>'y_min' is null)
        and (cast(${_RLS}._data->>'y_max' as decimal) >= :y_min or ${_RLS}._data->>'y_max' is null)
        and "rail_line_id" in (:rail_line_ids)
    `, {
        replacements: {...options, rail_line_ids},
        ...t
    });

    for (let subline of result_sub){
        
        //Reduce attributes in sections array
        subline.sections = subline.sections.map(section => ({
            id: section.id,
            station_id: section.station_id,
            no_tracks: section.no_tracks,
            _distance_km: section._distance_km,
            _mileage_km: section._mileage_km,
            segments: function(section){
                //Remove sections which are not in view
                if (section._x_min > options.x_max) return [];
                if (section._x_max < options.x_min) return [];
                if (section._y_min > options.y_max) return [];
                if (section._y_max < options.y_min) return [];
                //Round segment values
                return section.segments.map(segment => {
                    for (let f of ['x', 'y', 'x1', 'y1', 'x2', 'y2']){
                        segment[f] = roundValue(segment[f], options);
                    }
                    return segment;
                });
            }(section),
        }));

        //Add to result
        const index = result.findIndex(line => line.id == subline.rail_line_id);
        if (index >= 0){
            result[index].rail_line_sub.push(getObjectExceptField(subline, 'rail_line_id'));
        }
    }

    //Return data
    return result;

}

//stations
const getStations = async function(options, t){

    const _St = `"_stations"`;
    const _Re = `"_regions"`;
    const _RO = `"_rail_operators"`;

    let [result, meta] = await $models.sequelize.query(`
        select ${_St}."id",
        ${_St}."name", ${_St}."name_l", ${_St}."name_short", ${_St}."name_short_l",
        ${_St}."x", ${_St}."y", ${_St}."altitude_m",
        ${_St}."is_major", ${_St}."is_signal_only", ${_St}."is_in_use",
        json_build_object(
            'name', ${_RO}."name",  'name_short', ${_RO}."name_short",
            'color', ${_RO}."color"
        ) as "_major_rail_operator",
        json_build_object(
            'name', ${_Re}."name", 'name_short', ${_Re}."name_short",
            'name_suffix', ${_Re}."name_suffix"
        ) as "_region"
        from ${_St}
        inner join ${_RO} on ${_RO}."id" = ${_St}."major_rail_operator_id"
        inner join ${_Re} on ${_Re}."id" = ${_St}."region_id"
        where ${_St}."project_id" = :project_id
        and ${_Re}."project_id" = :project_id
        and ${_RO}."project_id" = :project_id
        and "x" <= :x_max and "x" >= :x_min
        and "y" <= :y_max and "y" >= :y_min
    `, { replacements: options, ...t });

    return result.map(item => ({
        ...item,
        x: roundValue(item.x, options),
        y: roundValue(item.y, options),
    }));
    
}

//Get Function By Type
const functionByType = {
    region: getRegions,
    map_ref_image: getMapRefImages,
    map_land: getMapLands,
    map_water: getMapWaters,
    rail_line: getRailLines,
    station: getStations,
};

//Round x, y values according to options.logzoom (corresponding to 0.0316 ~ 0.316 pixels)
const roundValue = function(value, options){
    if (value === null) return null;
    if (isNaN(value)) return null;
    const decimals = Math.round(options.logzoom) + 1;
    return parseFloat(value.toFixed(decimals));
};

const roundValuePolygons = function(polygons, options){
    return polygons.map(polygon => (
        polygon.map(vertices => (
            vertices.map(vertex => [
                roundValue(vertex[0], options),
                roundValue(vertex[1], options),
            ])
        ))
    ))
}