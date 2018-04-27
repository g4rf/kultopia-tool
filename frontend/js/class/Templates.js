/* global API, Helper, Auth, Administration */

/**
 * Holds functions for the templates section.
 * @namespace
 */
var Templates = {
    /**
     * Gets the template with the given id.
     * @param {String} id The id of the template.
     * @param {Function} callback The callback.     
     * @returns {jqXHR} The XHR object of the ajax call.
     */
    get: function(id, callback) {
        return API.call("template/" + id, {
            "200": callback,
            "400": function() {
                callback(false);
            }
        });
    },    
   
    /**
     * Loads templates from the API and puts them into the table.
     * @returns {jqXHR} see http://api.jquery.com/jQuery.ajax/
     */
    refresh: function() {
        return API.call("templates", {
            "200": function(templates) {
                var table = $(".section.administration-templates table");
                
                // empty table
                $("tr", table).not(".head, .template, .no-data").remove();

                // get some?
                templates.length ? $(".no-data", table).hide() : 
                        $(".no-data", table).show();                    
                    
                // add rows
                jQuery.each(templates, function(index, template) {
                    var newRow = $("tr.template", table).clone()
                            .removeClass("template");

                    // add data
                    $(newRow).data("data", template);
                    $(".name", newRow).append(template.name);
                    $(".description", newRow).append(template.description);
                    $(".type", newRow).append(template.type);
                   
                    // edit button
                    $("button.edit", newRow).click(function() {
                        var dialog = Helper.dialog(
                            $(".section.administration-templates form.template.edit")
                                .clone().removeClass("template"),
                            [{
                                "name": _("Abbrechen"),
                                "callback": Helper.closeDialog,
                                "class": "cancel"
                            }, {
                                "name": _("Ändern"),
                                "callback": function() {
                                    var form = $("#dialog form");

                                    API.call("template/" + template.id, {
                                        "200": function() {
                                            Templates.refresh();
                                            Helper.hint(_("Vorlage geändert."));
                                            Helper.closeDialog();
                                        },
                                        "401": function() {
                                            Helper.hint(_("Nur Administratoren dürfen Vorlagen anpassen."));
                                            Helper.closeDialog();
                                        }
                                    }, "PUT", $(form).serialize());
                                }
                            }]
                        );
                        // write values to fields
                        Helper.fillFields(template, dialog);
                    });                    
                    
                    // add to table
                    $(table).append(newRow);
                });
            }
        });
    }
};

/* add template */
$(".section.administration-templates .add").click(function() {
    Helper.dialog(
        $(".section.administration-templates form.template.add").clone()
                .removeClass("template"),
        [{
            "name": _("Abbrechen"),
            "callback": Helper.closeDialog,
            "class": "cancel"
        }, {
            "name": _("Anlegen"),
            "callback": function() {
                var form = $("#dialog form");
                
                API.call("template", {
                    "201": function() {
                        Templates.refresh();
                        Helper.hint(_("Vorlage angelegt."));
                        Helper.closeDialog();
                    },
                    "401": function() {
                        Helper.hint(_("Nur Admins dürfen Vorlagen anlegen."));
                        Helper.closeDialog();
                    }
                }, "POST", $(form).serialize());
            }
        }]
    );
});