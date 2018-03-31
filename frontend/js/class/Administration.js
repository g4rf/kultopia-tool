/* global API, Helper, Auth */

/**
 * Holds functions for the accounts section.
 * @namespace
 */
var Administration = {
    /**
     * Loads projects from the API and puts them into the table.
     * @returns {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    refreshProjects: function() {
        return API.call("projects", {
            "200": function(projects) {
                var table = $(".section.administration-projects .table");
                
                // save expanded projects
                var expandedIds = [];
                $(".expanded", table).each(function(index, expanded) {
                    expandedIds.push($(expanded).attr("id"));
                });
                
                // empty table
                $(".entry", table).not(".template").remove();

                // get some?
                projects.length ? $(".no-data", table).hide() : 
                        $(".no-data", table).show();                    
                    
                // add rows
                jQuery.each(projects, function(index, project) {
                    var _new = $(".template", table).clone()
                            .removeClass("template");

                    // expand if it was expanded before
                    if(expandedIds.indexOf(project.id) > -1)
                        _new.addClass("expanded");
                    
                    // add data
                    $(_new).attr({
                        "id": project.id
                    }).data("data", project);
                    $(".name", _new).append(project.name);
                    $(".description", _new).append(project.description);
                    // applicants
                    jQuery.each(project.applicants, function(index, applicant) {
                        $("<div>&#149; </div>").append(applicant.name)
                            .append(" (" + applicant.email + ")")
                            .appendTo($(".applicants", _new));
                    });
                    // curators
                    jQuery.each(project.curators, function(index, curator) {
                        $("<div>&#149; </div>").append(curator.name)
                            .append(" (" + curator.email + ")")
                            .appendTo($(".curators", _new));
                    });
                    // active
                    if(! project.active) {
                        $(".disable", _new).empty().append(_("Aktivieren"));
                        $(_new).addClass("inactive");
                    }
                   
                    // edit button
                    /*$("button.edit", newRow).click(function() {
                        var dialog = Helper.dialog(
                            $(".subsection.accounts form.template.edit").clone()
                                .removeClass("template"),
                            [{
                                "name": _("Abbrechen"),
                                "callback": Helper.closeDialog,
                                "class": "cancel"
                            }, {
                                "name": _("Ändern"),
                                "callback": function() {
                                    var form = $("#dialog form");

                                    API.call("account/" + account.email, {
                                        "200": function() {
                                            Administration.refreshAccounts();
                                            Helper.hint(_("Account geändert."));
                                            Helper.closeDialog();
                                        },
                                        "401": function() {
                                            Helper.hint(_("Nur Administratoren dürfen Accounts anpassen."));
                                            Helper.closeDialog();
                                        },
                                        "403": function() {
                                            Helper.hint(_("Der eigene Account kann nicht verändert werden."));
                                            Helper.closeDialog();
                                        }
                                    }, "PUT", $(form).serialize());
                                }
                            }]
                        );
                        // write values to fields
                        Helper.fillFields(account, dialog);
                    });*/
                    
                    // disable button
                    $("button.disable", _new).click(function() {
                        API.call("project/" + project.id, {
                            "200": function(changedProject) {
                                Administration.refreshProjects();
                                Helper.hint(
                                    changedProject.active ? _("Projekt aktiviert.")
                                        : _("Projekt stillgelegt."));
                                Helper.closeDialog();
                            },
                            "401": function() {
                                Helper.hint(_("Nur Administratoren dürfen Projekte anpassen."));
                                Helper.closeDialog();
                            }
                        }, "PUT", {
                            "active": !project.active
                        });
                    });
                    
                    // add to table
                    if(! project.parent) { // main project
                        $(_new).appendTo(table);
                    } else { // sub project
                        $(_new).appendTo(
                            $("#" + project.parent.id + " .subprojects:first"));
                    }
                });
            }
        });
    },
    
    /**
     * Loads accounts from the API and puts it into the table.
     * @returns {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    refreshAccounts: function() {
        return API.call("accounts", {
            "200": function(accounts) {
                var table = $(".section.administration-accounts table");
                
                // empty table
                $("tr", table).not(".head, .template, .no-data").remove();

                // get some?
                accounts.length ? $(".no-data", table).hide() : 
                        $(".no-data", table).show();                    
                    
                // add rows
                jQuery.each(accounts, function(index, account) {
                    var newRow = $("tr.template", table).clone()
                            .removeClass("template");

                    // add data
                    $(newRow).data("data", account);
                    $(".email", newRow).append(account.email);
                    $(".name", newRow).append(account.name);
                    if(! account.confirmed) {
                        $(".email", newRow).append(" (" + _("unbestätigt") + ")");
                        $(newRow).addClass("unconfirmed");
                    }
                    if(account.isadmin) {
                        $(".isadmin", newRow).append("&#9989;");
                    }
                    if(Auth.getEmail() == account.email) {
                        $(".disable", newRow).addClass("hidden");
                    } else {
                        if(! account.active) {
                            $(".disable", newRow).empty().append(_("Aktivieren"));
                            $(newRow).addClass("inactive");
                        }
                    }
                   
                    // edit button
                    $("button.edit", newRow).click(function() {
                        var dialog = Helper.dialog(
                            $(".subsection.accounts form.template.edit").clone()
                                .removeClass("template"),
                            [{
                                "name": _("Abbrechen"),
                                "callback": Helper.closeDialog,
                                "class": "cancel"
                            }, {
                                "name": _("Ändern"),
                                "callback": function() {
                                    var form = $("#dialog form");

                                    API.call("account/" + account.email, {
                                        "200": function() {
                                            Administration.refreshAccounts();
                                            Helper.hint(_("Account geändert."));
                                            Helper.closeDialog();
                                        },
                                        "401": function() {
                                            Helper.hint(_("Nur Administratoren dürfen Accounts anpassen."));
                                            Helper.closeDialog();
                                        },
                                        "403": function() {
                                            Helper.hint(_("Der eigene Account kann nicht verändert werden."));
                                            Helper.closeDialog();
                                        }
                                    }, "PUT", $(form).serialize());
                                }
                            }]
                        );
                        // write values to fields
                        Helper.fillFields(account, dialog);
                    });
                    
                    // disable button
                    $("button.disable", newRow).click(function() {
                        API.call("account/" + account.email, {
                            "200": function(changedAccount) {
                                Administration.refreshAccounts();
                                Helper.hint(
                                    changedAccount.active ? _("Account aktiviert.")
                                        : _("Account abgeschaltet."));
                                Helper.closeDialog();
                            },
                            "401": function() {
                                Helper.hint(_("Nur Administratoren dürfen Accounts anpassen."));
                                Helper.closeDialog();
                            },
                            "403": function() {
                                Helper.hint(_("Der eigene Account kann nicht deaktiviert werden."));
                                Helper.closeDialog();
                            }
                        }, "PUT", {
                            "active": !account.active
                        });
                    });
                    
                    // add to table
                    $(table).append(newRow);
                });
            }
        });
    }
};

/* add project */
$(".subsection.projects .add").click(function() {
    var form = $(".subsection.projects form.template.add").clone()
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
                ).append(account.name + " (" + account.email + ")")
                .appendTo($(".curators", form));
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
$(".subsection.accounts .add").click(function() {
    Helper.dialog(
        $(".subsection.accounts form.template.add").clone().removeClass("template"),
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