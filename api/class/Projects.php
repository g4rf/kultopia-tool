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
                'parent' => $project->parent
            ];
            
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
     * @api {put} /project/:id Modify the project with the given id.
     * @apiGroup Projects
     * @apiParam {String} id The id.
     * @apiParam {String} [name] The name.
     * @apiParam {String} [description] The description.
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
        
        // allowed fields
        $allowed = ['name', 'description', 'applicants', 'curators', 'active',
            'parent', 'created'];
        
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
     * @apiParam {Array} [curators] The curators.
     * @apiParam {String} [parent] The id of the parent project.
     * @apiSuccess (201) project Project created.
     * @apiError (400) BadRequest Parameter name missing, parent project have to exist and must not be a child.
     * @apiError (401) Unauthorized Only admins are allowed to create accounts.
     */
    public static function create() {
        if(! Auth::isAdmin()) Helper::exitCleanWithCode (401);
        
        // check if name is set
        $name = filter_input(INPUT_POST, 'name');
        if(! $name) Helper::exitCleanWithCode(400);
        
        // check if description is set
        $description = filter_input(INPUT_POST, 'description');
        if(! $description) $description = '';
        
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
            'active' => true,
            'parent' => $parentId,
            'applicants' => $applicants,
            'curators' => $curators
        ]);
        
        http_response_code(201);
        print json_encode(DB::$db->projects->findOne([
            'id' => $id
        ],[
            'projection' => ['_id' => 0]
        ]));
    }
}