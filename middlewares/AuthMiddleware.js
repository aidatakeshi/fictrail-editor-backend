const User = $models.User;
const LoginSession = $models.LoginSession;
const LoginRecord = $models.LoginRecord;

const {e, w} = require("../controllers/common");

module.exports = async (req, res, next) => { await w(res, async (t) => {

    //Check if bearer token exists -> 401
    let bearer_token;
    if (!(bearer_token = req.headers.authorization)){
        return e(401, res, "missing_bearer_token", "Missing Bearer Token");
    }
    bearer_token = bearer_token.split(' ').pop();

    //Check bearer token -> 401
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
    const user_id = login_session.user_id;
    let user = await User.findOne({where: {id: user_id, is_deleted: false}}, t);

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

    //Proceed
    //Update last_activity_time
    login_session.update({last_activity_time: current_timestamp});

    //Pass User Data to Controller
    res.locals.user = user;
    res.locals.id = user.id;
    res.locals.is_root_user = user.is_root_user;

    //Pass to Next
    next();

})};