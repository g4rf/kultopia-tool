/* global Auth, Campaigns, Accounts, Helper, API, Players, Materials, Map, Challenges, Trophies, Chat */

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
$("#menu .menu-item").click(function() {
    // close dialog
    Helper.closeDialog();
    
    // mark menu item
    $("#menu .menu-item").removeClass("selected");
    $(this).addClass("selected");
    
    // open section
    var section = $(this).data("section");
    $("#content .section").addClass("hidden");
    $("#content ." + section).removeClass("hidden");
    
    // do more stuff depending on section
    switch (section) {
        case "campaigns":
            Campaigns.refreshTable();
            break;
        case "accounts":
            Accounts.refreshTable();
            break;
        case "players":
            Players.loadCampaigns();
            break;
        case "materials":
            Materials.loadCampaigns();
            break;
        case "challenges":
            Challenges.loadCampaigns();
            break;
        case "trophies":
            Trophies.loadCampaigns();
            break;
        case "map":
            Map.initialize();
            break;
    }
});