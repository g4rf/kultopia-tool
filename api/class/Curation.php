<?php

/**
 * Functions for the curation.
 */
class Curation {
    const CURATION_UPLOAD = 'curation-upload';
    
    /**
     * @api {get} /curation-upload/:projectId Gets the uploads for the given project.
     * @apiGroup Curation
     * @apiSuccess (200) {Object} uploads The informations for the upload.
     * @apiError (401) Unauthorized Only admins and for the project registered users can get the uploads.
     */
    public static function getUploads($projectId) {
        Auth::checkkey();
        
        //*** get project
        // if admin, get access to all projects
        if(Auth::isAdmin()) {
            $project = DB::$db->projects->findOne(['id' => $projectId]);
        } else {
            // if user, only active projects where user is applicant or curator
            $project = Auth::isApplicantOrCurator($projectId);
        }
        if(! $project) Helper::exitCleanWithCode(401);
        
        // get uploads
        $result = DB::$db->uploads->find([
            'project' => $projectId,
            'type' => self::CURATION_UPLOAD
        ],[
            'projection' => ['_id' => 0]
        ]);
        $uploads = [];
        foreach($result as $upload) $uploads[] = $upload;        
        print json_encode($uploads);
    }
   
    /**
     * @api {post} /curation-upload/:projectId Uploads a new info file from curator to the project.
     * @apiGroup Curation
     * @apiSuccess (200) {Object} uploads All curation uploads for the project.
     * @apiError (401) Unauthorized Only curators and admins may upload files.
     */
    public static function upload($projectId) {
        Auth::checkkey();
        
        //*** get project
        // if admin, get access to all projects
        if(Auth::isAdmin()) {
            $project = DB::$db->projects->findOne(['id' => $projectId]);
        } else {
            // if user, only active projects where user is curator
            $project = Auth::isCurator($projectId);
        }        
        if(! $project) Helper::exitCleanWithCode(401);
        
        // get descriptions
        $descriptions = filter_input(INPUT_POST, 'description', FILTER_DEFAULT,
                FILTER_REQUIRE_ARRAY);
        
        // go through files
        foreach ($_FILES['file']['error'] as $index => $error) {
            if ($error == UPLOAD_ERR_OK) {
                $tmpName = $_FILES['file']['tmp_name'][$index];
                $name = basename($_FILES['file']['name'][$index]);
                $fileName = $projectId . '_curation-upload_' . Helper::createKey() .
                        '_' . $name;
                $path = '../' . Config::$_['uploadDirectory'] . "/" . $fileName;
                
                if(move_uploaded_file($tmpName, $path)) {
                    DB::$db->uploads->insertOne([
                        'file' => $fileName,
                        'filetype' => $_FILES['file']['type'][$index],
                        'size' => $_FILES['file']['size'][$index],
                        'name' => $name,
                        'description' => $descriptions[$index],                        
                        'project' => $projectId,
                        'type' => self::CURATION_UPLOAD
                    ]);
                }
            }
        }
        
        // get uploads
        $result = DB::$db->uploads->find([
            'project' => $projectId,
            'type' => self::CURATION_UPLOAD
        ],[
            'projection' => ['_id' => 0]
        ]);
        $uploads = [];
        foreach($result as $upload) $uploads[] = $upload;        
        print json_encode($uploads);
    }
    
    /**
     * @api {delete} /curation-upload/:file Deletes the file.
     * @apiGroup Curation
     * @apiSuccess (200) {Object} uploads The remaining curation uploads for the project.
     * @apiError (401) Unauthorized Only admins and for the project registered curators can delete uploads.
     * @apiError (404) NotFound File not found in database.
     */
    public static function deleteUpload($file) {
        Auth::checkkey();
        
        // get file
        $info = DB::$db->uploads->findOne([
            'file' => $file,
            'type' => self::CURATION_UPLOAD
        ]);
        
        if(! $info) // file not found
            Helper::exitCleanWithCode(404);
            
        $projectId = $info->project;
        //*** get project
        // if admin, get access to all projects
        if(Auth::isAdmin()) {
            $project = DB::$db->projects->findOne(['id' => $projectId]);
        } else {
            // if user, only active projects where user is curator
            $project = Auth::isCurator($projectId);
        }
        if(! $project) Helper::exitCleanWithCode(401);
        
        // delete file in file system
        $path = '../' . Config::$_['uploadDirectory'] . "/" . $info->file;
        unlink($path);
        
        // delete upload in database
        DB::$db->uploads->deleteOne([
            'file' => $file,
            'type' => self::CURATION_UPLOAD
        ]);        
        
        // get uploads
        $result = DB::$db->uploads->find([
            'project' => $projectId,
            'type' => self::CURATION_UPLOAD
        ],[
            'projection' => ['_id' => 0]
        ]);
        $uploads = [];
        foreach($result as $upload) $uploads[] = $upload;        
        print json_encode($uploads);
    }
}