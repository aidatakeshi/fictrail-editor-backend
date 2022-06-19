const Project = $models.Project;
const ProjectAssignment = $models.ProjectAssignment;
const User = $models.User;

const {e, val_e, w} = require("./common");
const {listingAPI, getDisplayObject, filterQueries} = require("./common");

/**
 * POST /project
 */
exports.newProject = async (req, res) => { await w(res, async (t) => {


})};

/**
 * GET /project
 */
exports.getProjects = async (req, res) => { await w(res, async (t) => {

    //Not root user: Only list projects assigned to the user, and public projects
    if (!res.locals.is_root_user){
        let response = await listingAPI(req, res, 'Project', {
            custom_select: 'projects.*, project_assignments.rights',
            custom_join_statement: 'LEFT JOIN project_assignments ON projects.id = project_assignments.project_id',
            append_where: 'user_id = ? or is_public = true',
            append_where_replacement: res.locals.id,
        });
        return response;
    }
    //Root user: List all projects
    else{
        let response = await listingAPI(req, res, 'Project', {
            additional_data: () => ({rights: 'root'}),
        });
        return response;
    }

})};

/**
 * GET /project/:project_id
 */
exports.getProject = async (req, res) => { await w(res, async (t) => {


})};

/**
 * PUT /project/:project_id
 */
exports.setProject = async (req, res) => { await w(res, async (t) => {


})};

/**
 * DELETE /project/:project_id
 */
exports.removeProject = async (req, res) => { await w(res, async (t) => {


})};

/**
 * PUT /project/:project_id/assign
 */
exports.assignProject = async (req, res) => { await w(res, async (t) => {


})};

/**
 * PUT /project/:project_id/unassign
 */
exports.unassignProject = async (req, res) => { await w(res, async (t) => {


})};

/**
 * GET /project/:project_id/settings
 */
 exports.getProjectSettings = async (req, res) => { await w(res, async (t) => {


})};

/**
 * PUT /project/:project_id/settings
 */
exports.setProjectSettings = async (req, res) => { await w(res, async (t) => {


})};