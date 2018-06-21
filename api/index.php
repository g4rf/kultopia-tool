<?php

/***** Configuration *****/
define('DEBUG', true);

error_reporting(E_ERROR | E_WARNING | E_PARSE /*| E_NOTICE*/);
ini_set('log_errors', 1);
if(DEBUG) {
    ini_set('display_errors', 1);
} else {
    ini_set('display_errors', 0);
}


/***** Module *****/

// composer auto loader
require '../vendor/autoload.php';


/***** Program *****/
ob_start(); // start output buffering to be able to change output everytime

// do url magic
$request = explode('/', filter_input(INPUT_GET, 'request'));
// request method
$requestMethod = $_SERVER['REQUEST_METHOD'];

// initialize config
Config::initialize();

// initialize database
DB::initialize();

// CORS functionality
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE");
if(isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
    header("Access-Control-Allow-Headers: " . 
            $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']);
}
// checking for CORS preflight
if ($requestMethod == 'OPTIONS') {
     exit();
}

// JSONP callback
$jsonp = filter_input(INPUT_GET, 'callback');

// log api access
Helper::logApiAccess(
    $requestMethod . ' /' . filter_input(INPUT_GET, 'request')
    . " jsonp=$jsonp" 
    . ' ' . file_get_contents('php://input')
);

// if jsonp return javascript
if(! empty($jsonp))
    header("Content-type: text/javascript");
else // return JSON encoded data
    header("Content-type: application/json");

// add callback name and brackets if non-empty
if(! empty($jsonp)) print "$jsonp(";


/*** start api action ***/
/**
 * ! BE CAREFUL: The order of the if clauses may be relevant, as some api calls
 *      start with the same parts.
 */

// Auth
if($request[0] == 'login') {
    Auth::login(filter_input(INPUT_POST, 'email'), 
            filter_input(INPUT_POST, 'password'));
    
} elseif ($request[0] == 'checkkey') {
    Auth::checkkey();
    Helper::exitCleanWithCode(204);
    
} elseif ($request[0] == 'logout') {
    Auth::logout();

    
// Options
} elseif($request[0] == 'options' && $requestMethod == 'GET') {
    Options::get($request[1]);
    
} elseif($request[0] == 'options' && $requestMethod == 'PUT') {
    Options::update($request[1]);

    
// Accounts
} elseif($request[0] == 'accounts') {
    if($requestMethod == 'GET') Accounts::get();
    else Helper::exitCleanWithCode (400);
    
} elseif($request[0] == 'account' && $requestMethod == 'POST') {
    Accounts::create();

} elseif($request[0] == 'account' && $requestMethod == 'PUT') {
    Accounts::update($request[1]);
    
} elseif($request[0] == 'activate') {
    if(empty($request[1]) || empty($request[2])) Helper::exitCleanWithCode(400);
    Accounts::activate($request[1], $request[2]);

    /* not possible in this api
} elseif($request[0] == 'register') {
    Accounts::register();*/

    
// Projects
} elseif($request[0] == 'projects') {
    if($requestMethod == 'GET') Projects::get();
    else Helper::exitCleanWithCode (400);

} elseif($request[0] == 'project' && $requestMethod == 'GET') {
    Projects::getOne($request[1]);
    
} elseif($request[0] == 'project' && $requestMethod == 'POST') {
    Projects::create();

} elseif($request[0] == 'project' && $requestMethod == 'PUT') {
    Projects::update($request[1]);

    
// Curation uploads
} elseif($request[0] == 'curation-upload' && $requestMethod == 'GET') {
    Curation::getUploads($request[1]);
    
} elseif($request[0] == 'curation-upload' && $requestMethod == 'POST') {
    Curation::upload($request[1]);

} elseif($request[0] == 'curation-upload' && $requestMethod == 'DELETE') {
    Curation::deleteUpload($request[1]);

    
// Templates
} elseif($request[0] == 'templates') {
    if($requestMethod == 'GET') Templates::get();
    else Helper::exitCleanWithCode (400);

} elseif($request[0] == 'template' && $requestMethod == 'GET') {
    Templates::getOne($request[1]);
    
} elseif($request[0] == 'template' && $requestMethod == 'POST') {
    Templates::create();

} elseif($request[0] == 'template' && $requestMethod == 'PUT') {
    Templates::update($request[1]);

    
// Applications
} elseif($request[0] == 'application' && $requestMethod == 'GET') {
    Applications::get($request[1]);
    
} elseif($request[0] == 'application' && $requestMethod == 'PUT') {
    Applications::update($request[1]);

    
// Budget
} elseif($request[0] == 'budget' && $requestMethod == 'GET') {
    Budget::get($request[1]);
    
} elseif($request[0] == 'budget' && $requestMethod == 'PUT') {
    Budget::update($request[1]);
    
    
// nothing matched - bad request
} else {
    Helper::exitCleanWithCode(400);
}

/*** end api action ***/

// add callback closing brackets if non-empty
if(!empty($jsonp)) print ');';