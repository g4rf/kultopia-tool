<?php

/**
 * Functions for project administration.
 */
class Projects {
    /**
     * @api {get} /projects Gets all projects for the logged in user.
     * @apiGroup Projects
     * @apiSuccess (200) {Array} projects An array of projects.
     * @apiError (401) Unauthorized Only registered users can get projects.
     */
    public static function get() {
        Auth::checkkey();
        
        // if admin, get all projects
        if(Auth::isAdmin()) {
            $result = DB::$db->projects->find([],[
                'sort' => ['parent' => 1, 'created' => -1]
            ]);
        } else {
            // if user, only active projects where user is applicant or curator
            $result = DB::$db->projects->find([
                'active' => ['$in' => [1,'1',true,'true']],
                '$or' => [
                    ['applicants' => Auth::getEmail()],
                    ['curators' => Auth::getEmail()],
                ]
            ],[
                'sort' => ['created' => -1]
            ]);
        }
        
        $projects = [];
        foreach($result as $project) {
            $temp = [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'active' => $project->active,
                'parent' => $project->parent,
                'consultingText' => $project->consultingText,
                'templateApplication' => $project->templateApplication
            ];            
            
            $now = new DateTime();            
            // application closed?
            $applicationClosing = DB::mongo2ApiDate($project->applicationClosing);
            if(Auth::isAdmin()) $temp['applicationClosing'] = $applicationClosing;
            if(new DateTime($applicationClosing) < $now) $temp['applicationClosed'] = true;
            else $temp['applicationClosed'] = false;
            // budget closed?
            $budgetClosing = DB::mongo2ApiDate($project->budgetClosing);
            if(Auth::isAdmin()) $temp['budgetClosing'] = $budgetClosing;
            if(new DateTime($budgetClosing) < $now) $temp['budgetClosed'] = true;
            else $temp['budgetClosed'] = false;
            
            // parent
            $parent = DB::$db->projects->findOne([
                'id' => $project->parent
            ]);
            if($parent) {
                $temp['parent'] = [
                    'id' => $parent->id,
                    'name' => $parent->name
                ];
            }
            
            // is curator?
            if(in_array(Auth::getEmail(), iterator_to_array($project->curators)))
                    $temp['isCurator'] = true;
            
            // created, applicants & curators
            if(Auth::isAdmin()) {
                // created
                $temp['created'] = DB::mongo2ApiDate($project->created);
                        
                // add applicants
                $resultApplicants = DB::$db->users->find([
                    'email' => ['$in' => $project->applicants]
                ],[ 'sort' => ['email' => 1] ]);
                $temp['applicants'] = [];
                foreach($resultApplicants as $applicant) {
                    $temp['applicants'][] = [
                        'id' => $applicant->id,
                        'email' => $applicant->email,
                        'name' => $applicant->name,
                        'active' => $applicant->active,
                        'confirmed' => !isset($applicant->key)
                    ];
                }
                
                // add curators
                $resultCurators = DB::$db->users->find([
                    'email' => ['$in' => $project->curators]
                ],[ 'sort' => ['email' => 1] ]);
                $temp['curators'] = [];
                foreach($resultCurators as $curator) {
                    $temp['curators'][] = [
                        'id' => $curator->id,
                        'email' => $curator->email,
                        'name' => $curator->name,
                        'active' => $curator->active,
                        'confirmed' => !isset($curator->key)
                    ];
                }
            }
            
            $projects[] = $temp;
        }
        
        print json_encode($projects);
    }
    
    /**
     * @api {get} /project/:id Get one project for the logged in user.
     * @apiGroup Projects
     * @apiSuccess (200) {Object} project The project.
     * @apiError (401) Unauthorized Only registered users can get projects.
     * @apiError (404) NotFound No project found.
     */
    public static function getOne($id) {
        Auth::checkkey();
        // if admin, get access to all projects
        if(Auth::isAdmin()) {
            $result = DB::$db->projects->findOne(['id' => $id]);
        } else {
            // if user, only active projects where user is applicant or curator
            $result = DB::$db->projects->findOne([
                'id' => $id,
                'active' => ['$in' => [1,'1',true,'true']],
                '$or' => [
                    ['applicants' => Auth::getEmail()],
                    ['curators' => Auth::getEmail()],
                ]
            ]);
        }
        
        if(! $result) Helper::exitCleanWithCode(404);
        
        $project = [
            'id' => $result->id,
            'name' => $result->name,
            'description' => $result->description,
            'active' => $result->active,
            'parent' => $result->parent,
            'consultingText' => $result->consultingText,
            'templateApplication' => $result->templateApplication
        ];
        
        $now = new DateTime();            
        // application closed?
        $applicationClosing = DB::mongo2ApiDate($result->applicationClosing);
        if(Auth::isAdmin()) $project['applicationClosing'] = $applicationClosing;
        if(new DateTime($applicationClosing) < $now) $project['applicationClosed'] = true;
        else $project['applicationClosed'] = false;
        // budget closed?
        $budgetClosing = DB::mongo2ApiDate($result->budgetClosing);
        if(Auth::isAdmin()) $project['budgetClosing'] = $budgetClosing;
        if(new DateTime($budgetClosing) < $now) $project['budgetClosed'] = true;
        else $project['budgetClosed'] = false;
            
        // parent
        $parent = DB::$db->projects->findOne([
            'id' => $result->parent
        ]);
        if($parent) {
            $project['parent'] = [
                'id' => $parent->id,
                'name' => $parent->name
            ];
        }
            
        // created, applicants & curators
        if(Auth::isAdmin()) {
            // created
            $project['created'] = DB::mongo2ApiDate($result->created);

            // add applicants
            $resultApplicants = DB::$db->users->find([
                'email' => ['$in' => $result->applicants]
            ],[ 'sort' => ['email' => 1] ]);
            $project['applicants'] = [];
            foreach($resultApplicants as $applicant) {
                $project['applicants'][] = [
                    'id' => $applicant->id,
                    'email' => $applicant->email,
                    'name' => $applicant->name,
                    'active' => $applicant->active,
                    'confirmed' => !isset($applicant->key)
                ];
            }

            // add curators
            $resultCurators = DB::$db->users->find([
                'email' => ['$in' => $result->curators]
            ],[ 'sort' => ['email' => 1] ]);
            $project['curators'] = [];
            foreach($resultCurators as $curator) {
                $project['curators'][] = [
                    'id' => $curator->id,
                    'email' => $curator->email,
                    'name' => $curator->name,
                    'active' => $curator->active,
                    'confirmed' => !isset($curator->key)
                ];
            }
        }
        
        print json_encode($project);
    }
   
    /**
     * @api {put} /project/:id Modify the project with the given id.
     * @apiGroup Projects
     * @apiParam {String} id The id.
     * @apiParam {String} [name] The name.
     * @apiParam {String} [description] The description.
     * @apiParam {String} [templateApplication] The template for the application.
     * @apiParam {String} [applicationClosingDate] The closing date for the application.
     * @apiParam {String} [applicationClosingTime] The closing time for the application.
     * @apiParam {String} [budgetClosingDate] The closing date for the budget.
     * @apiParam {String} [budgetClosingTime] The closing time for the budget.
     * @apiParam {Array} [applicants] The applicants.
     * @apiParam {Array} [curators] The curators.
     * @apiParam {String} [parent] The id of the parent project.
     * @apiParam {Boolean} [active] Sets if the project is active.
     * @apiSuccess (200) {Object} project The modified project.
     * @apiError (400) BadRequest Parameter name must not be empty, the parent project have to exist and the parent project must not be a child of another project.
     * @apiError (401) Unauthorized Only admins can update projects.
     * @apiError (404) NotFound Project with this id not found.
     */
    public static function update($id) {
        Auth::checkkey();
        if(! Auth::isAdmin()) Helper::exitCleanWithCode (401);
        
        // check if project exists
        if(! DB::$db->projects->findOne(['id' => $id]))
            Helper::exitCleanWithCode (404);
        
        // get data
        parse_str(file_get_contents('php://input'), $data); // get data
        
        // if it tries to change the name
        if(array_key_exists('name', $data)) {
            // name must not be empty
            if(strlen($data['name']) == 0) Helper::exitCleanWithCode (400);
        }
        
        // if it tries to change the parent
        if(array_key_exists('parent', $data)) {
            // avoid self reference
            if($id == $data['parent']) Helper::exitCleanWithCode (400);
            
            $parent = DB::$db->projects->findOne(['id' => $data['parent']]);
            // if no parent, no change
            if(!$parent) unset($data['parent']);
            else {
                // parent project's parent property must be null
                if($parent->parent != null) Helper::exitCleanWithCode (400);
            }
        }
        
        // closing times
        if(array_key_exists('applicationClosing', $data)) {
            DB::$db->projects->updateOne(['id' => $id],[
                '$set' => ['applicationClosing' =>
                            DB::api2MongoDate($data['applicationClosing'])]
            ]);
        }
        if(array_key_exists('budgetClosing', $data)) {
            DB::$db->projects->updateOne(['id' => $id],[
                '$set' => ['budgetClosing' =>
                            DB::api2MongoDate($data['budgetClosing'])]
            ]);
        }
        
        // allowed fields
        $allowed = ['name', 'description', 'consultingText', 'applicants',
            'curators', 'active', 'parent', 'created', 'templateApplication'];
        
        // change fields
        foreach($data as $key => $value) {
            if(! in_array($key, $allowed)) continue;
            
            if($value == 'false') $value = false;
            if($value == 'true') $value = true;
            
            DB::$db->projects->updateOne(['id' => $id],[
                '$set' => [$key => $value]
            ]);
        }
        
        print json_encode(DB::$db->projects->findOne([
            'id' => $id
        ],[
            'projection' => ['_id' => 0 ]
        ]));
    }
    
    /**
     * @api {post} /project Creates a new project.
     * @apiGroup Projects
     * @apiParam {String} name The name.
     * @apiParam {String} [description] The description.
     * @apiParam {Array} [applicants] The applicants.
     * @apiParam {String} [templateApplication] The id of the template for the application.
     * @apiParam {String} [budgetApplication] The id of the template for the budget.
     * @apiParam {Array} [curators] The curators.
     * @apiParam {String} [parent] The id of the parent project.
     * @apiSuccess (201) project Project created.
     * @apiError (400) BadRequest Parameter name or templateBudget are missing, parent project have to exist and must not be a child.
     * @apiError (401) Unauthorized Only admins are allowed to create projects.
     */
    public static function create() {
        Auth::checkkey();
        if(! Auth::isAdmin()) Helper::exitCleanWithCode (401);
        
        // check if name is set
        $name = filter_input(INPUT_POST, 'name');
        if(! $name) Helper::exitCleanWithCode(400);
        
        // check if budget template is set
        $templateBudget = filter_input(INPUT_POST, 'templateBudget');
        if(! $templateBudget) Helper::exitCleanWithCode(400);
        
        // check if description is set
        $description = filter_input(INPUT_POST, 'description');
        if(! $description) $description = '';
        
        // check if consultingText is set
        $consultingText = filter_input(INPUT_POST, 'consultingText');
        if(! $consultingText) $consultingText = '';
        
        // check if application template is set
        $templateApplication = filter_input(INPUT_POST, 'templateApplication');
        if(! $templateApplication) $templateApplication = null;
                        
        // closing times
        $applicationClosing = filter_input(INPUT_POST, 'applicationClosing');
        if(! $applicationClosing) $applicationClosing = DB::api2MongoDate ();
        else $applicationClosing = DB::api2MongoDate($applicationClosing);
        
        $budgetClosing = filter_input(INPUT_POST, 'budgetClosing');
        if(! $budgetClosing) $budgetClosing = DB::api2MongoDate ();
        else $budgetClosing = DB::api2MongoDate($budgetClosing);
        
        // check if parent is set
        $parentId = filter_input(INPUT_POST, 'parent');
        if(! $parentId) $parentId = null;
        else {
            $parent = DB::$db->projects->findOne(['id' => $parentId]);
            // is there a parent with this id?
            if(! $parent) Helper::exitCleanWithCode (400);
            // parent project's parent property must be null
            if($parent->parent != null) Helper::exitCleanWithCode (400);
        }        
        
        // applicants
        $applicants = filter_input(INPUT_POST, 'applicants', FILTER_DEFAULT,
                FILTER_REQUIRE_ARRAY);
        if(! $applicants) $applicants = [];
        
        // curators
        $curators = filter_input(INPUT_POST, 'curators', FILTER_DEFAULT,
                FILTER_REQUIRE_ARRAY);
        if(! $curators) $curators = [];
        
        // create project
        $id = Helper::createId();
        DB::$db->projects->insertOne([
            'id' => $id,
            'created' => DB::api2MongoDate(),
            'name' => $name,
            'description' => $description,
            'consultingText' => $consultingText,
            'templateApplication' => $templateApplication,
            'applicationClosing' => $applicationClosing,
            'budgetClosing' => $budgetClosing,
            'active' => true,
            'parent' => $parentId,
            'applicants' => $applicants,
            'curators' => $curators
        ]);
        
        // create new budget
        if(! Budget::create($id, $templateBudget))
                Helper::exitCleanWithCode(); // Internal error; should not be happen
        
        http_response_code(201);
        print json_encode(DB::$db->projects->findOne([
            'id' => $id
        ],[
            'projection' => ['_id' => 0]
        ]));
    }
}