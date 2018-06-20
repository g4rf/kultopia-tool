<?php

/**
 * Functions for the curation.
 */
class Curation {
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
            'project' => $projectId
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
                $name = '../' . Config::$_['uploadDirectory'] . "/" . Helper::createKey() .
                        '_' . basename($_FILES['file']['name'][$index]);
                
                if(move_uploaded_file($tmpName, $name)) {
                    DB::$db->uploads->insertOne([
                        'file' => $name,
                        'name' => basename($_FILES['file']['name'][$index]),
                        'description' => $descriptions[$index],
                        'type' => $_FILES['file']['type'][$index],
                        'size' => $_FILES['file']['size'][$index],
                        'project' => $projectId
                    ]);
                }
            }
        }
        
        // get uploads
        $result = DB::$db->uploads->find([
            'project' => $projectId
        ],[
            'projection' => ['_id' => 0]
        ]);
        $uploads = [];
        foreach($result as $upload) $uploads[] = $upload;        
        print json_encode($uploads);
    }
    
    /**
     * This is not an api function! Creates the first budget whilst creating a project.
     * ATTENTION: If you do this with an existing project, it will overwrite the existing budget with the template.
     * @param string $projectId The id of the project.
     * @param string $templateId The id of the budget template.
     * @return object|boolean On success the new budget, false on failure.
     */
    public static function create($projectId, $templateId) {        
        // get template
        $budgetTemplate = DB::$db->templates->findOne(['id' => $templateId]);
        if(! $budgetTemplate) return false;
        
        $newBudget = json_decode($budgetTemplate->structure, true);
        $newBudget['id'] = Helper::createId();
        $budget = (object)$newBudget;

        // insert into budget collection
        DB::$db->budgets->insertOne($budget);
        
        // save budget id to project
        DB::$db->projects->updateOne(['id' => $projectId],[
            '$set' => ['budgetId' => $budget->id]
        ]);
        return $budget;
    }
}