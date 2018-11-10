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
     * @deprecated
     */
    public static function exportCsv($projectId) {
        $project = DB::$db->projects->findOne(['id' => $projectId]);
        
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
        
        //*** create csv
        
        // meta
        $csv = "Projektname:\t{$project->name}\n"
            . "Beschreibung:\t{$project->description}\n"
            . "Status:\t{$project->status}\n"
            . "Kontakt:\t" . 
                    implode(', ', iterator_to_array($project->applicants)) . "\n"
            . "\n\n";
        $row = 1 + 6;
        
        // Ausgaben
        $csv .= "Ausgaben\t\t\t\t\t\t\t";
        $row++;
        
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
        header('Content-Type: text/comma-separated-values; charset=utf-8');
        header('Content-Disposition: attachment; filename="KFP ' . $project->name . '.csv"');
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Content-Length: ' . strlen($csv));
        
        print $csv;
        
        exit;
    }
    
    /**
     * Exports the budget to an Excel file.
     * @param String $projectId The id of the project of the budget.
     */
    public static function export($projectId) {
        $project = DB::$db->projects->findOne(['id' => $projectId]);
        
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
        
        //*** header
        ob_clean();
        http_response_code(200);
        header('Expires: 0');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
                
        //*** column indexes
        $A = 0; $B = 1; $C = 2; $D = 3; $E = 4; $F = 5; $G = 6; $H = 7; $I = 8;
        
        //*** create excel
        $workbook = new Spreadsheet_Excel_Writer();
        $workbook->setVersion(8); // Excel97 - 2003

        // sending HTTP headers
        $workbook->send("KFP {$project->name}.xls");

        // creating a worksheet
        $kfp =& $workbook->addWorksheet('KFP');
        
        // set encoding
        $kfp->setInputEncoding('UTF-8');
        
        // adding formats
        $currency = '#,##0.00 [$€];[Red]-#,##0.00 [$€]';
        
        $lightred = 20;
        $workbook->setCustomColor($lightred, 255, 200, 200);
        $lightgreen = 21;
        $workbook->setCustomColor($lightgreen, 200, 255, 200);
        $gray = 22;
        $workbook->setCustomColor($gray, 175, 175, 175);
        $lightgray = 23;
        $workbook->setCustomColor($lightgray, 210, 210, 210);
        
        $formatBold =& $workbook->addFormat();
        $formatBold->setBold();
        
        $formatExpenses =& $workbook->addFormat();
        $formatExpenses->setBold();
        $formatExpenses->setFgColor($lightred);
        $formatExpenses->setNumFormat($currency);
        
        $formatEarnings =& $workbook->addFormat();
        $formatEarnings->setBold();
        $formatEarnings->setFgColor($lightgreen);
        $formatEarnings->setNumFormat($currency);
        
        $formatCategory =& $workbook->addFormat();
        $formatCategory->setBold();
        $formatCategory->setNumFormat($currency);
        $formatCategory->setFgColor($gray);
        
        $formatCostcenter =& $workbook->addFormat();
        $formatCostcenter->setNumFormat($currency);
        $formatCostcenter->setFgColor($lightgray);
        
        $formatPosition =& $workbook->addFormat();
        $formatPosition->setNumFormat($currency);
        
        $formatDifference =& $workbook->addFormat();
        $formatDifference->setBold();
        $formatDifference->setAlign('right');
        $formatDifference->setNumFormat($currency);
        
        // meta
        $kfp->writeString(0, $A, 'Projektname:', $formatBold);
        $kfp->writeString(0, $B, $project->name);
        $kfp->writeString(1, $A, 'Beschreibung:', $formatBold);
        $kfp->writeString(1, $B, $project->description);
        $kfp->writeString(2, $A, 'Status:', $formatBold);
        $kfp->writeString(2, $B, $project->status);
        $kfp->writeString(3, $A, 'Kontakt:', $formatBold);
        $kfp->writeString(3, $B, implode(', ', iterator_to_array($project->applicants)));
        
        // Ausgaben
        $expStartRow = 6;
        $kfp->writeRow($expStartRow, $A, ['Ausgaben','','','','',''], $formatExpenses);
        
        $row = $expStartRow + 2;
        $catStartRow = $row;
        foreach($budget->expenses as $category) {
            $kfp->writeRow($row, $A, [$category->name,'','','',''],
                    $formatCategory);
            $catRow = $row;
            $row++;
            
            // costcenters
            $ccStartRow = $row;
            if(! empty($category->costcenters)) {
                foreach($category->costcenters as $costcenter) {
                    $kfp->writeRow($row, $A, [$costcenter->name,'','',''],
                            $formatCostcenter);
                    $ccRow = $row;
                    $row++;

                    // positions
                    $posStartRow = $row;
                    if(! empty($costcenter->positions)) {
                        foreach($costcenter->positions as $position) {
                            $kfp->writeRow($row, $B,
                                    [$position->name, $position->detail, Helper::convertDe2Decimal($position->value)],
                                    $formatPosition);
                            $row++;
                        }
                    }

                    $kfp->writeFormula($ccRow, $E, "=SUM(D$posStartRow:D$row)", 
                            $formatCostcenter);
                }
            }
            
            $kfp->writeFormula($catRow, $F, "=SUM(E$ccStartRow:E$row)", 
                        $formatCategory);
            $row++; // empty row
        }
        $kfp->writeFormula($expStartRow, $G, "=SUM(F$catStartRow:F$row)", 
                $formatExpenses);
        
        $row = $row + 1;
        
        // earnings
        $earnRow = $row;
        $kfp->writeRow($earnRow, $A, ['Einnahmen','','','','',''], $formatEarnings);
        $row++;
        
        $earnStartRow = $row;
        foreach($budget->earnings as $earning) {           
            $kfp->writeRow($row, $B,
                [$earning->name, $earning->detail, $earning->status, '',
                    Helper::convertDe2Decimal($earning->value)],
                $formatPosition);
            $row++;
        }
        $row++;
        $kfp->writeFormula($earnRow, $G, "=SUM(F$earnStartRow:F$row)", 
                $formatEarnings);
        
        // difference: earnings - expenses
        $kfp->writeString($row + 1, $F, 'Differenz:', $formatDifference);
        $kfp->writeFormula($row + 1, $G, '=G' . ++$earnRow . ' - G' . ++$expStartRow, 
                $formatDifference);
        
        // set widths
        $kfp->setColumn($A, $A, 15);
        $kfp->setColumn($B, $C, 40);
        $kfp->setColumn($D, $G, 12);

        // send the file
        $workbook->close();
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