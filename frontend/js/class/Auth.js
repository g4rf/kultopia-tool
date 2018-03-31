/* global API, Helper */

/**
 * Holds infos and functions for the authentification with the API.
 * @namespace
 */
var Auth = {    
    /**
     * Tries to get a key from the API.
     * @param {String} email A user email.
     * @param {String} password A password.
     * @returns {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    login: function(email, password) {
        return API.call("login", {
            200: function(user) { // logged in
                Cookies.set("user-email", email);
                Cookies.set("user-key", user.key);
                Cookies.set("user-name", user.name);
                Cookies.set("user-id", user.id);
                if(user.isadmin) Cookies.set("user-isadmin", true);
                else Cookies.remove("user-isadmin");
                
                Auth.checkKey();
            },
            401: function() { // wrong credentials
                Helper.dialog(_("Anmeldung fehlgeschlagen."), [{
                    name: _("OK"),
                    callback: function() {
                        $("#auth [name='password']").focus();
                        Helper.closeDialog();
                        Auth.logout();                    
                    }
                }]);
            }
        }, "POST", {
            "email": email,
            "password": password
        });
    },
    
    /**
     * Checks if a cookie saved user email and key is still valid.
     * @returns {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    checkKey: function() {
        return API.call("checkkey", {
            204: function() {                
                $("#auth").addClass("hidden");
                
                $("#user-info .email").text(Cookies.get("user-email"));
                $("#user-info .name").text(Cookies.get("user-name"));
                $("#user-info").removeClass("hidden");
                
                $("#menu-projects").removeClass("hidden");
                if(Auth.isAdmin()) 
                    $("#menu-administration").removeClass("hidden");
                else $("#menu-administration").addClass("hidden");
                
                $("#content").removeClass("hidden");
            },
            401: function() { // outdated key
                Auth.logout();
            }
        });
    },
    
    /**
     * Logs out the user by deleting the cookies and refreshing the page.
     * @return {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    logout: function() {
        Cookies.remove("user-email");
        Cookies.remove("user-name");
        Cookies.remove("user-id");
        Cookies.remove("user-key");
        Cookies.remove("user-isadmin");

        $("#user-info, #menu, #content").addClass("hidden");
        $("#auth [name='password']").val("");
        
        // fill auth form if cookie is set
        if(Cookies.get("auth-save-credentials")) {
            $("#auth [name='save-credentials']").prop("checked", true);
            $("#auth [name='email']").val(Cookies.get("auth-email"));
            $("#auth [name='password']").val(Cookies.get("auth-password"));
        }

        $("#auth").removeClass("hidden");
        
        return API.call("logout", "GET");
    },
    
    /**
     * Gets the logged in user name from the cookies.
     * @return {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    getName: function() {
        return Cookies.get("user-name");
    },
    
    /**
     * Gets the logged in user name from the cookies.
     * @return {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    getEmail: function() {
        return Cookies.get("user-email");
    },
    
    /**
     * Gets the logged in user name from the cookies.
     * @return {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    getId: function() {
        return Cookies.get("user-id");
    },
    
    /**
     * Checks if the user is admin, only for gui handling.
     * ! Be careful: It's only a cookie setting, so the user may fake this. 
     * Nevertheless it needs a real admin account to deal with the api.
     * @return {Boolean} true if admin, false otherwise
     */
    isAdmin: function() {
        if(Cookies.get("user-isadmin")) return true;
        return false;
    }
};