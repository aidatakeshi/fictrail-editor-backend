const { DataTypes: dt, Op } = require('sequelize');

const empty = function(value){
    if (value === ""){
        throw new Error("Should Not Be Empty");
    }
};

const length255 = function(value){
    if (value.length > 255){
        throw new Error("Maximum Length is 255 Characters");
    }
};

const number = function(value){
    if (isNaN(value) || value === null){
        throw new Error("Number Required");
    }
};

const va = {
    id: {empty, length255},
    name: {empty},
    boolean: {
        boolean(value) {
            if (value !== true && value !== false) {
                throw new Error("Boolean Required");
            }
        },
    },
    decimal: {number},
    integer: {
        integer(value){
            if (!Number.isInteger(value)) {
                throw new Error("Integer Required");
            }
        }
    },
    email: {
        isEmail: {msg: "Invalid Email Address"}
    },
    password: {
        empty,
        passwordLength(value){
            if (value == '#'){
                throw new Error("Password Should be 8 ~ 255 Characters");
            }
        },
    },
    name_l_json: {
        notObject(value){
            if (Array.isArray(value) || value === null || typeof value !== 'object'){
                throw new Error("Not An Object");
            }
        },
        empty(value){
            for (let f in value){
                let subvalue = value[f];
                if (subvalue === null || subvalue === ""){
                    throw new Error("Subvalues Should Not be Empty or Null");
                }
            }
        },
    },
    polygon: {
        invalidPolygon(value){
            const $e = "It should be of GeoJSON polygon format";
            //It should be a three-layer array,
            //while the third layer should have only 2 elements, and all are finite numbers.
            if (!Array.isArray(value)) throw new Error($e);
            for (let vertices of value){
                if (!Array.isArray(vertices)) throw new Error($e);
                for (let vertex of vertices){
                    if (!Array.isArray(vertex)) throw new Error($e);
                    if (vertex.length != 2) throw new Error($e);
                    if (!Number.isFinite(vertex[0])) throw new Error($e);
                    if (!Number.isFinite(vertex[1])) throw new Error($e);
                }
            }
        }
    },
};
exports.validations = va;

const at = {
    id_uuid: () => ({ type: dt.UUID, unique: true, primaryKey: true }),
    project_id: () => ({ type: dt.STRING, allowNull: false }),
    file_key: () => ({ type: dt.STRING, allowNull: false }),
    longitude: () => ({ type: dt.DOUBLE, allowNull: false, validate: va.decimal }),
    latitude: () => ({ type: dt.DOUBLE, allowNull: false, validate: va.decimal }),
    logzoom: () => ({ type: dt.DOUBLE, allowNull: false, validate: va.decimal }),
    name: () => ({ type: dt.TEXT, allowNull: false, validate: va.name }),
    name_l: () => ({ type: dt.JSON, allowNull: false, defaultValue: {}, validate: va.name_l_json }),
    polygon: () => ({ type: dt.JSON, allowNull: false, defaultValue: [], validate: va.polygon }),
    polygons: () => ({ type: dt.JSON, allowNull: false, defaultValue: [], validate: va.polygons }),
    sort: () => ({ type: dt.DOUBLE, allowNull: false, defaultValue: 0, validate: va.integer }),
    is_locked: () => ({ type: dt.BOOLEAN, allowNull: false, defaultValue: false, validate: va.boolean }),
    is_hidden: () => ({ type: dt.BOOLEAN, allowNull: false, defaultValue: false, validate: va.boolean }),
    _decimal: () => ({ type: dt.DOUBLE, allowNull: true }),
    _names: () => ({ type: dt.TEXT, allowNull: true }),
    //
    created_at: () => ({ type: dt.BIGINT }),
    created_by: () => ({ type: dt.STRING }),
    deleted_at: () => ({ type: dt.BIGINT }),
    deleted_by: () => ({ type: dt.STRING }),
    _history: () => ({ type: dt.JSON }),
};
exports.attributes = at;