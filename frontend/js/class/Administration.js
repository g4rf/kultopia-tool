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
                var table = $(".subsection.projects table");
                
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
                    $(".name", newRow).append(project.name);
                    $(".description", newRow).append(project.description);
                    // applicants
                    jQuery.each(projects.applicants, function(index, applicant) {
                        $("<div>&#149; </div>").append(applicant.name)
                            .append("(" + applicant.email + ")")
                            .appendTo(".applicants", newRow);
                    });
                    // curators
                    jQuery.each(projects.curators, function(index, curator) {
                        $("<div>&#149; </div>").append(curator.name)
                            .append("(" + curator.email + ")")
                            .appendTo(".curators", newRow);
                    });
                    // active
                    if(! project.active) {
                        $(".disable", newRow).empty().append(_("Aktivieren"));
                        $(newRow).addClass("inactive");
                    }
                   
                    // edit button
                    /*$("button.edit", newRow).click(function() {
                        var dialog = Helper.dialog(
                            $(".subsection.accounts form.template.edit").clone()
                                .removeClass("template"),
                            [{
                                "name": _("Abbrechen"),
                                "callback": Helper.closeDialog
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
                    $("button.disable", newRow).click(function() {
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
                    $(table).append(newRow);
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
                var table = $(".subsection.accounts table");
                
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
                                "callback": Helper.closeDialog
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
    API.call("accounts", {
        "200": function(accounts) {
            jQuery.each(accounts, function(index, account) {
                console.log(index, account);
                // applicants
                $("<label />").append(
                    $("<input />").attr({
                        type: "checkbox",
                        name: "applicants[]",
                        value: account.email
                    })
                ).append(account.name + " (" + account.email + ")")
                .appendTo($(".applicants", form));
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
            
            // fill parent

            // open dialog
            Helper.dialog(
                form,
                [{
                    "name": _("Abbrechen"),
                    "callback": Helper.closeDialog
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
        }
    });
});

/* add account */
$(".subsection.accounts .add").click(function() {
    Helper.dialog(
        $(".subsection.accounts form.template.add").clone().removeClass("template"),
        [{
            "name": _("Abbrechen"),
            "callback": Helper.closeDialog
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