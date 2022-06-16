'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {

        const id_bigint = { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true, unique: true };
        const id_string = { type: Sequelize.STRING, unique: true };
        const uuid = { type: Sequelize.UUID };
        const bool_default_true = { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true };
        const bool_default_false = { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false };
        const json = { type: Sequelize.JSON, allowNull: false, defaultValue: {} };
        const json_array = { type: Sequelize.JSON, allowNull: false, defaultValue: [] };
        const text = { type: Sequelize.TEXT, allowNull: false, defaultValue: "" };
        const string = { type: Sequelize.STRING, allowNull: false, defaultValue: "" };
        const string_nullable = { type: Sequelize.STRING };
        const string_required = { type: Sequelize.STRING, allowNull: false };
        const timestamp = { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 };
        const double = { type: Sequelize.DOUBLE };
        const bigint = { type: Sequelize.BIGINT };

        /**
         * Table "projects"
         */
        await queryInterface.createTable('projects', {
            id_auto: id_bigint,
            id: id_string,
            name: text,
            name_l: json,
            is_public: bool_default_false,
            created_at: timestamp,
            created_by: uuid,
            is_deleted: bool_default_false,
        });

        /**
         * Table "users"
         */
        await queryInterface.createTable('users', {
            id_auto: id_bigint,
            id: id_string,
            name: string,
            password: string_required,
            email: string,
            last_login_attempt: timestamp,
            is_enabled: bool_default_true,
            is_root_user: bool_default_true,
            created_at: timestamp,
            created_by: uuid,
            is_deleted: bool_default_false,
        });

        /**
         * Table "project_assignments"
         */
        await queryInterface.createTable('project_assignments', {
            id_auto: id_bigint,
            user_id: string_required,
            project_id: string_required,
            rights: string_nullable,
        });

        /**
         * Table "login_sessions"
         */
        await queryInterface.createTable('login_sessions', {
            id_auto: id_bigint,
            user_id: string_required,
            bearer_token: string,
            login_time: timestamp,
            last_activity_time: timestamp,
        });

        /**
         * Table "login_records"
         */
        await queryInterface.createTable('login_records', {
            id_auto: id_bigint,
            user_id: string_required,
            bearer_token: string,
            login_time: timestamp,
            logout_time: timestamp,
        });

        /**
         * Table "project_settings"
         */
        await queryInterface.createTable('project_settings', {
            id_auto: id_bigint,
            project_id: string_required,
            language_default: text,
            language_alt: json_array,
            latitude_min: double,
            latitude_max: double,
            longitude_min: double,
            longitude_max: double,
            earth_radius: double,
        });

        /**
         * Table "files"
         */
        await queryInterface.createTable('files', {
            id_auto: id_bigint,
            id: id_string,
            project_id: string_required,
            uploader_id: string_required,
            directory: string,
            extension: string,
            mimetype: string,
            size: bigint,
            upload_time: timestamp,
            is_deleted: bool_default_false,
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