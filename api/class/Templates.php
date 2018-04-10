<?php

/**
 * Functions for templates.
 */
class Templates {
    /**
     * @api {get} /templates Gets all templates.
     * @apiGroup Templates
     * @apiSuccess (200) {Array} templates An array of templates.
     * @apiError (401) Unauthorized Only registered users can get templates.
     */
    public static function get() {        
        $result = DB::$db->templates->find([],[
            'sort' => ['type' => 1, 'name' => 1]
        ]);
        
        $templates = [];
        foreach($result as $template) {
            $templates[] = [
                'id' => $template->id,
                'name' => $template->name,
                'description' => $template->description,
                'type' => $template->type,
                'structure' => $template->structure
            ];
        }
        
        print json_encode($templates);
    }
   
    /**
     * @api {put} /template/:id Modify the template with the given id.
     * @apiGroup Templates
     * @apiParam {String} id The id.
     * @apiParam {String} [name] The name.
     * @apiParam {String} [description] The description.
     * @apiParam {String} [type] The type.
     * @apiParam {String} [structure] The structure.
     * @apiSuccess (200) {Object} template The modified template.
     * @apiError (401) Unauthorized Only admins can update templates.
     * @apiError (404) NotFound Template with this id not found.
     */
    public static function update($id) {
        if(! Auth::isAdmin()) Helper::exitCleanWithCode (401);
        
        // check if template exists
        if(! DB::$db->templates->findOne(['id' => $id]))
            Helper::exitCleanWithCode (404);
        
        // get data
        parse_str(file_get_contents('php://input'), $data); // get data
        
        // allowed fields
        $allowed = ['name', 'description', 'structure', 'type'];
        
        // change fields
        foreach($data as $key => $value) {
            if(! in_array($key, $allowed)) continue;
            
            if($value == 'false') $value = false;
            if($value == 'true') $value = true;
            
            DB::$db->templates->updateOne(['id' => $id],[
                '$set' => [$key => $value]
            ]);
        }
        
        print json_encode(DB::$db->templates->findOne([
            'id' => $id
        ],[
            'projection' => ['_id' => 0 ]
        ]));
    }
    
    /**
     * @api {post} /template Creates a new template.
     * @apiGroup Templates
     * @apiParam {String} [name] The name.
     * @apiParam {String} [description] The description.
     * @apiParam {String} [type] The applicants.
     * @apiParam {String} [structure] The curators.
     * @apiSuccess (201) template Template created.
     * @apiError (401) Unauthorized Only admins are allowed to create templates.
     */
    public static function create() {
        if(! Auth::isAdmin()) Helper::exitCleanWithCode (401);
        
        // check if name is set
        $name = filter_input(INPUT_POST, 'name');
        if(! $name) $name = '';
        
        // check if description is set
        $description = filter_input(INPUT_POST, 'description');
        if(! $description) $description = '';
        
        // check if type is set
        $type = filter_input(INPUT_POST, 'type');
        if(! $type) $type = '';
        
        // check if structure is set
        $structure = filter_input(INPUT_POST, 'structure');
        if(! $structure) $structure = '';
        
        // create template
        $id = Helper::createId();
        DB::$db->templates->insertOne([
            'id' => $id,
            'name' => $name,
            'description' => $description,
            'type' => $type,
            'structure' => $structure
        ]);
        
        http_response_code(201);
        print json_encode(DB::$db->templates->findOne([
            'id' => $id
        ],[
            'projection' => ['_id' => 0]
        ]));
    }
}