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
        
        //*** get budget
        $budget = DB::$db->budgets->findOne([
            'id' => $project->budgetId
        ],[
            'projection' => ['_id' => 0, 'id' => 0]
        ]);
        if(! $budget) $budget = new stdClass();
        
        print json_encode($budget);
    }
    
    /**
     * Exports the budget to an CSV file.
     * @param String $projectId The id of the project of the budget.
     */
    public static function export($projectId) {
        //Auth::checkkey();
        
        //*** get project
        // if admin, get access to all projects
        //if(Auth::isAdmin()) {
            $project = DB::$db->projects->findOne(['id' => $projectId]);
        //} else {
            // if user, only active projects where user is curator
        //    $project = Auth::isCurator($projectId);
        //}
        
        // NotFound
        if(! $project) {
            ob_clean();
            http_response_code(404);
            exit;
        }
        
        //*** get budget
        $budget = DB::$db->budgets->findOne([
            'id' => $project->budgetId
        ],[
            'projection' => ['_id' => 0, 'id' => 0]
        ]);
        if(! $budget) $budget = new stdClass();
        
        // Ausgaben
        $csv = "Ausgaben\t\t\t\t\t\t\t";
        $row = 1 + 1;
        
        $expenses = '';
        $expFrom = $row + 1;
        foreach($budget->expenses as $expense) {
            $expenses .= "{$expense->name}\t\t\t\t\t\t";
            $row++; $row++;
            
            // costcenters
            $costcenters = '';
            $ccFrom = $row;
            foreach($expense->costcenters as $costcenter) {
                $costcenters .= "\t{$costcenter->name}\t\t\t\t";
                $row++;
                
                // positions
                $positions = '';
                $posFrom = $row;
                foreach($costcenter->positions as $position) {
                    $positions .= "\t\t{$position->name}\t{$position->detail}\t{$position->value}\n";
                    $row++;
                }
                
                $costcenters .= "=SUMME(E$posFrom:E$row)\n$positions";
            }
            
            $expenses .= "=SUMME(F$ccFrom:F$row)\n$costcenters\n";         
        }
        $csv .= "=SUMME(G$expFrom:G$row)\n\n$expenses";
        
        // Einnahmen
        $csv .= "\n\nEinnahmen\t\t\t\t\t\t\t";
        $row++; $row++; $row++;
        
        $earnings = '';
        $earnFrom = $row + 1;
        foreach($budget->earnings as $earning) {           
            $earnings .= "\t{$earning->name}\t{$earning->detail}\t{$earning->status}\t{$earning->value}\n";
            $row++;
        }
        $csv .= "=SUMME(E$earnFrom:E$row)\n$earnings";
        

        ob_clean(); // clear output buffer        
        http_response_code(200); // response code
        
        header('Content-Description: File Transfer');
        //header('Content-Type: text/plain;');
        header('Content-Type: text/comma-separated-values; charset=utf-8');
        header('Content-Disposition: attachment; filename="KFP ' . $project->name . '.csv"');
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');
        header('Content-Length: ' . strlen($csv));
        
        print $csv;
        
        exit;
    }
   
    /**
     * @api {put} /budget/:projectId Updates the budget for the given project. Attention: As fields may disappear in a budget, the whole budget will be replaced by the given one.
     * @apiGroup Budget
     * @apiSuccess (200) {Object} budget The updated budget.
     * @apiError (401) Unauthorized Only admins, and for the project registered users can update the budget.
     * @apiError (403) Forbidden When the budget closing time is reached, the budget can't be changed anymore.
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
        
        // check if budget is closed (if user isn't admin or curator)
        if(! Auth::isAdmin() || ! Auth::isCurator($project->id)) {
            $closing = new DateTime(DB::mongo2ApiDate($project->budgetClosing));
            if($closing < new DateTime()) Helper::exitCleanWithCode(403);
        }
        
        //*** get data
        parse_str(file_get_contents('php://input'), $data);
                
        //*** get budget        
        $id = $project->budgetId;
        
        // delete existing budget (using deleteMany is needed as through 
        // race conditions there can be temporarily more then one budget)
        DB::$db->budgets->deleteMany(['id' => $id]);
        
        // build new one
        $data['id'] = $id;
        $budget = (object)$data;
                
        // insert budget in database
        DB::$db->budgets->insertOne($budget);
        
        print json_encode(DB::$db->budgets->findOne([
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