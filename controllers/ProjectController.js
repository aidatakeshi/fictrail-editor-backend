const Project = $models.Project;
const ProjectAssignment = $models.ProjectAssignment;
const ProjectSettings = $models.ProjectSettings;
const User = $models.User;

const { QueryTypes, Op } = require('sequelize');

const {e, val_e, w} = require("./common");
const {APIforListing, APIforSavingWithHistory} = require("./common");

const { v4: uuid } = require('uuid');

/**
 * Note: 404 "project_not_found" already handled in AuthMiddleware
 */

/**
 * POST /project
 */
exports.newProject = async (req, res) => { await w(res, async (t) => {

    //If the user cannot create new project
    if (!res.locals.is_root_user && !res.locals.can_create_new_project){
        return e(403, res, "create_new_project_not_allowed", "Creating New Project Not Allowed");
    }

    const params = Project.filterQueries(req.body, true);

    //Set created_at, created_by
    params.created_by = res.locals.user_id;
    params.created_at = Math.floor(new Date().getTime() / 1000);

    //Create project with validation
    let project;
    try{
        project = await Project.create(params, t);
    }catch(error){
        return val_e(res, error);
    }

    //Create project_settings with default value
    let params_settings = {
        ...ProjectSettings.default,
        id: params.id,
        project_id: params.id,
    };
    project_settings = await ProjectSettings.create(params_settings, t);

    //Return new project obj if success
    return res.send(project.display());

})};

/**
 * GET /project
 */
exports.getProjects = async (req, res) => { await w(res, async (t) => {

    //Not root user: Only list projects assigned to the user, and public projects
    if (!res.locals.is_root_user){

        //Get Project IDs of Projects Assigned to the User
        const project_ids_assigned = await ProjectAssignment.findAll({
            attributes: ['project_id'], where: {user_id: res.locals.user_id},
        })
        let project_ids = project_ids_assigned.map((instance) => instance.project_id);

        //Get Project IDs of Public Projects
        const project_ids_public = await Project.findAll({
            attributes: ['id'], where: {is_public: true},
        })
        project_ids = project_ids.concat(project_ids_public.map((instance) => instance.id));

        //Get Projects & ProjectAssignments
        let response = await APIforListing(req, res, 'Project', {
            where: { id: {[Op.in]: project_ids} },
            include: {
                model: ProjectAssignment,
                where: {user_id: res.locals.user_id},
                required: false,
            },
            mapping: (instance) => {
                let data = instance.display();
                data.my_rights = null;
                data.my_assignment = null;
                if (data.ProjectAssignments.length){
                    data.my_rights = data.ProjectAssignments[0].rights;
                    data.my_assignment = {
                        rights: data.ProjectAssignments[0].rights,
                        created_at: data.ProjectAssignments[0].created_at,
                        created_by: data.ProjectAssignments[0].created_by,
                    };
                }
                delete data.ProjectAssignments;
                return data;
            },
        });
        return response;
    }

    //Root user: List all projects
    else{
        let response = await APIforListing(req, res, 'Project', {
            mapping: (instance) => ({
                ...instance.display(),
                my_rights: 'root',
            }),
        });
        return response;
    }

})};

/**
 * GET /project/:project_id
 */
exports.getProject = async (req, res) => { await w(res, async (t) => {

    const project = res.locals.project;
    let data = {
        ...project.display(),
        my_rights: res.locals.rights || null,
        my_assignment: (!res.locals.assignment) ? null : {
            rights: res.locals.assignment.rights,
            created_at: res.locals.assignment.created_at,
            created_by: res.locals.assignment.created_by,
        },
    };
    
    if (req.query.get_settings){
        const project_id = res.locals.project_id;
        const project_settings = await ProjectSettings.findOne({where: {project_id}});
        data.settings = project_settings.toJSON();
        delete data.settings.id;
        delete data.settings.project_id;
    }

    //Return Data
    return res.send(data);

})};

/**
 * PUT /project/:project_id
 */
exports.setProject = async (req, res) => { await w(res, async (t) => {

    const filteredQueries = Project.filterQueries(req.body, false);
    const project = await Project.findOne({
        where: {id: res.locals.project_id},
    }, t);

    //Proceed
    return APIforSavingWithHistory(req, res, 'project', project, filteredQueries, {
        mapping_history: Project.display,
        mapping: (project) => ({
            ...project.display(),
            my_rights: res.locals.rights,
        }),
    });

})};

/**
 * DELETE /project/:project_id
 */
exports.removeProject = async (req, res) => { await w(res, async (t) => {

    const project = res.locals.project;
    
    //Copy project obj
    const old_project = {
        ...project.display(),
        my_rights: res.locals.rights,
    };

    //Soft delete project
    await project.update({
        deleted_by: res.locals.user_id,
        deleted_at: Math.floor(new Date().getTime() / 1000),
    }, t);

    //Return old project obj
    return res.send(old_project);

})};

/**
 * PUT /project/:project_id/assign
 */
exports.assignProject = async (req, res) => { await w(res, async (t) => {

    const project_id = req.params.project_id;

    //Missing params -> 400
    const user_id = req.query.user_id;
    if (!user_id){
        return e(400, res, "missing_params", "Missing Parameters");
    }

    //Invalid rights -> 400
    const rights = req.query.rights;
    if (!['viewer', 'editor', 'owner'].includes(rights)){
        return e(400, res, "invalid_rights_type", "Invalid Rights Type");
    }

    //User not found -> 404
    const user = await User.findOne({where: {id: user_id}}, t);
    if (!user){
        return e(404, res, "user_not_found", "User Not Found");
    }

    //Prepare New Data
    const current_timestamp = Math.floor(new Date().getTime() / 1000);
    let data = {
        id: uuid(),
        user_id, project_id, rights,
        created_at: current_timestamp,
        created_by: res.locals.user_id,
    };

    //Check Old Assignment
    let project_assignment_old = await ProjectAssignment.findOne({where: {
        user_id, project_id
    }}, t);
    const rights_old = project_assignment_old ? project_assignment_old.rights : null;

    //Don't do anything if rights remains unchanged
    if (rights == rights_old){
        data = project_assignment_old.toJSON();
        for (let f of ['id', 'deleted_at', 'deleted_by']) delete data[f];
        return res.send(data);
    }

    //Create New Assignment
    await ProjectAssignment.create(data, t);

    //Remove Old Assignment
    if (project_assignment_old){
        await project_assignment_old.update({
            deleted_at: current_timestamp,
            deleted_by: res.locals.user_id,
        }, t);
    }

    //Return Data
    delete data.id;
    return res.send(data);

})};

/**
 * PUT /project/:project_id/unassign
 */
exports.unassignProject = async (req, res) => { await w(res, async (t) => {

    const project_id = req.params.project_id;

    //Missing params -> 400
    const user_id = req.query.user_id;
    if (!user_id){
        return e(400, res, "missing_params", "Missing Parameters");
    }
    
    //User not found -> 404
    const user = await User.findOne({where: {id: user_id}}, t);
    if (!user){
        return e(404, res, "user_not_found", "User Not Found");
    }

    //Remove ProjectAssignment item
    let project_assignment = await ProjectAssignment.findOne({where: {
        user_id, project_id
    }}, t);

    let data = {};
    if (project_assignment){
        data = await project_assignment.update({
            deleted_at: Math.floor(new Date().getTime() / 1000),
            deleted_by: res.locals.user_id,
        }, t);
    }

    //Return Data
    delete data.id;
    return res.send(data);

})};

/**
 * GET /project/:project_id/assignment
 */
exports.getProjectAssignments = async (req, res) => { await w(res, async (t) => {

    let response = await APIforListing(req, res, 'User', {
        mapping: (instance) => {
            let data = instance.display();
            data.my_rights = null;
            data.my_assignment = null;
            if (data.ProjectAssignments.length){
                data.my_rights = data.ProjectAssignments[0].rights;
                data.my_assignment = {
                    rights: data.ProjectAssignments[0].rights,
                    created_at: data.ProjectAssignments[0].created_at,
                    created_by: data.ProjectAssignments[0].created_by,
                };
            }
            delete data.ProjectAssignments;
            return data;
        },
        include: {
            model: ProjectAssignment,
            where: {project_id: req.params.project_id},
            required: true,
        },
        count_use_include: true,
    });
    return response;

})};

/**
 * GET /project/:project_id/settings
 */
exports.getProjectSettings = async (req, res) => { await w(res, async (t) => {

    const project_id = res.locals.project_id;
    const project_settings = await ProjectSettings.findOne({where: {project_id}});

    if (!project_settings){
        return e(500, res, "project_settings_missing", "Project Settings Missing");
    }

    //Return Data
    data = project_settings.toJSON();
    delete data.id;
    return res.send(data);

})};

/**
 * PUT /project/:project_id/settings
 */
exports.setProjectSettings = async (req, res) => { await w(res, async (t) => {

    const project_id = res.locals.project_id;
    const project_settings = await ProjectSettings.findOne({
        where: {project_id}
    });
    const filteredQueries = ProjectSettings.filterQueries(req.body, false);

    if (!project_settings){
        return e(500, res, "project_settings_missing", "Project Settings Missing");
    }

    //Proceed
    return APIforSavingWithHistory(req, res, 'project-settings', project_settings, filteredQueries, {});

})};