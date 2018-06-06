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
                        // fill templates
                        API.call("templates", {
                            "200": function(templates) {
                                var applications = $("[name='templateApplication']", dialog);
                                var budgets = $("[name='templateBudget']", dialog);
                                jQuery.each(templates, function(index, template) {
                                    switch(template.type) {
                                        case "application":
                                            $("<option />").attr({"value": template.id})
                                                .append(template.name)
                                                .appendTo(applications);
                                            break;
                                        case "budget":
                                            $("<option />").attr({"value": template.id})
                                                .append(template.name)
                                                .appendTo(budgets);
                                            break;
                                    }
                                    
                                });
                                applications.val(project.templateApplication);
                                budgets.val(project.templateBudget);
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
    },
    
    /**
     * Holds the data to export.
     */
    export: {
        projects: {},
        applications: {},
        budgets: {}
    },
    
    /**
     * Sets the export button in a wait state.
     */
    disableExportButton() {
        var button = $(".administration-export .start-export");
        button.addClass("please-wait");
        button.attr({
            disabled: "disabled",
            title: _("Bitte warten...")
        });
    },
    
    /**
     * Enables the export button.
     */
    enableExportButton() {
        var button = $(".administration-export .start-export");
        button.removeClass("please-wait");
        button.removeAttr("disabled");
        button.removeAttr("title");
    },
    
    /**
     * Loads the data for the export.
     */
    loadExport: function() {
        Administration.disableExportButton();
        
        var section = $(".administration-export");
        
        // projects
        API.call("projects", { "200": function(projects) {
            var applicationTemplates = []; // collect application templates
            
            jQuery.each(projects, function(index, project) {
                // add projects to export
                Administration.export.projects[project.id] = project;                
                
                // collect applications
                API.call("application/" + project.id, { "200": function(application) {
                    Administration.export.applications[project.id] = application;
                }});
                
                // collect budgets
                API.call("budget/" + project.id, { "200": function(budget) {
                    Administration.export.budgets[project.id] = budget;
                }});                        
                
                // collect application templates
                applicationTemplates.push(project.templateApplication);
                
                // add elements to checkboxgroup
                $("<label />").append(
                    $("<input />").attr({
                        type: "checkbox",
                        value: project.id
                })).append(
                    $("<span />").append(project.name)
                ).appendTo($(".projects", section));
            });
            
            // collect application data
            API.call("templates", { "200": function(templates) {
                jQuery.each(templates, function(index, template) {
                    if(template.type != "application") return;
                    if($.inArray(template.id, applicationTemplates) == -1) return;

                    var form = $(".application-data", section);
                    var structure = JSON.parse(template.structure);

                    // build the form
                    $("<div class='bold underline' />")
                            .append(_("Vorlage: ") + template.name)
                            .appendTo(form);
                    jQuery.each(structure, function(index, part) {                    
                        $("<div />").append(part.heading).appendTo(form);
                        jQuery.each(part.inputs, function(index, input) {
                            $("<label />").append(
                                $("<input />").attr({
                                    type: "checkbox",
                                    value: input.attributes.name,
                                    checked: "checked",
                                    "data-readable": input.label
                            })).append(
                                $("<span />").append(input.label)
                            ).appendTo(form);
                        });
                    });
                });
                
                Administration.enableExportButton();
            }});
        }});
    }
};

/* save front-page */
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
            var applications = $("[name='templateApplication']", form);
            var budgets = $("[name='templateBudget']", form);
            jQuery.each(templates, function(index, template) {
                switch(template.type) {
                    case "application":
                        $("<option />").attr({"value": template.id})
                            .append(template.name)
                            .appendTo(applications);
                        break;
                    case "budget":
                        $("<option />").attr({"value": template.id})
                            .append(template.name)
                            .appendTo(budgets);
                        break;
                }                
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
                        Helper.hint(_("Der Name oder eine KFP-Vorlage fehlen."));
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

/* generate PDF */
$(".administration-export .start-export").click(function() {
    var section = $(".administration-export");

    var projectIds = [];
    $(".projects input:checked", section).each(function() {
        projectIds.push($(this).val());
    });
    if(projectIds.length == 0) {
        Helper.hint(_("Bitte wähle mindestens ein Projekt aus."));
        return;
    }

    var applicationData = [];
    var applicationReadable = [];
    $(".application-data input:checked", section).each(function() {
        applicationData.push($(this).val());
        applicationReadable.push($(this).data("readable"));
    });
    
    var report = $("<div />");
    
    var firstpage = true;
    jQuery.each(Administration.export.projects, function(projectId, project) {
        if($.inArray(projectId, projectIds) == -1) return;
                
        // internal project data
        var pagebreak = "pagebreak";
        if(firstpage) {
            pagebreak = "";
            firstpage = false;
        }
        $("<h2 />", { "class": pagebreak }).append(project.name).appendTo(report);
        
        report.append("<h3>Internes</h3>");
        var p = $("<p />");
        p.append(_("<b>Kennung</b> ") + project.name + "<br />");
        if(project.description)
            p.append(_("<b>Beschreibung</b> ") + project.description + "<br class='no-pagebreak' />");
        jQuery.each(project.applicants, function(index, applicant) {
            p.append(_("<b>Antragssteller:in</b> ") + applicant.name);
        });
        p.appendTo(report);
        p = null;
        
        // application
        if($(".applications", section).is(":checked")) {
            report.append("<h3>Konzeption</h3>");
            
            jQuery.each(Administration.export.applications[project.id], function(key, value) {
                var pos = $.inArray(key, applicationData);
                if(pos == -1) return;
                
                p = $("<p />");
                p.append("<b>" + applicationReadable[pos] + "</b><br />" + value);
                p.appendTo(report);
                p = null;
            });
        }
        
        // budget
        if($(".budgets", section).is(":checked")) {
            report.append("<h3 class='pagebreak'>Kosten- und Finanzierungsplan</h3>");
            
            $("<p><b>Projekt:</b> " + project.name + "</p>").appendTo(report);
        
            // expenses
            var expensesSum = 0;
            var expenses = $("<table />");            
            jQuery.each(Administration.export.budgets[project.id].expenses, function(index, category) {
                var categorySum = 0;
                
                var categoryRows = $("<table />");
                
                // cost centers                
                jQuery.each(category.costcenters, function(index, costcenter) { // cost center (eng): Kostenstelle
                    var costcenterSum = 0;                    
                    
                    var costcenterRows = $("<table />");
                    
                    // positions
                    jQuery.each(costcenter.positions, function(index, position) {
                        var value = Helper.toDecimal(position.value);
                        if(! value) return;
                        costcenterSum += value;
                        categorySum += value;
                        expensesSum += value;
                        
                        $("<tr />").append(
                            $("<td />"), $("<td />"),
                            $("<td />").append(position.name),
                            $("<td />").append(position.detail),
                            $("<td class='right' />").append(Helper.toCurrency(value))
                        ).appendTo(costcenterRows);
                    });
                    
                    if(! costcenterSum) return;
                    
                    $("<tr />").append(
                        $("<td />"),
                        $("<td colspan='3' class='underline' />").append(costcenter.name),
                        $("<td class='right' />").append(Helper.toCurrency(costcenterSum)))
                    .prependTo(costcenterRows);
                    
                    categoryRows.append(costcenterRows.contents());
                });
                
                if(! categorySum) return;
                
                $("<tr />").append(
                    $("<td colspan='4' class='bold' />").append(category.name),
                    $("<td class='bold right' />").append(Helper.toCurrency(categorySum)))
                .prependTo(categoryRows);
        
                expenses.append(categoryRows.contents());
            });            

            // earnings
            var earningsSum = 0;
            var earnings = $("<table />");
            jQuery.each(Administration.export.budgets[project.id].earnings, function(index, earning) {
                var value = Helper.toDecimal(earning.value);
                
                if(! value) return;
                
                earningsSum += value;
                
                $("<tr />").append(
                    $("<td />").append(earning.name),
                    $("<td />").append(earning.detail),
                    $("<td />").append(earning.status),
                    $("<td />").append(Helper.toCurrency(value))
                ).appendTo(earnings);
            });
            
            var total = $("<table />");                    
            total.append(
                $("<tr class='bold' />").append(
                    "<td colspan='4'>Gesamtausgaben</td>",
                    "<td class='right'>" + Helper.toCurrency(expensesSum) + "</td>"),
                $("<tr class='bold' />").append(
                    "<td colspan='4'>Gesamteinnahmen</td>",
                    "<td class='right'>" + Helper.toCurrency(earningsSum) + "</td>"),
                $("<tr class='bold' />").append(
                    "<td colspan='4'>Differenz</td>",
                    "<td class='right'>" + Helper.toCurrency(earningsSum - expensesSum) + "</td>")
            );
    
            report.append(total, "<h4>Ausgaben</h4>", expenses, 
                "<h4>Einnahmen</h4>", earnings);            
        }
    });
    
    // generate pdf name
    var name = "projekte";
    if(projectIds.length == 1) {
        name = Administration.export.projects[projectIds[0]].name;
    }
    var now = new Date();
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    name += "-" + now.getFullYear() + month + day;
    
    // print
    var print = window.open('', 'Drucken', 'height=500,width=700');

    print.document.write('<html><head><title>' + name  + '</title>');
    print.document.write('<link rel="stylesheet" href="https://tool.kultopia.org/css/vendor/normalize.css">');
    print.document.write('<link rel="stylesheet" href="https://tool.kultopia.org/css/main.css">');
    print.document.write('</head><body>');
    print.document.write(report.html());
    print.document.write('</body></html>');

    print.document.close(); // necessary for IE >= 10
    print.focus(); // necessary for IE >= 10*/

    print.print();
    print.close();

    return true;
});