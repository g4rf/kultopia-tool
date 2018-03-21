/**
 * Holds the configuration from the config.json file.
 * @type Object
 */
var Config = {};

/** 
 * Loads the configuration from the config.json file into the Config object.
 */
jQuery.getJSON("config.json", function(data) {
    Config = data;
}).fail(function() {
    console.error("Unable to load the config.json file.");
});