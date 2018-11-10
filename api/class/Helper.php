<?php
/**
 * Some helper functions.
 */
class Helper {
    /**
     * Clean the output and exit program with HTTP status code.
     * @param integer $code HTTP status code
     * @param string $msg optional message for the HTTP body
     */
    public static function exitCleanWithCode($code = 500, $msg = '') {        
        ob_clean();
        http_response_code($code);
        header('Content-type: application/json');
        header('Access-Control-Allow-Origin: *');
        if($msg) print json_encode($msg);
        exit;
    }
    
    /**
     * Creates a random key.
     * @param integer [$length] The length of the key. Maximum is 40 characters.
     * @return string A random key of length $length.
     */
    public static function createKey($length = 15) {
        return substr(sha1(mt_rand()), 0, $length);
    }
    
    /**
     * Creates a unique id.
     * @return string A unique id.
     */
    public static function createId() {
        return self::createKey(5) . str_replace([' ', '.'], '', microtime());
    }
    
    /**
     * Sends an e-mail.
     * @param string $to The receiver.
     * @param string $subject The suject.
     * @param string $body The message.
     * @param string &$error An error string as reference.
     * @return boolean true if no error occured, otherwise false
     */
    public static function mail($to, $subject, $body, &$error = '') {
        $replyTo = Config::$_['smtpFrom'];
        $from = Config::$_['smtpUser']; // could be recognized as spam: Config::$_['smtpFrom'];
        $host = Config::$_['smtpServer'];
        $port = Config::$_['smtpPort'];
        $username = Config::$_['smtpUser'];
        $password = Config::$_['smtpPassword'];

        $headers = array(
            'From' => $from, 
            'To' => $to, 
            'Subject' => $subject,
            'Reply-To' => $replyTo,
            'charset' => 'UTF-8');
        $smtp = Mail::factory('smtp',
            array ('host' => $host, 'port' => $port, 'auth' => true,
                'username' => $username, 'password' => $password)
        );
        $mail = $smtp->send($to, $headers, $body);

        if (PEAR::isError($mail)) {
            $error = $mail->getMessage();
            return false;
        } else {
            return true;
        }
    }
    
    /**
     * Generates a random password.
     * @return string The password.
     */
    public static function password() {
        $length = mt_rand(8, 12);
        $lowercase = "qwertyuiopasdfghjkzxcvbnm";
        $uppercase = "ASDFGHJKLZXCVBNMQWERTYUP";
        $numbers = "23456789";
        //$specialcharacters = "!§$/?+-#_";
        $randomCode = "";
        mt_srand(crc32(microtime()));
        for ($x = 0; $x < abs($length/3); $x++) {
            $randomCode .= $lowercase{mt_rand(0, strlen($lowercase) - 1)};
        }
        for ($x = 0; $x < abs($length/3); $x++) {
            $randomCode .= $uppercase{mt_rand(0, strlen($uppercase) - 1)};
        }
        /*for ($x = 0; $x < abs($length/3); $x++) {
            $randomCode .= $specialcharacters{mt_rand(0, strlen($specialcharacters) - 1)};
        }*/
        for ($x = 0; $x < abs($length/3); $x++) {
            $randomCode .= $numbers{mt_rand(0, strlen($numbers) - 1)};
        }
        return str_shuffle($randomCode);
    }

    /**
     * Moves an uploaded file to the upload directory and gives back the full URL.
     * @param string $name The index-name in the $_FILES array.
     * @return string The full URL if upload is successful, an empty string
     *      otherwise.
     */
    /* -- DEPRECATED file handling should do another service
    public static function uploadFile($name) {
        $file = basename($_FILES[$name]['name']);
        
        // check if file exists
        while(file_exists(Config::$_['uploadDir'] . $file)) {
            $file = Helper::createKey(5) . '_' . basename($_FILES[$name]['name']);
        }
        
        if(move_uploaded_file($_FILES[$name]['tmp_name'], 
                Config::$_['uploadDir'] . $file)) {

            return Config::$_['uploadUrl'] . $file;
            
        } return '';
    }*/
    
    
    /**
     * Logs the API access in a file.
     * @param A message to log.
     */
    public static function logApiAccess($message) {
        $file = '../' . Config::$_['logApiAccess'];
        $log = (new DateTime())->format('r') 
                . ' ' . Auth::getEmail()
                . ' ' . preg_replace('/password=[^&$]*/i', 'password=*****',
                                $message)
                . "\n";
        
        file_put_contents($file, $log, FILE_APPEND);
    }
    
    /**
     * Converts a german number to a float.
     * @param string $string The number.
     * @return float The float value.
     */
    public static function convertDe2Decimal($string) {
        return floatval(str_replace(',', '.', str_replace('.', '', $string)));
    }
}