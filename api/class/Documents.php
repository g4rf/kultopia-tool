<?php

/**
 * Functions for the project documents.
 */
class Documents {
    /**
     * @api {get} /documents/:projectId Gets the documents for the given project.
     * @apiGroup Documents
     * @apiSuccess (200) {Object} documents The informations for the documents.
     * @apiError (401) Unauthorized Only admins and for the project registered users can get the documents.
     */
    public static function get($projectId) {
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
        
        // get documents
        $result = DB::$db->files->find([
            'projectId' => $projectId,
            'type' => Files::PROJECT_DOCUMENT
        ],[
            'projection' => ['_id' => 0]
        ]);
        $uploads = [];
        foreach($result as $upload) $uploads[] = $upload;        
        print json_encode($uploads);
    }
    
    /**
     * @api {get} /documents/files/:fileName Requests the file for download.
     * @apiGroup Documents
     * @apiSuccess (200) {Binary} file The file as a binary stream.
     * @apiError (401) Unauthorized Only admins and for the project registered users can get the documents.
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
     * @api {post} /documents/files/:projectId Uploads new documents from user to the project.
     * @apiGroup Documents
     * @apiSuccess (200) {Object} documents All documents for the project.
     * @apiError (401) Unauthorized Only admins and for the project registered users may upload files.
     */
    public static function upload($projectId) {
        Auth::checkkey();
        
        //*** get project
        // if admin, get access to all projects
        if(Auth::isAdmin()) {
            $project = DB::$db->projects->findOne(['id' => $projectId]);
        } else {
            // if user, only active projects where user is registered for
            $project = Auth::isApplicantOrCurator($projectId);
        }        
        if(! $project) Helper::exitCleanWithCode(401);
        
        // get descriptions
        $descriptions = filter_input(INPUT_POST, 'description', FILTER_DEFAULT,
                FILTER_REQUIRE_ARRAY);
        
        // upload files
        Files::upload(Files::PROJECT_DOCUMENT, $project->id, $_FILES, $descriptions);
        
        // get uploads
        $result = DB::$db->files->find([
            'projectId' => $projectId,
            'type' => Files::PROJECT_DOCUMENT
        ],[
            'projection' => ['_id' => 0]
        ]);
        $uploads = [];
        foreach($result as $upload) $uploads[] = $upload;        
        print json_encode($uploads);
    }
    
    /**
     * @api {delete} /documents/file/:fileName Deletes the file.
     * @apiGroup Documents
     * @apiSuccess (200) {Object} documents The remaining documents for the project.
     * @apiError (401) Unauthorized Only admins and for the project registered users can delete uploads.
     * @apiError (404) NotFound File not found in database.
     */
    public static function delete($fileName) {
        Auth::checkkey();
        
        // get file
        $file = DB::$db->files->findOne([
            'fileName' => $fileName,
            'type' => Files::PROJECT_DOCUMENT
        ]);
        
        if(! $file) // file not found
            Helper::exitCleanWithCode(404);
            
        $projectId = $file->projectId;
        //*** get project
        // if admin, get access to all projects
        if(Auth::isAdmin()) {
            $project = DB::$db->projects->findOne(['id' => $projectId]);
        } else {
            // if user, only for the project registered users
            $project = Auth::isApplicantOrCurator($projectId);
        }
        if(! $project) Helper::exitCleanWithCode(401);
        
        // delete file
        Files::delete($file->fileName);
        
        // get uploads
        $result = DB::$db->files->find([
            'projectId' => $projectId,
            'type' => Files::PROJECT_DOCUMENT
        ],[
            'projection' => ['_id' => 0]
        ]);
        $uploads = [];
        foreach($result as $upload) $uploads[] = $upload;        
        print json_encode($uploads);
    }
}