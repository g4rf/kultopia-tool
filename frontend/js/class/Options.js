/* global API, Helper */

/**
 * Holds functions for the options.
 * @namespace
 */
var Options = {
    /**
     * Gets an option.
     * @param {string} key The key of the option.
     * @param {function} callback The function to call with the value as the first parameter.
     * @returns {jqXHR} The jqXHR from the ajax call.
     */
    get: function(key, callback) {
        return API.call("options/" + key, {
            "200": function(value) {
                callback(value);
            },
            "404": function() {
                callback("");
            }
        });
    },
    
    /**
     * Sets an option.
     * @param {string} key The key of the option.
     * @param {string} value The value of the option.
     * @returns {jqXHR} The jqXHR from the ajax call.
     */
    set: function(key, value) {
        return API.call("options/" + key, {
            "200": function() {
                Helper.hint("Option erfolgreich gespeichert.");
            }
        }, "PUT", {"value": value});
    }    
};