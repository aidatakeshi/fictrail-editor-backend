const { DataTypes } = require('sequelize');

exports.validations = {
    string: {
        notEmpty: {msg: "Should Not Be Empty"},
        len: {
            args: [0, 255],
            msg: "Maximum Length is 255 Characters",
        },
    },
    id: {
        notEmpty: {msg: "Should Not Be Empty"},
        len: {
            args: [0, 255],
            msg: "Maximum Length is 255 Characters",
        },
        notNull: { msg: 'ID Required' },
    },
    name: {
        notEmpty: {msg: "Should Not Be Empty"},
    },
    email: {
        isEmail: {msg: "Invalid Email Address"}
    },
    password: {
        notEmpty: { msg: 'Password Required and Should be 8 ~ 255 Characters' },
        notNull: { msg: 'Password Required and Should be 8 ~ 255 Characters' },
    },
    user_rights: {
        isIn: [['owner', 'editor', 'viewer']],
        msg: "Should be owner/editor/viewer",
    },
    latitude: {
        isDecimal: { msg: 'Number Required' },
        min: {
            args: -90,
            msg: "Should be -90 to +90"
        },
    },
    longitude: {
        isDecimal: { msg: 'Number Required' },
        min: {
            args: -180,
            msg: "Should be -180 to +180"
        },
    },
    decimal: {
        isDecimal: { msg: 'Number Required' },
    },
};