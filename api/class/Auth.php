<?php

/**
 * Holds functions for the login.
 */
class Auth {
    /**
     * @api {post} /login Gets a key for valid credentials.
     * @apiGroup Auth
     * @apiParam {String} email A valid user email.
     * @apiParam {String} pw A valid password.
     * @apiSuccess {Object} user Information about the user and a key.
     * @apiSuccess {String} user.key A session key.
     * @apiSuccess {String} user.id The unique id of the user.
     * @apiSuccess {String} user.name The self defined name of the user.
     * @apiError (401) Unauthorized
     */
    public static function login($email, $pw) {
        $user = DB::$db->users->findOne([
            'email' => $email,
            'password' => $pw,
            'active' => ['$in' => [1,'1',true,'true']],
            'key' => ['$exists' => false]
        ]);
        
        if(! $user) { // not found
            Helper::exitCleanWithCode(401);
        } else { // user found
            $key = Helper::createKey();
            
            DB::$db->logins->replaceOne([
                'email' => $user->email
            ],[
                'email' => $user->email,
                'key' => $key,
                'timestamp' => time()
            ],[
                'upsert' => true
            ]);
            
            print json_encode([
                'key' => $key,
                'id' => $user->id,
                'name' => $user->name,
                'isadmin' => $user->isadmin
            ]);
        }
    }
    
    /**
     * @api {get} /checkkey Checks if the combination of user and key is valid.
     * @apiGroup Auth
     * @apiParam {String} email A valid user email.
     * @apiParam {String} key A valid key.
     * @apiSuccess (204) NoContent If check is successful, the API is going on.
     * @apiError (401) Unauthorized
     */
    public static function checkkey() {
        $adminMinutes = 30;
        $userMinutes = 48 * 60;
                
        $email = $_SERVER["PHP_AUTH_USER"];
        $key = $_SERVER["PHP_AUTH_PW"];
        
        //check if credentials exists
        $credentials = DB::$db->logins->findOne([
            'email' => $email,
            'key' => $key
        ]);
        if(! $credentials) Helper::exitCleanWithCode (401);
        
        // check lease time
        $minutes = $adminMinutes;
        if(! Auth::isAdmin()) $minutes = $userMinutes;
        $timestamp = new DateTime();
        $timestamp->setTimestamp($credentials->timestamp);
        $timestamp->add(new DateInterval("PT{$minutes}M"));
        if(time() > $timestamp->getTimestamp()) {
            Helper::exitCleanWithCode(401);
        }
        
        // refresh timestamp
        DB::$db->logins->updateOne(['email' => $email],
            ['$set' => ['timestamp' => time()]]);
    }
    
    /**
     * @api {get} /logout Logs out the current user and invalidates the key.
     * @apiGroup Auth
     * @apiSuccess (204) NoContent 
     */
    public static function logout() {
        $email = $_SERVER["PHP_AUTH_USER"];
        $key = $_SERVER["PHP_AUTH_PW"];
        
        // get user
        $user = DB::$db->users->findOne(['email' => $email]);
        if(! $user) Helper::exitCleanWithCode(204);
        
        // remove from collection
        DB::$db->logins->deleteOne([
            'email' => $user->email,
            'key' => $key
        ]);
        Helper::exitCleanWithCode (204);
    }
    
    /**
     * Returns the actual loggedin user id.
     * @return string The login id.
     */
    public static function getId() {
        // get user
        $user = DB::$db->users->findOne(['email' => self::getEmail()]);        
        return $user->id;
    }
    
    /**
     * Returns the actual loggedin user email.
     * @return string The login email.
     */
    public static function getEmail() {
        return $_SERVER["PHP_AUTH_USER"];
    }
    
    /**
     * Returns the actual loggedin user name.
     * @return string The name.
     */
    public static function getName() {
        // get user
        $user = DB::$db->users->findOne(['email' => self::getEmail()]);        
        return $user->name;
    }
    
    /**
     * Checks if the current user is admin.
     * @return boolean true if is admin, false otherwise
     */
    public static function isAdmin() {
        return DB::$db->users->findOne([
            'email' => $_SERVER["PHP_AUTH_USER"],
            'isadmin' => ['$in' => [1,'1',true,'true']],
        ]);
    }
}
