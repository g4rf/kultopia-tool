/* global Auth, Helper, Administration, Application, Projects, Consulting */

/* click, load and other events */

/* ajax events */
$(document).ajaxStart(function() {
    $("#ajax").fadeIn('fast');
}).ajaxStop(function() {
    $("#ajax").fadeOut('fast');
});

/* prevent form submission (as we are a one pager) */
$(document).on("submit", "form", function(e) { 
    e.preventDefault();
    return false;
});

/* expandable elements */
$(document).on("click", ".expandable .expand-button", function(event) {
    var button = $(this);
    var expandable = button.parent(".expandable");
    
    if(expandable.hasClass("expanded")) {
        // collapse
        //expandable.animate({"height": 0});
        expandable.removeClass("expanded");
    } else {
        // expand
        // expandable.animate({"height": "auto"});
        expandable.addClass("expanded");
    }
    event.stopPropagation();
});

/* auth buttons */
$("#auth input").keydown(function(e) {
    if(e.keyCode == 13) {
        $("#auth button").click();
    }
});
$("#auth button").click(function() {
    var email = $("#auth [name='email']").val();
    var password = $("#auth [name='password']").val();
    var saveCredentials = $("#auth [name='save-credentials']").prop("checked");
    
    if(saveCredentials) {
        // save credentials
        Cookies.set("auth-save-credentials", saveCredentials, { expires: 5 });
        Cookies.set("auth-email", email, { expires: 5 });
        Cookies.set("auth-password", password, { expires: 5 });
    } else {
        // delete credentials
        Cookies.remove("auth-save-credentials", { expires: 5 });
        Cookies.remove("auth-email", { expires: 5 });
        Cookies.remove("auth-password", { expires: 5 });
    }
    
    Auth.login(email, password);
});
$("#logout").click(function() {
    Auth.logout().always(function() {
        window.location.reload();
    });
});

/* menu items */
$(".menu-item").click(function() {
    // close dialog
    Helper.closeDialog();
    
    // open section
    var section = $(this).data("section");
    $("#content .section").addClass("hidden");
    $("#content ." + section).removeClass("hidden");
    
    // mark menu item
    $(".menu-item").removeClass("selected");
    $(".menu-item[data-section='" + section + "']").addClass("selected");
    
    // do more stuff depending on section
    switch (section) {
        case "projects":
            $("#menu").addClass("hidden");
            $("#administration-menu").addClass("hidden");
            Projects.refresh();
            break;
        case "project-consulting":
            $("#menu").removeClass("hidden");
            $("#administration-menu").addClass("hidden");
            //Consulting.load();            
            break;
        case "project-application":
            $("#menu").removeClass("hidden");
            $("#administration-menu").addClass("hidden");
            Application.load();            
            break;
        case "administration-projects":
            $("#menu").addClass("hidden");
            $("#administration-menu").removeClass("hidden");
            $("#menu-administration").addClass("selected");
            /*$("#administration-menu [data-section='administration-projects']")
                    .addClass("selected");*/
            Administration.refreshProjects();
            break;
        case "administration-accounts":
            $("#menu-administration").addClass("selected");
            Administration.refreshAccounts();
            break;
    }
});