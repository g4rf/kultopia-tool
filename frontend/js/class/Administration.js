/* global API, Helper, Auth, Options, trumbowygOptions */

/**
 * Holds functions for the administration.
 * @namespace
 */
var Administration = {
    /**
     * Loads the frontpage text.
     */
    loadFrontpage: function() {
        Options.get("frontpage", function(text) {
            $(".section.administration-frontpage textarea").trumbowyg("html", text);
        });
    },
    
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
                    $("button.edit", _new).click(function() {
                        var dialog = Helper.dialog(
                            $(".section.administration-projects form.template.edit")
                                .clone().removeClass("template"),
                            [{
                                "name": _("Abbrechen"),
                                "callback": Helper.closeDialog,
                                "class": "cancel"
                            }, {
                                "name": _("Ändern"),
                                "callback": function() {
                                    var form = $("#dialog form");

                                    API.call("project/" + project.id, {
                                        "200": function() {
                                            Administration.refreshProjects();
                                            Helper.hint(_("Projekt geändert."));
                                            Helper.closeDialog();
                                        },
                                        "400": function() {
                                            Helper.hint(_("Der Projektname darf nicht leer sein."));
                                        },
                                        "401": function() {
                                            Helper.hint(_("Nur Administratoren dürfen Projekte anpassen."));
                                            Helper.closeDialog();
                                        }
                                    }, "PUT", $(form).serialize());
                                }
                            }]
                        );
                        // load trumbowyg
                        $('textarea.wysiwyg-dialog', dialog).trumbowyg(trumbowygOptions);
                        // write values to fields
                        Helper.fillFields(project, dialog);                        
                        // fill application template
                        API.call("templates", {
                            "200": function(templates) {
                                var select = $("[name='templateApplication']", dialog);
                                jQuery.each(templates, function(index, template) {
                                    if(template.type != "application") return;
                                    $("<option />").attr({"value": template.id})
                                            .append(template.name)
                                            .appendTo(select);
                                });
                                select.val(project.templateApplication);
                            }
                        });
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
                                    ).appendTo($(".applicants", dialog));
                                    jQuery.each(project.applicants, function(index, applicant) {
                                        $("input[name='applicants[]'][value='" + applicant.email + "']", dialog).prop("checked", true);
                                    });
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
                                    ).appendTo($(".curators", dialog));
                                    jQuery.each(project.curators, function(index, curator) {
                                        $("input[name='curators[]'][value='" + curator.email + "']", dialog).prop("checked", true);
                                    });
                                });
                            }
                        });
                        // fill parent
                        API.call("projects", {
                            "200": function(parents) {
                                jQuery.each(parents, function(index, parent) {
                                    // no child projects
                                    if(parent.parent != null) return;
                                    // add option
                                    var option = $("<option />").attr({
                                        "value": parent.id
                                    }).append(parent.name)
                                    .appendTo($("[name='parent']", dialog));
                                    // select current parent
                                    if(project.parent &&
                                            parent.id == project.parent.id) {
                                        option.prop("selected", true);
                                    }
                                });
                            }
                        });
                    });
                    
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
                            $("#" + project.parent.id + " .subprojects:first", table));
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
                            $(".section.administration-accounts form.template.edit")
                                .clone().removeClass("template"),
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

$(".section.administration-frontpage .save").click(function() {
    Options.set("frontpage", 
        $(".section.administration-frontpage textarea").trumbowyg("html"));
});
        
/* add project */
$(".section.administration-projects .add").click(function() {
    var form = $(".section.administration-projects form.template.add").clone()
            .removeClass("template");
    
    // load trumbowyg
    $('textarea.wysiwyg-dialog', form).trumbowyg(trumbowygOptions);
    
    // fill application template
    API.call("templates", {
        "200": function(templates) {
            var select = $("[name='templateApplication']", form);
            jQuery.each(templates, function(index, template) {
                if(template.type != "application") return;
                $("<option />").attr({"value": template.id})
                        .append(template.name)
                        .appendTo(select);
            });
        }
    });
                        
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
                // no child projects
                if(project.parent != null) return;
                // add option
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