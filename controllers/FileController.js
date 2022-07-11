const Project = $models.Project;
const User = $models.User;
const File = $models.File;
const LoginSession = $models.LoginSession;

const { QueryTypes, Op } = require('sequelize');
const {e, val_e, w} = require("./common");
const {APIforListing} = require("./common");

const { v4: uuid } = require('uuid');
const multer  = require('multer');
const fs = require('fs-extra');

/**
 * Note: 404 "project_not_found" already handled in AuthMiddleware
 */

/**
 * POST /p/:project_id/file
 * PUT /p/:project_id/file/:file_key
 * (TBD: repetition detection)
 */

exports.uploadFile = async (req, res) => { await w(res, async (t) => {

    const project_id = res.locals.project_id;
    let file_key;
    const directory = File.getNewFileDirectory();
    const upload_path = `uploads/${project_id}/${directory}`;
    const current_timestamp = Math.floor(new Date().getTime() / 1000);
    let mimetype, filename;
    let old_file_meta;

    //Check If File Exists (for PUT)
    if (req.params.file_key){
        old_file_meta = await File.findOne({ where: {key: req.params.file_key} });
        if (!old_file_meta){
            return e(404, res, 'file_not_found', 'File Not Found');
        }
        file_key = req.params.file_key;
    }
    //(For POST)
    else{
        file_key = await File.getNewFileKey();
    }

    //Prepare Storage
    const storage = multer.diskStorage({
        destination: function (req, file, callback) {
            fs.mkdirsSync(upload_path);
            return callback(null, upload_path);
        },
        filename: function (req, file, callback) {
            mimetype = file.mimetype;
            extension = file.originalname.split('.').pop();
            filename = `${file_key}.${current_timestamp}.${extension}`;
            return callback(null, filename);
        },
    });

    //Prepare upload (multer middleware, now used in controller)
    const upload = multer({
        storage: storage,
        limits: {
            fileSize: parseInt(process.env.FILE_SIZE_LIMIT || 10000000),
        },
        fileFilter: (req, file, callback) => {
            if (process.env.FILE_EXTENSION_ALLOWED){
                const extensions_allowed = process.env.FILE_EXTENSION_ALLOWED.split('|');
                const extension = file.originalname.split('.').pop();
                if (!extensions_allowed.includes(extension.toLowerCase())){
                    return e(400, res, 'extension_not_allowed', 'Extension Not Allowed');
                }
            }
            if (req.query.mimetype){
                const mimetype_prefix = (file.mimetype||'').split('/')[0];
                if (mimetype_prefix != req.query.mimetype){
                    return e(400, res, 'invalid_mimetype', 'Invalid Mimetype');
                }
            }
            return callback(null, true);
        },
    }).single('file');

    //Do Upload
    upload(req, res, async function (error) {
        
        //Upload Error Thrown?
        if (error) {
            console.log(error);
            if (error.code === 'LIMIT_FILE_SIZE'){
                return e(400, res, 'file_oversized', 'File Oversized');
            }
            return e(500, res, 'file_upload_error', 'File Upload Error');
        }

        //If Empty -> 400
        if (!req.file){
            return e(400, res, 'file_missing', 'File Missing in Body Multipart');
        }

        //Upload Successful
        const file = req.file;

        //Create New Item in Database
        const new_file_meta = await File.create({
            id: uuid(),
            key: file_key,
            project_id,
            filename_original: file.originalname,
            directory, filename, mimetype,
            size: file.size,
            mimetype: file.mimetype,
            encoding: file.encoding,
            created_by: res.locals.user_id,
            created_at: current_timestamp,
        });

        //Soft Delete Old File Meta
        if (old_file_meta){
            await old_file_meta.update({
                deleted_by: res.locals.user_id,
                deleted_at: Math.floor(new Date().getTime() / 1000),
            });
        }
        
        //Return Data
        res.send(new_file_meta.display());
    });

})};

/**
 * GET /p/:project_id/file/:file_key
 * Notice that this API does not use AuthMiddleware
 */
exports.getFile = async (req, res) => { await w(res, async (t) => {

    //File Not Found -> 404
    const fmeta = await File.findOne({ where: {
        key: req.params.file_key,
        project_id: req.params.project_id,
    } });
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
 * GET /p/:project_id/file/:file_key/meta
 */
exports.getFileMeta = async (req, res) => { await w(res, async (t) => {

    //File Not Found -> 404
    const fmeta = await File.findOne({ where: {
        key: req.params.file_key,
        project_id: req.params.project_id,
    } });
    if (!fmeta){
        return e(404, res, 'file_not_found', 'File Not Found');
    }

    //Return Data
    return res.send(fmeta.display());

})};

/**
 * DELETE /p/:project_id/file/:file_key
 */
exports.removeFile = async (req, res) => { await w(res, async (t) => {

    //File Not Found -> 404
    const fmeta = await File.findOne({ where: {
        key: req.params.file_key,
        project_id: req.params.project_id,
    } });
    if (!fmeta){
        return e(404, res, 'file_not_found', 'File Not Found');
    }
    
    //Copy file obj
    const old_fmeta = fmeta.display();

    //Soft delete file
    await fmeta.update({
        deleted_by: res.locals.user_id,
        deleted_at: Math.floor(new Date().getTime() / 1000),
    }, t);

    //Return old file obj
    return res.send(old_fmeta);

})};

/**
 * GET /p/:project_id/file
 */
exports.getFiles = async (req, res) => { await w(res, async (t) => {

    let response = await APIforListing(req, res, 'File', {
        where: { project_id: req.params.project_id },
        mapping: (file) => file.display(),
    });
    return response;

})};