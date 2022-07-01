const Project = $models.Project;
const User = $models.User;

const { QueryTypes, Op } = require('sequelize');
const { e, val_e, w } = require("./common");
const {
    APIforListing, APIforSavingWithHistory ,
} = require("./common");

const { v4: uuid } = require('uuid');

/**
 * Note: 404 "project_not_found" already handled in AuthMiddleware
 */

/**
 * GET /p/:project_id/:type
 */
exports.getItems = async (req, res) => { await w(res, async (t) => {

    //Get Class
    const className = getClassName(req);
    const $Class = $models[className];
    if (!$Class){
        return e(404, res, 'route_not_found', 'Route Not Found');
    }

    //Get Mode (query: _mode)
    let get_mode = $Class.get_default || {};
    const _get_mode = req.query._mode;
    if (_get_mode && $Class.get_modes){
        get_mode = $Class.get_modes[_get_mode] || {};
        if (typeof get_mode === 'function') get_mode = get_mode(req);
    }
    const includes = getAssocIncludes(get_mode);

    //Retrieve Items
    let response = await APIforListing(req, res, className, {
        where: {
            project_id: req.params.project_id,
            ...(get_mode.where || {}),
        },
        attributes: get_mode.attributes,
        include: get_mode.include,
        order: getAssocOrders(includes),
        mapping: (item, req) => {
            //Do Mapping On Item
            item = displayItem(item, true);
            //Do Mapping On Assoc Items
            for (let include of includes){
                if (!item[include.as]) continue;
                if (Array.isArray(item[include.as])){
                    item[include.as] = item[include.as].map(a_item => displayItem(a_item, true));
                }else{
                    item[include.as] = displayItem(item[include.as], false);
                }
            }
            return item;
        },
    });
    return response;

})};

/**
 * GET /p/:project_id/:type/:id
 */
exports.getItem = async (req, res) => { await w(res, async (t) => {

    //Get Class
    const $Class = $models[getClassName(req)];
    if (!$Class){
        return e(404, res, 'route_not_found', 'Route Not Found');
    }

    //Get Mode (query: _mode)
    let get_mode = $Class.get_default || {};
    const _get_mode = req.query._mode;
    if (_get_mode && $Class.get_modes){
        get_mode = $Class.get_modes[_get_mode] || {};
        if (typeof get_mode === 'function') get_mode = get_mode(req);
    }
    const includes = getAssocIncludes(get_mode);

    //Check If ID valid UUID
    if (!checkIDValidUUID(req.params.id)){
        return e(400, res, 'invalid_item_id', 'Item ID should be UUID');
    }

    //Retrieve Item
    let item = await $Class.findOne({
        where: {
            id: req.params.id,
            project_id: req.params.project_id,
            ...(get_mode.where || {}),
        },
        attributes: get_mode.attributes,
        include: get_mode.include,
        order: getAssocOrders(includes),
    });

    //Item Not Found -> 404
    if (!item){
        return e(404, res, 'item_not_found', 'Item Not Found');
    }

    //Do Mapping On Item
    item = displayItem(item, false);

    //Do Mapping On Assoc Items
    for (let include of includes){
        if (!item[include.as]) continue;
        if (Array.isArray(item[include.as])){
            item[include.as] = item[include.as].map(a_item => displayItem(a_item, true));
        }else{
            item[include.as] = displayItem(item[include.as], false);
        }
    }

    //Return Data
    return res.send(item);

})};

/**
 * POST /p/:project_id/:type
 */
exports.createItem = async (req, res) => { await w(res, async (t) => {

    //Get Class
    const $Class = $models[getClassName(req)];
    if (!$Class){
        return e(404, res, 'route_not_found', 'Route Not Found');
    }

    //Filter Queries. Set id, project_id, created_at, created_by.
    let params = {
        ...($Class.new_default || {}),
        id: uuid(),
        ...filterQueries(req.body),
        project_id: req.params.project_id,
        created_by: res.locals.user_id,
        created_at: Math.floor(new Date().getTime() / 1000),
    };

    //Call pre-save function
    if ($Class.on_save){
        params = $Class.on_save(params, req);
    }

    //Create item with validation
    let item;
    try{
        item = await $Class.create(params, t);
    }catch(error){
        return val_e(res, error);
    }

    //Return new project obj if success
    return res.send(displayItem(item, false));

})};

/**
 * PUT /p/:project_id/:type/:id
 */
exports.editItem = async (req, res) => { await w(res, async (t) => {

    //Get Class
    const $Class = $models[getClassName(req)];
    if (!$Class){
        return e(404, res, 'route_not_found', 'Route Not Found');
    }

    //Check If ID valid UUID
    if (!checkIDValidUUID(req.params.id)){
        return e(400, res, 'invalid_item_id', 'Item ID should be UUID');
    }

    //Filter Queries
    const params = filterQueries(req.body);

    //Find Item
    let item = await $Class.scope('+history').findOne({
        where: {
            project_id: res.locals.project_id,
            id: req.params.id,
        },
    }, t);
    if (!item){
        return e(404, res, 'item_not_found', 'Item Not Found');
    }

    //Proceed
    return APIforSavingWithHistory(req, res, item, params, {
        mapping_history: (item, req) => {
            item = displayItem(item, false);
            if ($Class.history_ignore_fields){
                for (let field of $Class.history_ignore_fields) delete item[field];
            }
            return item;
        },
        mapping: (item, req) => displayItem(item, false),
        on_save: $Class.on_save,
    });

})};

/**
 * DELETE /p/:project_id/:type/:id
 */
exports.removeItem = async (req, res) => { await w(res, async (t) => {

    //Get Class
    const $Class = $models[getClassName(req)];
    if (!$Class){
        return e(404, res, 'route_not_found', 'Route Not Found');
    }

    //Check If ID valid UUID
    if (!checkIDValidUUID(req.params.id)){
        return e(400, res, 'invalid_item_id', 'Item ID should be UUID');
    }

    //Find Item
    let item = await $Class.scope('+history').findOne({
        where: {
            project_id: res.locals.project_id,
            id: req.params.id,
        },
    }, t);
    if (!item){
        return e(404, res, 'item_not_found', 'Item Not Found');
    }

    //Soft delete item
    await item.update({
        deleted_by: res.locals.user_id,
        deleted_at: Math.floor(new Date().getTime() / 1000),
    }, t);

    //Return old project obj
    return res.send(displayItem(item, false));

})};

/**
 * POST /p/:project_id/:type/:id
 */
exports.duplicateItem = async (req, res) => { await w(res, async (t) => {

    //Get Class
    const $Class = $models[getClassName(req)];
    if (!$Class){
        return e(404, res, 'route_not_found', 'Route Not Found');
    }

    //Check if allow_duplicate
    if (!$Class.allow_duplicate){
        return e(404, res, 'route_not_found', 'Route Not Found');
    }

    //Check If ID valid UUID
    if (!checkIDValidUUID(req.params.id)){
        return e(400, res, 'invalid_item_id', 'Item ID should be UUID');
    }

    //Find old item
    const old_item = await $Class.findOne({
        where: {
            project_id: res.locals.project_id,
            id: req.params.id,
        },
    }, t);
    if (!old_item){
        return e(404, res, 'item_not_found', 'Item Not Found');
    }

    //Filter Queries
    let params = filterQueries(req.body);

    //Set id, project_id, created_at, created_by
    params.id = uuid();
    params.project_id = req.params.project_id;
    params.created_by = res.locals.user_id;
    params.created_at = Math.floor(new Date().getTime() / 1000);

    //Merge with old item
    params = { ...displayItem(old_item, false), ...params };

    //Call pre-save function
    if ($Class.on_save){
        params = $Class.on_save(params, req);
    }

    //Create new item with validation
    let new_item;
    try{
        new_item = await $Class.create(params, t);
    }catch(error){
        return val_e(res, error);
    }

    //Return new project obj if success
    return res.send(displayItem(new_item, false));

})};

/**
 * PUT /p/:project_id/:type
 */
exports.reorderItem = async (req, res) => { await w(res, async (t) => {

    //Get Class
    const $Class = $models[getClassName(req)];
    if (!$Class){
        return e(404, res, 'route_not_found', 'Route Not Found');
    }

    //Get ids
    const ids = req.body.ids || [];

    //Make id -> sort mapping
    let sort_by_id = {};
    let sort = 1;
    for (let id of ids){
        sort_by_id[id] = sort++;
    }

    //Check If IDs valid UUIDs
    if (!ids.every(checkIDValidUUID)){
        return e(400, res, 'invalid_item_ids', 'Item IDs should be UUIDs');
    }
    
    //Start Reorder
    let items = await $Class.scope('+history').findAll({
        where: {
            project_id: res.locals.project_id,
            id: {[Op.in]: ids},
        },
    }, t);
    for (let item of items){
        const id = item.id;
        const sort_old = item.sort;
        const sort = sort_by_id[id];
        //Update item history as well
        let _history = item._history;
        if (!Array.isArray(_history)) _history = [];
        if (sort != sort_old){
            _history.unshift({
                updated_at: Math.floor(new Date().getTime() / 1000),
                updated_by: res.locals.user_id,
                delta: {sort},
            });
        }
        item.changed('_history', true); //Force change _history field
        //Do Update
        await item.update({ sort, _history }, t);
    }

    //Return result
    res.send({sort: sort_by_id});

})};


/**
 * Shared Functions
 */
function getClassName(req){
    if (!req.params.type) return null;
    const className = `-${req.params.type}`.replace(/-./g, x=>x[1].toUpperCase());
    return `$${className}`;
}

function displayItem(item, isList = false){
    if (item.toJSON) item = item.toJSON();
    for (let field of ['project_id', 'deleted_at', 'deleted_by', '_history']){
        delete item[field];
    }
    if (isList){
        for (let field of ['created_at', 'created_by']) delete item[field];
    }
    return item;
}

function filterQueries(queries){
    const fields = ['id', 'created_at', 'created_by', 'deleted_at', 'deleted_by', 'project_id', '_history'];
    for (let f of fields) delete queries[f];
    return queries;
}

function checkIDValidUUID(id){
    const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
    return regexExp.test(id);
}

function getAssocIncludes(get_mode){
    if (!get_mode.include) return [];
    if (!Array.isArray(get_mode.include)){
        return [get_mode.include];
    }
    return get_mode.include;
}

function getAssocOrders(includes){
    let order = [];
    for (let include of includes){
        if (!include.order) continue;
        order.push([
            { model: include.model, as: include.as }
        ].concat(include.order));
    }
    return order;
}