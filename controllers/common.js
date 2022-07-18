const { QueryTypes, Op } = require('sequelize');

const EditHistory = $models.EditHistory;

/**
 * Show Error as JSON Response [showError / e]
 */
function showError(status, res, error, message, additionalInfo = {}){
    return res.status(status).send({error, message, ...additionalInfo});
}
exports.showError = showError;
exports.e = showError;

/**
 * Show Validation Errors as JSON Response [showValidationError / val_e]
 */
function showValidationError(res, error){
    if (Array.isArray(error.errors)){
        return showError(400, res, "validation_error", "Validation Error", {
            details: error.errors.map(item => ({
                field: item.path, type: item.validatorKey, message: item.message,
            })),
        });
    }else{
        return res.status(500).send({error: "error", message: error.toString()});
    }
}
exports.showValidationError = showValidationError;
exports.val_e = showValidationError;

/**
 * Wrapper to Handling Errors (Including Database Errors) [wrapperForController / w]
 */
async function wrapperForController(res, func){
    try{
        const result = await $models.sequelize.transaction(async function(transaction){
            const t = {transaction};
            const subresult = await func(t);
            return subresult;
        });
        return result;
    } catch (error){
        return res.status(500).send({error: "error", message: error.toString()});
    }
}
exports.wrapperForController = wrapperForController;
exports.w = wrapperForController;

/**
 * API For Listing
 * [options]
 * mapping (function: item, req)
 * attributes (array)
 * where (array or obj)
 * include (array or obj)
 * order (array or obj)
 * count_use_include (boolean)
 */
async function APIforListing(req, res, className, options = {}){

    const MyClass = $models[className];

    //Handle Filters
    let filtersApplied = [];
    for (let key in req.query){
        let value = req.query[key];
        let $filters = MyClass.filters || {};
        if ($filters[key]){
            filtersApplied.push($filters[key](value));
        }
    }

    //Handle options.where (additional where statements)
    if (options.where){
        if (!Array.isArray(options.where)) options.where = [options.where];
        for (let item of options.where){
            filtersApplied.push(item);
        }
    }

    //Handle options.include (eager loading other associated model items)
    let include = [];
    if (options.include){
        if (!Array.isArray(options.include)) options.include = [options.include];
        for (let item of options.include){
            include.push(item);
        }
    }

    //Sort (query: _sort)
    let $sortables = MyClass.sortables || {};
    let order = [];
    order.push(MyClass.sort_default || [["created_at", "ASC"]]);
    let sort_query = req.query._sort;
    if (sort_query){
        sort_query = sort_query.split(':');
        let sort_direction = sort_query[1] || 'ASC';
        if (sort_direction.toUpperCase() == "ASC") sort_direction = "ASC";
        else sort_direction = "DESC";
        let sort_key = sort_query.shift();
        sort_query.shift();
        console.log(sort_query);
        if ($sortables[sort_key]){
            order = $sortables[sort_key](sort_direction, ...sort_query);
        }
    }

    //Handle options.order
    if (options.order){
        if (!Array.isArray(options.order))options.order = [options.order];
        for (let item of options.order){
            order.push(item);
        }
    }

    //Make Count
    const count = await MyClass.count({
        include: options.count_use_include ? include : undefined,
        where: {[Op.and]: filtersApplied},
    });

    //If No Results...
    if (!count){
        return res.send({
            pages: null, page: null, limit: null, from: null, to: null, count: 0, data: [],
        });
    }

    //If Have Results...

    //Determine Limit
    let limit = req.query._limit;
    if (!limit && limit !== 0 && limit !== '0'){
        limit = MyClass.limit_default;
    }
    limit = parseInt(limit);
    if (MyClass.limit_max){
        if (!limit || limit > MyClass.limit_max) limit = MyClass.limit_max;
    }

    //Do Pagination
    let pages, page, offset, from, to;
    if (limit){
        pages = Math.ceil(count / limit);
        page = parseInt(req.query._page) || 1;
        page = Math.min(Math.max(page, 1), pages);
        offset = limit * (page - 1);
        from = offset + 1;
        to = Math.min(limit * page, count);
    }else{
        [pages, page, limit, offset, from, to] = [null, null, null, null, null, null];
    }
    
    //Do Search
    const attributes = options.attributes;
    const items = await MyClass.findAll({
        attributes, include, order, limit, offset,
        where: {[Op.and]: filtersApplied},
    });

    //Handle Mapping & Additional Data
    const data = items.map(item => {
        if (typeof options.mapping === 'function') item = options.mapping(item, req);
        if (typeof item.toJSON === 'function') item = item.toJSON();
        return item;
    });

    //Return Data
    return res.send({ pages, page, limit, from, to, count, data });

}
exports.APIforListing = APIforListing;

/**
 * API For Saving with History Handling
 * [options]
 * mapping (function: item, req) - data mapping for returning
 * onSave (function: item, req) - pre-save process function
 */
async function APIforSavingWithHistory(req, res, type, item, filteredQueries, options = {}, t){

    //Prepare new data
    let old_data_full = item.toJSON();
    let new_data_full = { ...old_data_full };
    for (let field in filteredQueries){
        if (new_data_full[field] !== undefined){
            new_data_full[field] = filteredQueries[field];
            item.changed(field, true); //Force change field
        }
    }

    //Call pre-save function to new data
    if (options.onSave){
        new_data_full = await options.onSave(new_data_full, req);
    }

    //Save history, only with fields consisted in filteredQueries
    let new_data_compare = {};
    let old_data_compare = {};
    for (let field in filteredQueries){
        if (new_data_full[field] !== undefined){
            new_data_compare[field] = new_data_full[field];
        }
        if (old_data_full[field] !== undefined){
            old_data_compare[field] = old_data_full[field];
        }
    }
    new_data_compare.id = item.id;
    old_data_compare.id = item.id;

    //Only save fields consisted in filteredQueries
    let new_data = {};
    for (let field in filteredQueries){
        if (new_data_full[field] !== undefined){
            new_data[field] = new_data_full[field];
        }
    }

    //Do Update, catch validation errors
    try{
        await item.update(new_data, t);
        await EditHistory.newHistory(res, type, new_data_compare, old_data_compare, t);
    }catch(error){
        return showValidationError(res, error);
    }

    //Return item
    if (typeof options.mapping === 'function'){
        data = options.mapping(item, req);
    }
    if (typeof item.toJSON === 'function'){
        item = item.toJSON();
    }
    return res.send(data);

}
exports.APIforSavingWithHistory = APIforSavingWithHistory;