const $RailLineType = $models.$RailLineType;
const $RailLine = $models.$RailLine;
const $RailLineSub = $models.$RailLineSub;
const $RailOperatorType = $models.$RailOperatorType;
const $RailOperator = $models.$RailOperator;
const $Station = $models.$Station;
const $Region = $models.$Region;

const { QueryTypes, Op } = require('sequelize');
const {e, val_e, w} = require("./common");
const { getDelta, applyDelta } = require('../includes/diffJSON');
const {getObjectExceptField, sum, sumObjects} = require('../includes/misc');

const { v4: uuid } = require('uuid');
const multer  = require('multer');
const fs = require('fs-extra');

/**
 * Note: 404 "project_not_found" already handled in AuthMiddleware
 */

/**
 * GET /p/:project_id/rail-line/stats
 */
exports.getRailLineStats = async (req, res) => { await w(res, async (t) => {

    //Get stats by rail_line_type_id, rail_operator_type_id & rail_operator_id
    const [result, meta] = await $models.sequelize.query(`
        SELECT "_rail_lines"."rail_line_type_id",
        "_rail_operators"."rail_operator_type_id",
        "_rail_lines_sub"."rail_operator_id",
        SUM(CAST("_rail_lines_sub"._data->>'length_km' AS decimal)) AS "length_km",
        COUNT(distinct "_rail_lines"."id") AS "count_rail_line",
        COUNT("_rail_lines_sub"."id") AS "count_rail_line_sub"
        FROM "_rail_lines_sub"
        JOIN "_rail_lines"
        ON "_rail_lines_sub"."rail_line_id" = "_rail_lines"."id"
        JOIN "_rail_line_types"
        ON "_rail_lines"."rail_line_type_id" = "_rail_line_types"."id"
        JOIN "_rail_operators"
        ON "_rail_lines_sub"."rail_operator_id" = "_rail_operators"."id"
        JOIN "_rail_operator_types"
        ON "_rail_operators"."rail_operator_type_id" = "_rail_operator_types"."id"
        WHERE "_rail_lines_sub"."project_id" = ?
        GROUP BY "rail_operator_id", "rail_operator_type_id", "rail_line_type_id",
        "_rail_line_types"."sort", "_rail_operator_types"."sort", "_rail_operators"."sort"
        ORDER BY "_rail_line_types"."sort" ASC, "_rail_operator_types"."sort" ASC, "_rail_operators"."sort" ASC
    `, {
        replacements: [req.params.project_id],
        ...t,
    });

    //Get rail_line_types data
    const rail_line_types_r = await $RailLineType.findAll({
        where: { project_id: req.params.project_id },
        order: [['sort', 'asc']],
        attributes: ['id', 'name', 'name_l', 'map_color'],
    }, t);
    const rail_line_types = rail_line_types_r.map(item => item.toJSON());

    //Get rail_operator_types & rail_operators data
    const rail_operator_types_r = await $RailOperatorType.findAll({
        where: { project_id: req.params.project_id },
        order: [['sort', 'asc']],
        attributes: ['id', 'name', 'name_l'],
        include: {
            model: $RailOperator, as: "rail_operator", required: false,
            where: { project_id: req.params.project_id },
            order: [['sort', 'asc']],
            attributes: ['id', 'name', 'name_l', 'name_short', 'name_short_l', 'color', 'color_text', 'logo_file_key'],
        }
    }, t);
    const rail_operator_types = rail_operator_types_r.map(item => item.toJSON());

    //Prepare return data object (with placeholder stat attributes)
    const attributes = ['count_rail_line', 'count_rail_line_sub', 'length_km'];

    //All
    let data = {
        ...sumObjects(result, attributes),
    };

    //Rail Line Type
    data.rail_line_type = {};
    for (let RLT of rail_line_types){
        data.rail_line_type[RLT.id] = {
            ...getObjectExceptField(RLT, 'id'),
            ...sumObjects(result.filter(
                item => item.rail_line_type_id == RLT.id
            ), attributes),
        };
    }

    //Rail Operator Type
    data.rail_operator_type = {};
    for (let ROT of rail_operator_types){
        data.rail_operator_type[ROT.id] = {
            ...getObjectExceptField(ROT, 'id', 'rail_operator'),
            ...sumObjects(result.filter(
                item => item.rail_operator_type_id == ROT.id
            ), attributes),
            rail_operator_ids: ROT.rail_operator.map(item => item.id),
        };
    }

    //Rail Operator Type + Rail Line Type
    for (let ROT of rail_operator_types){
        data.rail_operator_type[ROT.id].rail_line_type = {};
        for (let RLT of rail_line_types){
            data.rail_operator_type[ROT.id].rail_line_type[RLT.id] = {
                ...sumObjects(result.filter(item => (
                    item.rail_operator_type_id == ROT.id && item.rail_line_type_id == RLT.id
                )), attributes),
            };
        }
    }

    //Rail Operator
    data.rail_operator = {};
    for (let ROT of rail_operator_types){
        for (let RO of ROT.rail_operator){
            data.rail_operator[RO.id] = {
                ...getObjectExceptField(RO, 'id'),
                ...sumObjects(result.filter(
                    item => item.rail_operator_id == RO.id
                ), attributes),
            };
        }
    }

    //Rail Operator + Rail Line Type
    for (let ROT of rail_operator_types){
        for (let RO of ROT.rail_operator){
            data.rail_operator[RO.id].rail_line_type = {};
            for (let RLT of rail_line_types){
                data.rail_operator[RO.id].rail_line_type[RLT.id] = {
                    ...sumObjects(result.filter(item => (
                        item.rail_operator_id == RO.id && item.rail_line_type_id == RLT.id
                    )), attributes),
                };
            }
        }
    }


    //Return Data
    return res.send({data});

})};

/**
 * GET /p/:project_id/station/stats
 */
exports.getStationStats = async (req, res) => { await w(res, async (t) => {

    //Get stats by rail_operator_type_id, rail_operator_id & region_id
    const [result, meta] = await $models.sequelize.query(`
        SELECT "_stations"."major_rail_operator_id" AS "rail_operator_id",
        "_rail_operators"."rail_operator_type_id",
        "_stations"."region_id",
        COUNT("_stations"."id") AS "count_station"
        FROM "_stations"
        JOIN "_rail_operators"
        ON "_stations"."major_rail_operator_id" = "_rail_operators"."id"
        JOIN "_rail_operator_types"
        ON "_rail_operators"."rail_operator_type_id" = "_rail_operator_types"."id"
        JOIN "_regions"
        ON "_stations"."region_id" = "_regions"."id"
        WHERE "_stations"."project_id" = 'hongon'
        GROUP BY "rail_operator_id", "rail_operator_type_id", "region_id",
        "_rail_operator_types"."sort", "_rail_operators"."sort", "_regions"."sort"
        ORDER BY "_rail_operator_types"."sort" asc, "_rail_operators"."sort" asc, "_regions"."sort" asc
    `, {
        replacements: [req.params.project_id],
        ...t,
    });

    //Get regions data
    const regions_r = await $Region.findAll({
        where: { project_id: req.params.project_id },
        order: [['sort', 'asc']],
        attributes: ['id', 'name', 'name_l', 'name_suffix', 'name_suffix_l', 'name_short', 'name_short_l', '$name_full', '$name_full_l'],
    }, t);
    const regions = regions_r.map(item => item.toJSON());

    //Get rail_operator_types & rail_operators data
    const rail_operator_types_r = await $RailOperatorType.findAll({
        where: { project_id: req.params.project_id },
        order: [['sort', 'asc']],
        attributes: ['id', 'name', 'name_l'],
        include: {
            model: $RailOperator, as: "rail_operator", required: false,
            where: { project_id: req.params.project_id },
            order: [['sort', 'asc']],
            attributes: ['id', 'name', 'name_l', 'name_short', 'name_short_l', 'color', 'color_text', 'logo_file_key'],
        }
    }, t);
    const rail_operator_types = rail_operator_types_r.map(item => item.toJSON());

    //Prepare return data object (with placeholder stat attributes)
    const attributes = ['count_station'];

    //All
    let data = {
        ...sumObjects(result, attributes),
    };

    //Region
    data.region = {};
    for (let RE of regions){
        console.log(RE);
        data.region[RE.id] = {
            ...getObjectExceptField(RE, 'id'),
            ...sumObjects(result.filter(
                item => item.region_id == RE.id
            ), attributes)
        };
    }

    //Rail Operator Type
    data.rail_operator_type = {};
    for (let ROT of rail_operator_types){
        data.rail_operator_type[ROT.id] = {
            ...getObjectExceptField(ROT, 'id', 'rail_operator'),
            ...sumObjects(result.filter(
                item => item.rail_operator_type_id == ROT.id
            ), attributes),
            rail_operator_ids: ROT.rail_operator.map(item => item.id),
        };
    }

    //Rail Operator Type + Region
    for (let ROT of rail_operator_types){
        data.rail_operator_type[ROT.id].region = {};
        for (let RE of regions){
            data.rail_operator_type[ROT.id].region[RE.id] = {
                ...sumObjects(result.filter(item => (
                    item.rail_operator_type_id == ROT.id && item.region_id == RE.id
                )), attributes),
            };
        }
    }

    //Rail Operator
    data.rail_operator = {};
    for (let ROT of rail_operator_types){
        for (let RO of ROT.rail_operator){
            data.rail_operator[RO.id] = {
                ...getObjectExceptField(RO, 'id'),
                ...sumObjects(result.filter(
                    item => item.rail_operator_id == RO.id
                ), attributes),
            };
        }
    }

    //Rail Operator + Region
    for (let ROT of rail_operator_types){
        for (let RO of ROT.rail_operator){
            data.rail_operator[RO.id].region = {};
            for (let RE of regions){
                const sum_RO_RE = sumObjects(result.filter(item => (
                    item.rail_operator_id == RO.id && item.region_id == RE.id
                )), attributes);
                let allZero = true;
                for (let attr in sum_RO_RE){
                    if (sum_RO_RE[attr] > 0){
                        allZero = false;
                        break;
                    }
                }
                if (!allZero){
                    data.rail_operator[RO.id].region[RE.id] = sum_RO_RE;
                }
            }
        }
    }

    //Return Data
    return res.send({data});

})};

/**
 * PUT p/:project_id/rail-line/_data
 * PUT p/:project_id/rail-line-sub/_data
 */
exports.refreshRailLineData = async (req, res) => { await w(res, async (t) => {

    let rail_line_count = 0;
    let rail_line_sub_count = 0;

    //Call getRefreshedData() [static] for each sub-line
    const lines_sub = await $RailLineSub.findAll({where: { project_id: req.params.project_id }}, t);
    for (let line_sub of lines_sub){
        const refreshed_data = $RailLineSub.getRefreshedData(line_sub.toJSON());
        line_sub.changed('_data', true);
        line_sub.changed('sections', true);
        await line_sub.update(refreshed_data, t);
        rail_line_sub_count++;
    }

    //Call onSubLineUpdated() [prototype] for each line
    const lines = await $RailLine.findAll({where: { project_id: req.params.project_id }}, t);
    for (let line of lines){
        await line.onSubLineUpdated();
        rail_line_count++;
    }

    //Return result
    return res.send({rail_line_count, rail_line_sub_count});

})};

/**
 * PUT /p/:project_id/rail-lines-sub/sections
 */
exports.updateSubLinesSections = async (req, res) => { await w(res, async (t) => {

    let updated_data = {};
    let request_data = req.body || {};

    for (let id in request_data){
        //Get Item
        const item = await $RailLineSub.scope('+history').findOne({where: {
            project_id: req.params.project_id, id,
        }}, t);
        //If item exists
        if (item){
            //Compare section data
            const sections_old = item.sections;
            const sections = request_data[id];
            const delta = getDelta(sections, sections_old);
            item.changed('sections', true);
            //Add to History
            let _history;
            if (_history = item._history){
                if (!Array.isArray(_history)) _history = [];
                if (delta !== undefined){
                    _history.unshift({
                        updated_at: Math.floor(new Date().getTime() / 1000),
                        updated_by: res.locals.user_id,
                        delta,
                    });
                }
                item.changed('_history', true); //Force change _history field
            }
            //Do Update
            await item.update({sections, _history}, t);
            updated_data[id] = sections;
        }
    }

    return res.send(updated_data);

})};