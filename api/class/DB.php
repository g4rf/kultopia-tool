<?php

/**
 * Holds informations about the database.
 */
class DB {
    public static $mongo;
    public static $db;
    
    /**
     * Initializes the database.
     */
    public static function initialize() {
        self::$mongo = new MongoDB\Client();
        self::$db = self::$mongo->kultopiatool;
    }
}