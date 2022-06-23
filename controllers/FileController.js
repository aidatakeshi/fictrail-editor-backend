const Project = $models.Project;
const User = $models.User;
const File = $models.File;
const LoginSession = $models.LoginSession;

const { QueryTypes, Op } = require('sequelize');
const {e, val_e, w} = require("./common");
const {APIforListing, APIforSavingWithHistory} = require("./common");

const { v4: uuid } = require('uuid');
const multer  = require('multer');
const fs = require('fs-extra');

/**
 * Note: 404 "project_not_found" already handled in AuthMiddleware
 */

/**
 * POST /p/:project_id/file
 * (TBD: file size limit, repetition detection)
 */
 exports.uploadFile = async (req, res) => { await w(res, async (t) => {

    const project_id = res.locals.project_id;
    const new_file_id = await File.getNewFileID();
    const directory = File.getNewFileDirectory();
    const upload_path = `uploads/${project_id}/${directory}`;
    const current_timestamp = Math.floor(new Date().getTime() / 1000);
    let mimetype, filename;
    //Prepare Storage
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            fs.mkdirsSync(upload_path);
            cb(null, upload_path);
        },
        filename: function (req, file, cb) {
            mimetype = file.mimetype;
            extension = mimetype.split('/').pop();
            filename = `${new_file_id}.${current_timestamp}.${extension}`;
            cb(null, filename);
        },
    });

    //Prepare upload (multer middleware, now used in controller)
    const upload = multer({ storage: storage }).single('file');

    //Do Upload
    upload(req, res, async function (error) {
        if (error) {
            return e(500, res, 'file_upload_error', 'File Upload Error');
        }

        //If Empty -> 400
        if (!req.file){
            return e(400, res, 'file_missing_in_multipart', 'File Missing In Multipart');
        }

        //Upload Successful
        const file = req.file;

        //Create New Item in Database
        const file_entry = await File.create({
            id: new_file_id,
            project_id,
            filename_original: file.originalname,
            directory, filename, mimetype,
            size: file.size,
            mimetype: file.mimetype,
            encoding: file.encoding,
            created_by: res.locals.user_id,
            created_at: current_timestamp,
        });
        
        //Return Data
        res.send(file_entry.display());
    });

})};

/**
 * /p/:project_id/file/:file_key
 * Notice that this API does not use AuthMiddleware
 */
exports.getFile = async (req, res) => { await w(res, async (t) => {

    //File Not Found -> 404
    const fmeta = await File.findOne({ where: {id: req.params.file_key, project_id: req.params.project_id} });
    if (!fmeta){
        return e(404, res, 'file_not_found', 'File Not Found');
    }

    //Return Binary File
    const path = `uploads/${fmeta.project_id}/${fmeta.directory}/${fmeta.filename}`;
    const mimetype = fmeta.mimetype;
    const filename = fmeta.filename_original;
    const size = fmeta.size;

    try{
        fs.readFileSync(path);
    }catch (error){
        return e(404, res, 'file_not_found', 'File Not Found');
    }

    res.writeHead(200, {
        'Content-Disposition': `inline; name="${filename}"`,
        'Content-Type': mimetype,
        'Content-Length': size,
    });
    const readStream = fs.createReadStream(path);
    readStream.pipe(res);
    
})};

/**
 * /p/:project_id/file/:file_key/meta
 */
exports.getFileMeta = async (req, res) => { await w(res, async (t) => {

    //File Not Found -> 404
    const fmeta = await File.findOne({ where: {id: req.params.file_key, project_id: req.params.project_id} });
    if (!fmeta){
        return e(404, res, 'file_not_found', 'File Not Found');
    }

    //Return Data
    return res.send(fmeta.display());

})};