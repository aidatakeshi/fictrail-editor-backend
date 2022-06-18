const { DataTypes } = require('sequelize');

exports.validations = {
    string: {
        notEmpty: {msg: "Should Not Be Empty"},
        len: {
            args: [1, 255],
            msg: "Maximum Length is 255 Characters",
        },
    },
    id: {
        notEmpty: {msg: "Should Not Be Empty"},
        len: {
            args: [1, 255],
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
};