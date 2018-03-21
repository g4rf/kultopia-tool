<?php
class Config {
    const CONFIGFILE = 'config.json';
    public static $_; 
    
    public static function initialize() {
        self::$_ = json_decode(file_get_contents(self::CONFIGFILE), true);
    }
}