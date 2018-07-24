<?php

/**
 * Functions for the curation.
 */
class Curation {
    /**
     * @api {put} /curation/settings/:projectId Sets the status for the given project.
     * @apiGroup Curation
     * @apiSuccess (200) {Object} project The changed project.
     * @apiError (401) Unauthorized Only admins and for the project registered curators can set the status.
     */
    public static function setSettings($projectId) {
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
        
        parse_str(file_get_contents('php://input'), $data); // get data
        
        /** status **/
        if(array_key_exists('status', $data)) {        
            DB::$db->projects->updateOne(['id' => $project->id],[
                '$set' => ['status' => $data['status']]
            ]);
        }
        
        Projects::getOne($project->id);
    }

    /**
     * @api {get} /curation/uploads/:projectId Gets the curation uploads for the given project.
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
        $result = DB::$db->files->find([
            'projectId' => $projectId,
            'type' => Files::CURATION_INFO
        ],[
            'projection' => ['_id' => 0]
        ]);
        $uploads = [];
        foreach($result as $upload) $uploads[] = $upload;        
        print json_encode($uploads);
    }
    
    /**
     * @api {get} /curation/files/:fileName Requests the file for download.
     * @apiGroup Curation
     * @apiSuccess (200) {Binary} file The file as a binary stream.
     * @apiError (401) Unauthorized Only admins and for the project registered users can get the uploads.
     * @apiError (404) NotFound File not found.
     */
    public static function download($fileName) {
        // not implemented as we can't download files through ajax
        Helper::exitCleanWithCode(501);
        
        /*Auth::checkkey();
        
        // get file
        $file = DB::$db->files->findOne([
            'fileName' => $fileName,
            'type' => Files::CURATION_INFO
        ]);
        
        if(! $file) // file not found
            Helper::exitCleanWithCode(404);
            
        $projectId = $file->projectId;
        //*** get project
        // if admin, get access to all projects
        if(Auth::isAdmin()) {
            $project = DB::$db->projects->findOne(['id' => $projectId]);
        } else {
            // if user, only active projects where user is curator
            $project = Auth::isApplicantOrCurator($projectId);
        }
        if(! $project) Helper::exitCleanWithCode(401);
        
        if(! Files::download($file->filename)) Helper::exitCleanWithCode(404);
        
         /**/
    }
   
    /**
     * @api {post} /curation/files/:projectId Uploads new files from curator to the project.
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
        
        // upload files
        Files::upload(Files::CURATION_INFO, $project->id, $_FILES, $descriptions);
        
        // get uploads
        $result = DB::$db->files->find([
            'projectId' => $projectId,
            'type' => Files::CURATION_INFO
        ],[
            'projection' => ['_id' => 0]
        ]);
        $uploads = [];
        foreach($result as $upload) $uploads[] = $upload;        
        print json_encode($uploads);
    }
    
    /**
     * @api {delete} /curation/file/:fileName Deletes the file.
     * @apiGroup Curation
     * @apiSuccess (200) {Object} uploads The remaining curation uploads for the project.
     * @apiError (401) Unauthorized Only admins and for the project registered curators can delete uploads.
     * @apiError (404) NotFound File not found in database.
     */
    public static function deleteUpload($fileName) {
        Auth::checkkey();
        
        // get file
        $file = DB::$db->files->findOne([
            'fileName' => $fileName,
            'type' => Files::CURATION_INFO
        ]);
        
        if(! $file) // file not found
            Helper::exitCleanWithCode(404);
            
        $projectId = $file->projectId;
        //*** get project
        // if admin, get access to all projects
        if(Auth::isAdmin()) {
            $project = DB::$db->projects->findOne(['id' => $projectId]);
        } else {
            // if user, only active projects where user is curator
            $project = Auth::isCurator($projectId);
        }
        if(! $project) Helper::exitCleanWithCode(401);
        
        // delete file
        Files::delete($file->fileName);
        
        // get uploads
        $result = DB::$db->files->find([
            'projectId' => $projectId,
            'type' => Files::CURATION_INFO
        ],[
            'projection' => ['_id' => 0]
        ]);
        $uploads = [];
        foreach($result as $upload) $uploads[] = $upload;        
        print json_encode($uploads);
    }
}