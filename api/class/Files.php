<?php

/**
 * Functions for downloading something.
 */
class Files {    
    const CURATION_INFO = 'curation-info';
    const PROJECT_DOCUMENT = 'project-document';
    
    /**
     * Downloads a file.
     * @param String $fileName The file name.
     */
    public static function download($fileName) {
        // get file
        $file = DB::$db->files->findOne([
            'fileName' => $fileName
        ]);
        if(! $file) {
            http_response_code(404);
            exit;
        }
        
        $path = '../' . Config::$_['uploadDirectory'] . "/" . $file->fileName;

        ob_clean(); // clear output buffer
        
        http_response_code(200); // response code
        
        header('Content-Description: File Transfer');
        header('Content-Type: ' . $file->fileType);
        header('Content-Disposition: attachment; filename="' . $file->name . '"');
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');
        header('Content-Length: ' . filesize($path));
        
        readfile($path);
        
        exit;
    }
   
    /**
     * Takes uploaded files and saves them on disk and in the database.
     * @param String $type The type of the file, see constants.
     * @param String $projectId The project id.
     * @param Array $files A file array like $_FILES.
     * @param Array [$descriptions] Descriptions for each file.
     */
    public static function upload($type, $projectId, $files, $descriptions) {
        // descriptions
        if(!is_array($descriptions)) $descriptions = [];
        
        // go through files
        foreach ($files['file']['error'] as $index => $error) {
            if ($error == UPLOAD_ERR_OK) {
                $tmpName = $files['file']['tmp_name'][$index];
                $name = basename($files['file']['name'][$index]);
                $fileName = "{$projectId}_{$type}_" . Helper::createKey() .
                        "_{$name}";
                $path = '../' . Config::$_['uploadDirectory'] . "/" . $fileName;
                
                if(move_uploaded_file($tmpName, $path)) {
                    DB::$db->files->insertOne([
                        'fileName' => $fileName,
                        'fileType' => $files['file']['type'][$index],
                        'fileSize' => $files['file']['size'][$index],
                        'name' => $name,
                        'description' => empty($descriptions[$index]) ? '' 
                                                        : $descriptions[$index],
                        'projectId' => $projectId,
                        'type' => $type
                    ]);
                }
            }
        }
    }
    
    /**
     * Deletes a given file.
     * @param String $fileName
     */
    public static function delete($fileName) {
        // get file
        $file = DB::$db->files->findOne([
            'fileName' => $fileName
        ]);
        
        if(! $file) return false; // file not found
        
        // delete upload in database
        DB::$db->files->deleteOne([
            'fileName' => $file->fileName
        ]);
        
        // delete file in file system
        $path = '../' . Config::$_['uploadDirectory'] . "/" . $fileName;
        unlink($path);
        
        return true;
    }
}