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
                'sort' => ['name' => 1]
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
                'sort' => ['name' => 1]
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
            if(Auth::isAdmin()) {
                // add applicants
                $resultApplicants = DB::$db->users->find([
                    'email' => ['$in' => $project->applicants]
                ],[ 'sort' => ['email' => 1] ]);
                $$temp->applicants = [];
                foreach($resultApplicants as $applicant) {
                    $temp->applicants[] = [
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
                $$temp->$curators = [];
                foreach($resultCurators as $curator) {
                    $temp->$curators[] = [
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
     * @apiError (400) BadRequest Parameter name must not be emty.
     * @apiError (401) Unauthorized Only admins can update projects.
     * @apiError (404) NotFound Project with this id not found.
     */
    public static function update($id) {
        if(! Auth::isAdmin()) Helper::exitCleanWithCode (401);
        
        // check if user exists
        if(! DB::$db->projects->findOne(['id' => $id]))
            Helper::exitCleanWithCode (404);
        
        // get data
        parse_str(file_get_contents('php://input'), $data); // get data
        
        // if it tries to change the name
        if(array_key_exists('name', $data)) {
            // name must not be empty
            if(strlen($data['name']) == 0) Helper::exitCleanWithCode (400);
        }
        
        // allowed fields
        $allowed = ['name', 'description', 'applicants', 'curators', 'active',
            'parent'];
        
        // change fields
        foreach($data as $key => $value) {
            if(! in_array($key, $allowed)) continue;
            
            if($value == 'false') $value = false;
            
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
     * @apiError (400) BadRequest Parameter name missing.
     * @apiError (401) Unauthorized Only admins are allowed to create accounts.
     */
    public static function create() {
        if(! Auth::isAdmin()) Helper::exitCleanWithCode (401);
        
        // check if e-mail is set
        $email = filter_input(INPUT_POST, 'email');
        if(! $email) Helper::exitCleanWithCode(400);
        
        // check if e-mail exists
        if(DB::$db->users->findOne(['email' => $email])) 
            Helper::exitCleanWithCode(409);
        
        // check if name is set
        $name = filter_input(INPUT_POST, 'name');
        if(! $name) $name = '';
        
        // create user
        $id = Helper::createId();
        $key = Helper::createKey(30);
        $password = Helper::password();
        DB::$db->users->insertOne([
            'id' => $id,
            'email' => $email,
            'name' => $name,
            'active' => 1,
            'key' => $key,
            'password' => $password
        ]);
        
        // send mail with key
        $body = "Hallo,\n"
                . "\n"
                . "es wurde im Kultopia-Tool ein Account für die E-Mail-Adresse "
                . "$email angelegt. Falls das nicht beabsichtigt war, ignoriere "
                . "diese E-Mail.\n"
                . "\n"
                . "Das Passwort lautet: $password\n"
                . "\n"
                . "Um den Account zu aktivieren, folge dem Link:\n"
                . "\n"
                . Config::$_['apiUrl'] . "activate/$id/$key\n"
                . "\n"
                . "Gutes Gelingen!";
        
        if(Helper::mail($email, 'Account für Kultopia aktivieren', $body,
                $error)) {
            
            http_response_code(201);
            print json_encode(DB::$db->users->findOne([
                'email' => $email
            ],[
                'projection' => ['_id' => 0, 'password' => 0, 'key' => 0]
            ]));
            
        } else Helper::exitCleanWithCode(500, $error);
    }
    
    /**
     * @apiIgnore Users can't register on their own.
     * 
     * @api {post} /account/register Register a new user account and sends an activation e-mail.
     * @apiGroup Accounts
     * @apiParam {String} email The e-mail address of the new user.
     * @apiParam {String} name The name of the new user.
     * @apiSuccess (201) NoContent Account created, e-mail send.
     * @apiError (400) BadRequest Parameter email or name missing.
     * @apiError (409) Conflict E-mail or name already exists. The HTTP body contains the conflicting parameter ("email" or "name").
     */
    public static function register() {
        Helper::exitCleanWithCode(501);
        
        // check if e-mail is set
        $email = filter_input(INPUT_POST, 'email');
        if(! $email) Helper::exitCleanWithCode(400);
        
        // check if name is set
        $name = filter_input(INPUT_POST, 'name');
        if(! $name) Helper::exitCleanWithCode(400);
        
        // check if e-mail exists
        if(DB::$db->users->findOne(['email' => $email])) 
            Helper::exitCleanWithCode(409, 'email');
        
        // check if name exists
        if(DB::$db->users->findOne(['name' => $name])) 
            Helper::exitCleanWithCode(409, 'name');
        
        // create user
        $id = Helper::createId();
        $key = Helper::createKey(30);
        $password = Helper::password();
        DB::$db->users->insertOne([
            'id' => $id,
            'email' => $email,
            'name' => $name,
            'active' => 1,
            'key' => $key,
            'password' => $password
        ]);
        
        // send mail with key
        $body = "Hallo,\n"
                . "\n"
                . "Du hast Dich mit der E-Mail-Adresse $email für das "
                . "Kultopia-Tool registriert. Falls das nicht beabsichtigt war, "
                . "ignoriere diese E-Mail.\n"
                . "\n"
                . "Dein Passwort lautet: $password\n"
                . "\n"
                . "Um den Account zu aktivieren, folge dem Link:\n"
                . "\n"
                . Config::$_['apiUrl'] . "activate/$id/$key\n"
                . "\n"
                . "Gutes Gelingen!";
        
        if(Helper::mail($email, 'Registrierung Kultopia', $body,
                $error)) {
            
            http_response_code(201);
            
        } else Helper::exitCleanWithCode(500, $error);
    }
    
    /**
     * Activates an account with the given key.
     * @param string $id The id of the account.
     * @param string $key The key to activate the account.
     */
    public static function activate($id, $key) {
        ob_clean();
        header("Content-type: text/plain");
        
        $updateResult = DB::$db->users->updateOne([
            'id' => $id,
            'key' => $key
        ], [
            '$unset' => ['key' => '']
        ]);
        
        if($updateResult->getModifiedCount()) {    
            print "Account aktiviert.";
        } else {
            //http_response_code(410);
            print "Der Account wurde bereits aktiviert oder nicht gefunden.";
        }
        
        exit();
    }
}