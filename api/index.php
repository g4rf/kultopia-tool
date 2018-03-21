<?php

/** Configuration **/
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

    
// Accounts
} elseif($request[0] == 'accounts') {
    Auth::checkkey();
    
    if($requestMethod == 'GET') Accounts::get();
    else Helper::exitCleanWithCode (400);
    
} elseif($request[0] == 'account' && $requestMethod == 'POST') {
    Auth::checkkey();
    Accounts::create();
} elseif($request[0] == 'account' && $requestMethod == 'PUT') {
    Auth::checkkey();
    Accounts::update($request[1]);
} elseif($request[0] == 'activate') {
    if(empty($request[1]) || empty($request[2])) Helper::exitCleanWithCode(400);
    Accounts::activate($request[1], $request[2]);
} elseif($request[0] == 'register') {
    Accounts::register();

    
// nothing matched - bad request
} else {
    Helper::exitCleanWithCode(400);
}

/*** end api action ***/

// add callback closing brackets if non-empty
if(!empty($jsonp)) print ');';