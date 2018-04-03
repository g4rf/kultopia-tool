/* global API, Helper, Auth */

/**
 * Holds functions for the projects section.
 * @namespace
 */
var Projects = {
    /**
     * Holds the last selected project.
     */
    current: null,
    
    /**
     * Loads projects from the API and puts them into the table.
     * @returns {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    refresh: function() {
        return API.call("projects", {
            "200": function(projects) {
                var table = $(".section.projects table");
                
                // empty table
                $("tr", table).not(".head, .template, .no-data").remove();

                // get some?
                projects.length ? $(".no-data", table).hide() : 
                        $(".no-data", table).show();                    
                    
                // add rows
                jQuery.each(projects, function(index, project) {
                    var newRow = $("tr.template", table).clone()
                            .removeClass("template");

                    // add data
                    $(newRow).data("data", project);
                    
                   
                    // select project
                    newRow.click(function() {
                        Projects.current = project;
                        $(".project-name").empty().append(project.name);
                    });
                    
                    // name and click
                    $(".name", newRow).append(project.name).click(function() {
                        $(".menu-item[data-section='project-consulting']").click();
                    }).css("cursor", "pointer");
                    // application button
                    $("button.application", newRow).click(function() {
                        $(".menu-item[data-section='project-application']").click();
                    });
                    
                    // add to table
                    $(table).append(newRow);
                });
            }
        });
    }
};

/* add project */
$(".section.administration-projects .add").click(function() {
    var form = $(".section.administration-projects form.template.add").clone()
            .removeClass("template");
    
    // fill applicants & curators
    API.call("accounts", {
        "200": function(accounts) {
            jQuery.each(accounts, function(index, account) {
                // applicants
                $("<label />").append(
                    $("<input />").attr({
                        type: "checkbox",
                        name: "applicants[]",
                        value: account.email
                })).append(
                    $("<span />").append(
                        account.name + " (" + account.email + ")")
                ).appendTo($(".applicants", form));
                // curators
                $("<label />").append(
                    $("<input />").attr({
                        type: "checkbox",
                        name: "curators[]",
                        value: account.email
                    })
                ).append(
                    $("<span />").append(
                        account.name + " (" + account.email + ")")
                ).appendTo($(".curators", form));
            });
        }
    });

    // fill parent
    API.call("projects", {
        "200": function(projects) {
            jQuery.each(projects, function(index, project) {
                $("<option />").attr({
                    "value": project.id
                }).append(project.name)
                    .appendTo($("[name='parent']", form));
            });
        }
    });

    // open dialog
    Helper.dialog(
        form,
        [{
            "name": _("Abbrechen"),
            "callback": Helper.closeDialog,
            "class": "cancel"
        }, {
            "name": _("Anlegen"),
            "callback": function() {
                var form = $("#dialog form");

                API.call("project", {
                    "201": function() {
                        Administration.refreshProjects();
                        Helper.hint(_("Projekt angelegt."));
                        Helper.closeDialog();
                    },
                    "400": function() {
                        Helper.hint(_("Der Name fehlt."));
                        $("input[name='name']", form).focus();
                    }
                }, "POST", $(form).serialize());
            }
        }]
    );
});

/* add account */
$(".section.administration-accounts .add").click(function() {
    Helper.dialog(
        $(".section.administration-accounts form.template.add").clone()
                .removeClass("template"),
        [{
            "name": _("Abbrechen"),
            "callback": Helper.closeDialog,
            "class": "cancel"
        }, {
            "name": _("Anlegen"),
            "callback": function() {
                var form = $("#dialog form");
                
                API.call("account", {
                    "201": function() {
                        Administration.refreshAccounts();
                        Helper.hint(_("Account angelegt und E-Mail versandt."));
                        Helper.closeDialog();
                    },
                    "409": function() {
                        Helper.hint(_("E-Mail-Adresse existiert bereits."));
                        $("input[name='email']", form).focus();
                    }
                }, "POST", $(form).serialize());
            }
        }]
    );
});