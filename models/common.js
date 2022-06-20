const { DataTypes } = require('sequelize');

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

exports.validations = {
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
        invalidObject(value){
            let valid = true;
            if (Array.isArray(value)) valid = false;
            else if (value === null) valid = false;
            else if (typeof value !== 'object') valid = false;
            if (!valid){
                throw new Error("Invalid Object");
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
};