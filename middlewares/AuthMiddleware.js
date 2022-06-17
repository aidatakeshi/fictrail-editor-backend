const User = $models.User;
const Project = $models.Project;
const LoginSession = $models.LoginSession;
const LoginRecord = $models.LoginRecord;

const {e, w} = require("../controllers/common");

/**
 * restriction:
 * "root": Root users only
 * "user": Any users (default mode)
 * "owner": Owner user of project (only applicable for routes with :project_id specified)
 * "editor": Editor user of project (same as above)
 * "viewer": Viewer user of project, or any user / non-user of public project (same as above)
 */
module.exports = function(restriction = "user"){
    return async (req, res, next) => { await w(res, async (t) => {

        let bearer_token, user, user_id, is_root_user;
        let project_id = req.params.project_id;
        let user_rights_in_project, is_project_public;

        //Bearer Token Specified
        if (bearer_token = req.headers.authorization){

            //Check if bearer token exists -> 401
            bearer_token = bearer_token.split(' ').pop();
            let login_session = await LoginSession.findOne({where: {bearer_token}});
            if (login_session === null){
                return e(401, res, "session_not_found", "Session Not Found");
            }

            //"Force Logout" Flag
            let force_logout_error = null, force_logout_message = null;

            //Check if login session expired -> 401
            const last_activity_time = login_session.last_activity_time;
            const logout_inactivity_sec = parseInt(process.env.LOGOUT_INACTIVITY_SEC);
            const current_timestamp = Math.floor(new Date().getTime() / 1000);
            if (current_timestamp > last_activity_time + logout_inactivity_sec){
                force_logout_error = "session_expired";
                force_logout_message = "Session Expired. Please Login Again";
            }

            //Get user instance
            user_id = login_session.user_id;
            user = await User.findOne({where: {id: user_id, is_deleted: false}}, t);
            is_root_user = user.is_root_user;

            //If user not found -> 401
            if (!user){
                force_logout_error = "user_not_found";
                force_logout_message = "User Not Found";
            }

            //If user disabled -> 401
            if (!user.is_enabled){
                force_logout_error = "user_disabled";
                force_logout_message = "User Disabled";
            }

            //Force Logout?
            if (force_logout_error){
                //Update login record & Remove login session
                let login_record = await LoginRecord.findOne({where: {bearer_token, logout_time: 0}}, t);
                if (login_record){
                    login_record.update({logout_time: current_timestamp}, t);
                }
                await login_session.destroy(t);
                return e(401, res, force_logout_error, force_logout_message);
            }

            //Proceed, Update last_activity_time
            login_session.update({last_activity_time: current_timestamp});
        }

        //Pass User Data to Controller
        res.locals.user = user;
        res.locals.id = user_id;
        res.locals.is_root_user = is_root_user;

        //Check User Rights in the Project
        if (project_id && res.locals.id){
            //...

        }

        //Handle Different Restrictions
        
        //root
        if (restriction == "root"){
            if (!is_root_user){
                return e(403, res, "root_user_only", "Root User Only");
            }
        }
        //owner
        else if (restriction == "owner" && project_id){
            if (user_rights_in_project == "owner"){}
            else{
                return e(403, res, "project_owner_only", "Project Owner Only");
            }
        }
        //editor
        else if (restriction == "editor" && project_id){
            if (user_rights_in_project == "owner"){}
            else if (user_rights_in_project == "editor"){}
            else{
                return e(403, res, "project_editor_only", "Project Editor Only");
            }
        }
        //viewer
        else if (restriction == "viewer" && project_id){
            if (is_project_public){}
            else if (user_rights_in_project){}
            else{
                return e(403, res, "project_private", "Project Private");
            }
        }
        //user
        else{
            if (!user_id){
                return e(401, res, "user_only", "User Only");
            }
        }

        //Pass to Next
        next();

    })};
}