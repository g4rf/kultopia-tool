<?php

/**
 * Functions for the applications.
 */
class Applications {    
    /**
     * @api {get} /application/:projectId Gets the application for the given project.
     * @apiGroup Applications
     * @apiSuccess (200) {Object} application The application.
     * @apiError (401) Unauthorized Only admins, and for the project registered users can get the application.
     */
    public static function get($projectId) {        
        Auth::checkkey();
        
        //*** get project
        // if admin, get access to all projects
        if(Auth::isAdmin()) {
            $project = DB::$db->projects->findOne(['id' => $projectId]);
        } else {
            // if user, only active projects where user is applicant or curator
            $project = DB::$db->projects->findOne([
                'id' => $projectId,
                'active' => ['$in' => [1,'1',true,'true']],
                '$or' => [
                    ['applicants' => Auth::getEmail()],
                    ['curators' => Auth::getEmail()],
                ]
            ]);
        }        
        if(! $project) Helper::exitCleanWithCode(401);
        
        //*** get application
        $application = DB::$db->applications->findOne([
            'id' => $project->applicationId
        ],[
            'projection' => ['_id' => 0, 'id' => 0]
        ]);
        if(! $application) $application = new stdClass();
        
        print json_encode($application);
    }
   
    /**
     * @api {put} /application/:projectId Updates the application for the given project.
     * @apiGroup Applications
     * @apiSuccess (200) {Object} application The updated application.
     * @apiError (401) Unauthorized Only admins, and for the project registered users can update the application.
     * @apiError (403) Forbidden When the application closing time is reached, the application can't be changed anymore.
     */
    public static function update($projectId) {        
        Auth::checkkey();
        
        //*** get project
        // if admin, get access to all projects
        if(Auth::isAdmin()) {
            $project = DB::$db->projects->findOne(['id' => $projectId]);
        } else {
            // if user, only active projects where user is applicant or curator
            $project = DB::$db->projects->findOne([
                'id' => $projectId,
                'active' => ['$in' => [1,'1',true,'true']],
                '$or' => [
                    ['applicants' => Auth::getEmail()],
                    ['curators' => Auth::getEmail()],
                ]
            ]);
        }        
        if(! $project) Helper::exitCleanWithCode(401);
        
        // check if application is closed
        $closing = new DateTime(DB::mongo2ApiDate($project->applicationClosing));
        if($closing < new DateTime()) Helper::exitCleanWithCode(403);
        
        //*** get data
        parse_str(file_get_contents('php://input'), $data);
        
        //*** get application
        if(! $project->applicationId) {
            // set new application
            $project->applicationId = Helper::createId();
            DB::$db->projects->updateOne(['id' => $projectId],[
                '$set' => ['applicationId' => $project->applicationId]
            ]);
            DB::$db->applications->insertOne([
                'id' => $project->applicationId
            ]);
        }
        $id = $project->applicationId;
        
        // change fields
        foreach($data as $key => $value) {
            if($key == '_id') continue; // _id not allowed
            if($key == 'id') continue; // id not allowed
            
            if($value == 'false') $value = false;
            if($value == 'true') $value = true;
            
            DB::$db->applications->updateOne(['id' => $id],[
                '$set' => [$key => $value]
            ]);
        }
        
        print json_encode(DB::$db->applications->findOne([
            'id' => $id
        ],[
            'projection' => ['_id' => 0, 'id' => 0]
        ]));
    }
}