<?php

/**
 * Functions for user administration.
 */
class Accounts {
    /**
     * @api {get} /accounts Gets all registered users.
     * @apiGroup Accounts
     * @apiSuccess (200) {Array} users An array of users.
     * @apiError (401) Unauthorized Only registered users can get accounts.
     */
    public static function get() {
        if(! Auth::isAdmin()) Helper::exitCleanWithCode (401);
        
        $users = [];        
        $result = DB::$db->users->find([],[
            'sort' => ['email' => 1]
        ]);
        foreach($result as $user) {
            $users[] = [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'isadmin' => $user->isadmin,
                'active' => $user->active,
                'confirmed' => !isset($user->key)
            ];
        }
        
        print json_encode($users);
    }
   
    /**
     * @api {put} /account/:email Modify the user with the given email.
     * @apiGroup Accounts
     * @apiParam {String} email The email of the user.
     * @apiParam {String} [name] The new name of the user. If it already exists, the API responses with a 409.
     * @apiParam {Boolean} [active] Sets if the user is active.
     * @apiSuccess (200) {Object} user The modified user.
     * @apiError (400) BadRequest Parameter name must not be emty.
     * @apiError (401) Unauthorized Only registered users can update accounts.
     * @apiError (403) Forbidden You can only change your own account or have to be admin to change other accounts. You cannot change your own active status.
     * @apiError (404) NotFound User with this email not found.
     * @apiError (409) Conflict The name already exists.
     */
    public static function update($email) {
        if(! Auth::isAdmin()) Helper::exitCleanWithCode (401);
        
        // check if user exists
        if(! DB::$db->users->findOne(['email' => $email]))
            Helper::exitCleanWithCode (404);
        
        // get data
        parse_str(file_get_contents('php://input'), $data); // get data
        
        // if it tries to change the name
        if(array_key_exists('name', $data)) {
            // name must not be empty
            if($data['name'] == '') Helper::exitCleanWithCode (400);
            // name is the same, so no real change
            if($user->name == $data['name']) {
                unset($data['name']);
            } else {
            // check if name already exists
                if(DB::$db->users->findOne(['name' => $data['name']])) 
                    Helper::exitCleanWithCode(409);
            }
        }
        
        // allowed fields
        $allowed = ['name']; // user
        if(Auth::isOperator()) // operator
            if(!$me) $allowed[] = 'active'; // me cannot change own active status
        
        // change fields
        foreach($data as $key => $value) {
            if(! in_array($key, $allowed)) continue;
            
            if($value == 'false') $value = false;
            
            DB::$db->users->updateOne(['email' => $email],[
                '$set' => [$key => $value]
            ]);
        }
        
        print json_encode(DB::$db->users->findOne([
            'email' => $email
        ],[
            'projection' => ['_id' => 0, 'password' => 0]
        ]));
    }
    
    /**
     * @api {post} /account Creates a new account and sends an activation e-mail.
     * @apiGroup Accounts
     * @apiParam {String} email The email of the new user.
     * @apiParam {String} [name] The name of the new user.
     * @apiSuccess (201) user Account created, e-mail send. Returns the new user.
     * @apiError (400) BadRequest Parameter email missing.
     * @apiError (401) Unauthorized Only admins are allowed to create accounts.
     * @apiError (409) Conflict E-mail already exists.
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
            print json_encode(DB::$db->users->findOne(['email' => $email]));
            
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