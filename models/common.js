const { DataTypes } = require('sequelize');

exports.validations = {
    string: {
        notEmpty: {msg: "Should Not Be Empty"},
        len: {
            args: [1, 255],
            msg: "Maximum Length is 255 Characters",
        },
    },
    name: {
        notEmpty: {msg: "Should Not Be Empty"},
    },
    email: {
        isEmail: {msg: "Invalid Email Address"}
    },
    password: {
        len: {
            args: [8, 255],
            msg: "Length Should be Between 8 and 255",
        },
    },
    user_rights: {
        isIn: [['owner', 'editor', 'viewer']],
        msg: "Should be owner/editor/viewer",
    },
}

exports.attributes = {
    id_auto: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    id_string: {
        type: DataTypes.STRING, unique: true, validate: {
            notEmpty: {msg: "Should Not Be Empty"},
            len: {
                args: [1, 255],
                msg: "Maximum Length is 255 Characters",
            },
        },
    },
    id_foreign: {
        type: DataTypes.STRING,
    },
    bearer_token: {
        type: DataTypes.STRING,
    },
    name: {
        type: DataTypes.TEXT, allowNull: true, validate: {
            notEmpty: {msg: "Should Not Be Empty"},
        },
    },
    email: {
        type: DataTypes.TEXT, allowNull: true, validate: {
            isEmail: {msg: "Invalid Email Address"}
        },
    },
    new_password: {
        type: DataTypes.VIRTUAL, validate: {
            len: {
                args: [8, 255],
                msg: "Length Should be Between 8 and 255",
            },
        },
    },
    hashed_password: {
        type: DataTypes.STRING,
        set(){},
    },
    user_rights: {
        type: DataTypes.STRING, allowNull: true, validate: {
            isIn: [['owner', 'editor', 'viewer']],
            msg: "Should be owner/editor/viewer",
        },
    },
    timestamp: {
        type: DataTypes.BIGINT,
    },
    //
    bigint: {
        type: DataTypes.BIGINT,
    },
    boolean: {
        type: DataTypes.BOOLEAN,
    },
    json: {
        type: DataTypes.JSON,
    },
    number: {
        type: DataTypes.DOUBLE,
    },
    string: {
        type: DataTypes.STRING,
    },
};