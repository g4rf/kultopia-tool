/* global API, Helper, Auth, Administration */

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
     * Gets the project with the given id.
     * @param {Function} callback The callback.
     * @param {String} [id] The id of the project. Defaults to Projects.current.id.
     * @returns {jqXHR} The XHR object of the ajax call.
     */
    get: function(callback, id) {
        if(typeof id === "undefined") id = Projects.current.id;
        
        return API.call("project/" + id, {
            "200": callback,
            "400": function() {
                callback(false);
            }
        });
    },
    
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

                    // add data and id
                    $(newRow).data("data", project).attr({
                        "id": project.id
                    });
                    
                    // add infos
                    $(".name", newRow).append(project.name);
                    
                    $(".status", newRow).append(project.status);
                    $(newRow).addClass(project.status);
                    
                    // applicants
                    jQuery.each(project.applicants, function(index, applicant) {
                        var name = applicant.name;
                        if(! name) name = applicant.email;
                        else name += " (" + applicant.email + ")";
                        $(".applicants", newRow).append(name).append("<br />");
                    });
                    // curators
                    jQuery.each(project.curators, function(index, curator) {
                        var name = curator.name;
                        if(! name) name = curator.email;
                        else name += " (" + curator.email + ")";
                        $(".curation", newRow).append(name).append("<br />");
                    });
                                       
                    // select project
                    newRow.css("cursor", "pointer").click(function() {
                        Projects.current = project;
                        $(".project-name").empty().append(project.name);
                        
                        // show curator menu
                        if(project.isCurator === true || Auth.isAdmin()) {
                            $("#menu .curation").removeClass("hidden");
                        } else {
                            $("#menu .curation").addClass("hidden");
                        }
                        
                        $(".menu-item[data-section='project-consulting']").click();
                    });
                    
                    // add to table
                    if(Auth.isAdmin() && project.parent) { // has parent
                        newRow.insertAfter($("#" + project.parent.id, table));
                        $("td:first", newRow).css("padding-left", "20px"); //.prepend("&rdsh;");
                    } else $(table).append(newRow);
                });
            }
        });
    }
};