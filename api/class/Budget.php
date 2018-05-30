<?php

/**
 * Functions for the applications.
 */
class Budget {    
    /**
     * @api {get} /budget/:projectId Gets the budget for the given project.
     * @apiGroup Budget
     * @apiSuccess (200) {Object} budget The budget.
     * @apiError (401) Unauthorized Only admins and for the project registered users can get the budget.
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
        
        //*** get application
        $budget = DB::$db->budgets->findOne([
            'id' => $project->budgetId
        ],[
            'projection' => ['_id' => 0, 'id' => 0]
        ]);
        if(! $budget) $budget = new stdClass();
        
        print json_encode($budget);
    }
   
    /**
     * @api {put} /budget/:projectId Updates the budget for the given project. Attention: As fields may disappear in a budget, the whole budget will be replaced by the given one.
     * @apiGroup Budget
     * @apiSuccess (200) {Object} budget The updated budget.
     * @apiError (401) Unauthorized Only admins, and for the project registered users can update the budget.
     */
    public static function update($projectId) {
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
        
        //*** get data
        parse_str(file_get_contents('php://input'), $data);
        
        //*** get budget        
        $id = $project->budgetId;
        
        // delete existing budget
        DB::$db->budgets->deleteOne(['id' => $id]);
        
        $budget = [];
        // build budget structure
        // TODO
        /*foreach($data as $key => $value) {
            if($key == '_id') continue; // _id not allowed
            if($key == 'id') continue; // id not allowed
            
            if($value == 'false') $value = false;
            if($value == 'true') $value = true;
            
            DB::$db->budgets->updateOne(['id' => $id],[
                '$set' => [$key => $value]
            ]);
        }*/
        // insert budget to database
        DB::$db->budgets->insertOne($budget);
        
        print json_encode(DB::$db->budget->findOne([
            'id' => $id
        ],[
            'projection' => ['_id' => 0, 'id' => 0]
        ]));
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
        $budget = DB::$db->templates->findOne(['id' => $templateId]);
        if(! $budget) return false;
        
        unset($budget->_id); // delete mongo id
        $budget->id = Helper::createId(); // create new budget id
        //
        // insert into budget collection
        DB::$db->budgets->insertOne($budget);
        
        // save budget id to project
        DB::$db->projects->updateOne(['id' => $projectId],[
            '$set' => ['budgetId' => $budget->id]
        ]);
        return $budget;
    }
}