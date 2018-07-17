<?php

/**
 * Holds informations about the database.
 */
class DB {
    public static $mongo;
    public static $db;
    public static $username = 'kultopia';
    public static $password = 'V0LnGbQZkBhapq2I9PgA';
    
    /**
     * Initializes the database.
     */
    public static function initialize() {
        self::$mongo = new MongoDB\Client(
            'mongodb://' . self::$username . ':' . self::$password . '@localhost/kultopiatool'
        );
        self::$db = self::$mongo->kultopiatool;
    }
    
     /**
     * Converts a MongoDB\BSON\UTCDateTime to an ISO8601 date for the API.
     * @param MongoDB\BSON\UTCDateTime $mongoDate The MongoDB date.
     * @return string An ISO8601 date. On error it returns the current date.
     */
    public static function mongo2ApiDate($mongoDate = null) {
        try {
            if($mongoDate == null) return (new DateTime())->format('c');
            return $mongoDate->toDateTime()->format('c');
        } catch (Exception $ex) {
            return (new DateTime())->format('c');
        }
    }
    
    /**
     * Converts an ISO8601 date to a MongoDB\BSON\UTCDateTime.
     * @param string $iso An ISO8601 date.
     * @return \MongoDB\BSON\UTCDateTime A MongoDB date.
     */
    public static function api2MongoDate($iso = 'now') {
        try {
            return new MongoDB\BSON\UTCDateTime(new DateTime($iso));
        } catch (Exception $e) {
            Helper::exitCleanWithCode(400, $e->getMessage());
        }
    }
}