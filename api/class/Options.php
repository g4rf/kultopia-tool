<?php

/**
 * Functions for options.
 */
class Options {
    /**
     * @api {get} /option/:key Gets an option. Be careful, everyone can read options.
     * @apiGroup Options
     * @apiSuccess (200) {String} value A string.
     * @apiError (404) NotFound Options does not exists (yet).
     */
    public static function get($key) {
        $option = DB::$db->options->findOne(['key' => $key]);
        
        if(!$option) Helper::exitCleanWithCode(404);
        
        print json_encode($option->value);
    }
   
    /**
     * @api {put} /option/:key Sets an option.
     * @apiGroup Options
     * @apiParam {String} value The new value.
     * @apiSuccess (200) {String} value The new value.
     * @apiError (401) Unauthorized Only admins can update options.
     */
    public static function update($key) {
        if(! Auth::isAdmin()) Helper::exitCleanWithCode (401);
        
        // get data
        parse_str(file_get_contents('php://input'), $data);
        
        // param 'value' is missing
        if(! isset($data['value'])) Helper::exitCleanWithCode(400);
        
        // update
        DB::$db->options->updateOne(['key' => $key],[
            '$set' => ['value' => $data['value']]
        ], [
            'upsert' => true
        ]);
        
        // get
        $option = DB::$db->options->findOne(['key' => $key]);
                
        print json_encode($option->value);
    }
}