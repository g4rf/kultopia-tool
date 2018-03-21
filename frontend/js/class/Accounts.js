/* global API, Helper */

/**
 * Holds functions for the accounts section.
 * @namespace
 */
var Accounts = {
    /**
     * Loads accounts from the API and puts it into the table.
     * @returns {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    refreshTable: function() {
        return API.call("accounts", {
            "200": function(accounts) {
                var table = $(".section.accounts table");
                
                // empty table
                $("tr", table).not(".head, .template, .no-data").remove();

                // get some campaigns?
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
                    if(account.groups) {
                        $(".groups", newRow).append(account.groups.join(", "));
                    }
                    if(! account.active) {
                        $(".disable", newRow).empty().append(
                            "<i class='fa fa-check'></i> " + _("Aktivieren"));
                        $(newRow).addClass("inactive");
                    }                    

                    // send message button
                    $("button.send-message", newRow).data("partner", {
                        "name": account.name + " (" + account.email + ")",
                        "address": "@" + account.id
                    });
                    
                    // edit button
                    $("button.edit", newRow).click(function() {
                        var dialog = Helper.dialog(
                            $(".section.accounts form.template.edit").clone()
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
                                    }, "PUT", $(form).serialize())
                                        .always(function() { 
                                            Accounts.refreshTable();
                                        });
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
                                Helper.hint(_("Der eigene Account kann nicht verändert werden."));
                                Helper.closeDialog();
                            }
                        }, "PUT", {
                            "active": !account.active
                        }).always(function() { 
                            Accounts.refreshTable();
                        });
                    });
                    
                    // add to table
                    $(table).append(newRow);
                });
            }
        });
    }
};

/* add account */
$(".section.accounts .add").click(function() {
    Helper.dialog(
        $(".section.accounts form.template.add").clone().removeClass("template"),
        [{
            "name": _("Abbrechen"),
            "callback": Helper.closeDialog
        }, {
            "name": _("Anlegen"),
            "callback": function() {
                var form = $("#dialog form");
                
                API.call("account", {
                    "201": function() {
                        Helper.hint(_("Account angelegt und E-Mail versandt."));
                        Helper.closeDialog();
                    },
                    "409": function() {
                        Helper.hint(_("E-Mail-Adresse existiert bereits."));
                        $("input[name='email']", form).focus();
                    }
                }, "POST", $(form).serialize())
                    .always(function() { 
                        Accounts.refreshTable();
                    });
            }
        }]
    );
});