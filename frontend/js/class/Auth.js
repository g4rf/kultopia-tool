/* global API, Helper, Campaigns */

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
                
                Auth.checkKey();
            },
            401: function() { // wrong credentials
                Helper.dialog(_("Anmeldung fehlgeschlagen."), [{
                    name: _("OK"),
                    callback: Auth.logout
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
                // load campaigns as it's the first visible thing
                Campaigns.refreshTable();
                
                $("#auth").addClass("hidden");
                
                $("#menu .user").text(Cookies.get("email"));
                $("#menu").removeClass("hidden");
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

        $("#menu, #content").addClass("hidden");
        $("#auth input").val("");
        $("#auth").removeClass("hidden");
        return API.call("logout", "GET");
    }
};