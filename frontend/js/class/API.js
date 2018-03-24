/* global Config, Auth, Helper */

/**
 * Holds basic functions for the API.
 * @namespace
 */
var API = {
    /**
     * Calls the API directly.
     * @param {String} func The API function to call.
     * @param {Object} [callbacks] An object of functions with HTTP status codes
     *      as keys, see "statusCode" at http://api.jquery.com/jQuery.ajax/
     * @param {String} [method=GET] HTTP method, e.g. GET, POST, PUT, DELETE.
     * @param {Object|String|Array} [params] The request parameters, see
     *      "data" at http://api.jquery.com/jQuery.ajax/
     * @param {Object} [credentials] The credentials as object.email and
     *      object.key. If omitted cookie saved values will be used.
     * @param {Object} [ajaxOptions] Options to set/overwrite for the 
     *      jQuery.ajax call, see http://api.jquery.com/jQuery.ajax/
     * @returns {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    call: function(func, callbacks, method, params, credentials, ajaxOptions) {
        if(typeof func !== "string") return;
        method = method || "GET";
        params = params || {};
        callbacks = callbacks || {};
        
        // add credentials
        credentials = credentials || {};
        if(typeof credentials.email === "undefined") 
            credentials.email = Cookies.get("user-email") || "";
        if(typeof credentials.key === "undefined") 
            credentials.key = Cookies.get("user-key") || "";
        
        // add standard error handling
        if(typeof callbacks["400"] === "undefined") {
            callbacks["400"] = function() {
                Helper.hint(_("API: Fehlerhafte Anfrage."));
                console.warn("API bad request: " + func, method, params);
            };
        }
        if(typeof callbacks["401"] === "undefined") {
            callbacks["401"] = function() {
                Helper.hint(_("API: Nicht autorisiert."));
                console.warn("API unauthorized: " + func, method, params);
                Auth.checkKey();
            };
        }
        if(typeof callbacks["403"] === "undefined") {
            callbacks["403"] = function() {
                Helper.hint(_("API: Fehlende Berechtigungen."));
                console.warn("API forbidden: " + func, method, params);
            };
        }
        if(typeof callbacks["404"] === "undefined") {
            callbacks["404"] = function() {
                Helper.hint(_("API: Element nicht gefunden."));
                console.warn("API function not found: " + func, method, params);
            };
        }
        if(typeof callbacks["500"] === "undefined") {
            callbacks["500"] = function() {
                Helper.hint(_("API: Interner Serverfehler."));
                console.warn("API internal server error: " + func, method, params);
            };
        }
        if(typeof callbacks["501"] === "undefined") {
            callbacks["501"] = function() {
                Helper.hint(_("API: Nicht implementiert."));
                console.warn("API not implemented: " + func, method, params);
            };
        }
        if(typeof callbacks["502"] === "undefined") {
            callbacks["502"] = function() {
                Helper.hint(_("API: Bad Gateway."));
                console.warn("API bad gateway: " + func, method, params);
            };
        }
        if(typeof callbacks["503"] === "undefined") {
            callbacks["503"] = function() {
                Helper.hint(_("API nicht erreichbar."));
                console.warn("API service unavailable: " + func, method, params);
            };
        }
        
        // define options
        var options = {
            dataType: "json",
            method: method,
            beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", "Basic " + 
                        btoa(credentials.email + ":" + credentials.key));
            },
            data: params,
            statusCode: callbacks            
        };
        
        // set special ajax options
        ajaxOptions = ajaxOptions || {};
        jQuery.each(ajaxOptions, function(key, value) {
            options[key] = value;
        });

        return jQuery.ajax(Config.apiUrl + func, options);
    }
};