const User = $models.User;
const LoginSession = $models.LoginSession;
const LoginRecord = $models.LoginRecord;
const { v4: uuid } = require('uuid');

function e(status, res, error, message){
    return res.status(status).send({error, message});
}

module.exports = async function (req, res, next) {

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

    let forceLogout = false;

    //Check if login session expired -> 401
    let last_activity_time = login_session.last_activity_time;
    let logout_inactivity_sec = parseInt(process.env.LOGOUT_INACTIVITY_SEC);
    let current_timestamp = Math.floor(new Date().getTime() / 1000);
    if (current_timestamp > last_activity_time + logout_inactivity_sec){
        forceLogout = true;
        e(401, res, "session_expired", "Session Expired. Please Login Again");
    }

    //Get user instance
    const user_id = login_session.user_id;
    const user = await User.findOne({where: {id: user_id, is_deleted: false}});

    //If user not found -> 401
    if (!user){
        forceLogout = true;
        e(401, res, "user_not_found", "User Not Found");
    }

    //If user disabled -> 401
    if (!user.is_enabled){
        forceLogout = true;
        e(401, res, "user_disabled", "User Disabled");
    }

    //Force Logout?
    if (forceLogout){
        let login_record = await LoginRecord.findOne({where: {bearer_token, logout_time: 0}});
        if (login_record){
            login_record.update({logout_time: current_timestamp});
        }
        login_session.destroy();
        return false;
    }

    //Proceed
    //Update last_activity_time
    login_session.update({last_activity_time: current_timestamp});

    //Pass User Data to Controller
    user_json = user.toJSON();
    for (let field in user_json){
        if (!User.hiddenFields.includes(field)){
            res.locals[field] = user_json[field];
        }
    }

    next();

}