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
                Cookies.set("email", email);
                Cookies.set("key", user.key);
                if(user.isadmin) Cookies.set("isadmin", true);
                else Cookies.remove("isadmin");
                
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
                
                $("#user-info .email").text(Cookies.get("email"));
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
        Cookies.remove("email");
        Cookies.remove("key");
        Cookies.remove("isadmin");

        $("#user-info, #menu, #content").addClass("hidden");
        $("#auth [name='password']").val("");
        $("#auth").removeClass("hidden");
        return API.call("logout", "GET");
    },
    
    /**
     * Checks if the user is admin, only for gui handling.
     * ! Be careful: It's only a cookie setting, so the user may fake this. 
     * Nevertheless it needs a real admin account to deal with the api.
     * @return {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    isAdmin: function() {
        if(Cookies.get("isadmin")) return true;
        return false;
    }
};