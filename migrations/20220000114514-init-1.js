'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {

        const id_string = { type: Sequelize.STRING, primaryKey: true, unique: true };
        const id_uuid = { type: Sequelize.UUID, primaryKey: true, unique: true };
        const uuid = { type: Sequelize.UUID, allowNull: true };
        const bool_default_true = { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true };
        const bool_default_false = { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false };
        const json = { type: Sequelize.JSON, allowNull: false, defaultValue: {} };
        const text = { type: Sequelize.TEXT, allowNull: true };
        const string = { type: Sequelize.STRING, allowNull: true };
        const string_required = { type: Sequelize.STRING, allowNull: false };
        const timestamp = { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 };
        const double = { type: Sequelize.DOUBLE, allowNull: true };
        const bigint = { type: Sequelize.BIGINT, allowNull: true };

        const created_at = timestamp;
        const created_by = string;
        const deleted_at = timestamp;
        const deleted_by = string;

        /**
         * Table "users"
         */
        await queryInterface.createTable('users', {
            id: id_string,
            name: text,
            password: string_required,
            email: text,
            last_login_attempt: timestamp,
            is_enabled: bool_default_true,
            is_root_user: bool_default_false,
            can_create_new_project: bool_default_true,
            //
            created_at, created_by, deleted_at, deleted_by,
        });

        /**
         * Table "projects"
         */
        await queryInterface.createTable('projects', {
            id: id_string,
            name: text,
            name_l: json,
            is_public: bool_default_false,
            //
            created_at, created_by, deleted_at, deleted_by,
        });

        /**
         * Table "project_assignments"
         */
        await queryInterface.createTable('project_assignments', {
            id: id_uuid,
            user_id: string_required,
            project_id: string_required,
            rights: string,
            //
            created_at, created_by, deleted_at, deleted_by,
        });

        /**
         * Table "login_sessions"
         */
        await queryInterface.createTable('login_sessions', {
            id: id_uuid,
            user_id: string_required,
            bearer_token: string,
            login_time: timestamp,
            last_activity_time: timestamp,
            file_token: string,
        });

        /**
         * Table "login_records"
         */
        await queryInterface.createTable('login_records', {
            id: id_uuid,
            user_id: string_required,
            bearer_token: string,
            login_time: timestamp,
            logout_time: timestamp,
        });

        /**
         * Table "project_settings"
         */
        await queryInterface.createTable('project_settings', {
            id: id_string,
            project_id: string_required,
            language_default: text,
            language_alt: json,
            latitude_min: double,
            latitude_max: double,
            longitude_min: double,
            longitude_max: double,
        });

        /**
         * Table "files"
         */
        await queryInterface.createTable('files', {
            id: id_uuid,
            key: string,
            project_id: string_required,
            directory: string_required,
            filename_original: string_required,
            filename: string_required,
            mimetype: string_required,
            size: bigint,
            encoding: string_required,
            //
            created_at, created_by, deleted_at, deleted_by,
        });

    },
    
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('projects');
        await queryInterface.dropTable('users');
        await queryInterface.dropTable('project_assignments');
        await queryInterface.dropTable('login_sessions');
        await queryInterface.dropTable('login_records');
        await queryInterface.dropTable('project_settings');
        await queryInterface.dropTable('files');
    }
};