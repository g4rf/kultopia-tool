/* global Auth, Helper, Administration */

/* click, load and other events */

/* ajax events */
/*$(document).ajaxStart(function() {
    $("#ajax").fadeIn('fast');
}).ajaxStop(function() {
    $("#ajax").fadeOut('fast');
});*/

/* prevent form submission (as we are a one pager) */

$(document).on("submit", "form", function(e) { 
    e.preventDefault();
    return false;
});

/* auth buttons */
$("#auth input").keydown(function(e) {
    if(e.keyCode == 13) {
        $("#auth button").click();
    }
});
$("#auth button").click(function() {
    Auth.login(
        $("#auth [name='email']").val(),
        $("#auth [name='password']").val()
    );
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
    
    // mark menu item
    $(".menu-item").removeClass("selected");
    $(this).addClass("selected");
    
    // open section
    var section = $(this).data("section");
    $("#content .section").addClass("hidden");
    $("#content ." + section).removeClass("hidden");
    
    // do more stuff depending on section
    switch (section) {
        case "administration":
            Administration.refreshAccounts();
            break;
    }
});