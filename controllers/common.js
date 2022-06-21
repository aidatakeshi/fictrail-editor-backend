const { QueryTypes, Op } = require('sequelize');

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
 * mapping (function: instance, req)
 * where (array or obj)
 * include (array or obj)
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

    //Handle options.include (eager loading other associated model instances)
    let include = [];
    if (options.include){
        if (!Array.isArray(options.include)) options.include = [options.include];
        for (let item of options.include){
            include.push(item);
        }
    }

    //Sort (query: _sort)
    let $sorts = MyClass.sorts || {};
    let order = MyClass.sort_default || [["created_at", "ASC"]];
    let sort_query = req.query._sort;
    if (sort_query){
        sort_query = sort_query.split(':');
        let sort_direction = sort_query[1] || 'ASC';
        if (sort_direction.toUpperCase() == "ASC") sort_direction = "ASC";
        else sort_direction = "DESC";
        let sort_key = sort_query[0];
        if ($sorts[sort_key]){
            order = $sorts[sort_key](sort_direction);
        }
    }

    //Make Count
    const count = await MyClass.count({
        include,
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
    let limit = parseInt(req.query._limit) || MyClass.limit_default;
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
    const instances = await MyClass.findAll({
        include, order, limit, offset,
        where: {[Op.and]: filtersApplied},
    });

    //Handle Mapping & Additional Data
    let data;
    if (!options.mapping){
        data = instances.map(instance => instance.toJSON());
    }else{
        data = instances.map(instance => options.mapping(instance, req));
    }

    //Return Data
    return res.send({ pages, page, limit, from, to, count, data });

}
exports.APIforListing = APIforListing;