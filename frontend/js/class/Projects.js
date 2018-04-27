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
                    
                    // add name
                    $(".name", newRow).append(project.name);
                                       
                    // select project
                    newRow.css("cursor", "pointer").click(function() {
                        Projects.current = project;
                        $(".project-name").empty().append(project.name);
                        $(".menu-item[data-section='project-consulting']").click();
                    });
                    
                    // add to table
                    if(Auth.isAdmin() && project.parent) { // has parent
                        newRow.insertAfter($("#" + project.parent.id, table));
                        $("td:first", newRow).css("padding-left", "20px")
                                .prepend("&rdsh;");
                    } else $(table).append(newRow);
                });
            }
        });
    }
};