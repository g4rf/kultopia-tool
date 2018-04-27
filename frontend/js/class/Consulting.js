/* global Projects, API */

/**
 * Holds functions for the consulting section.
 * @namespace
 */
var Consulting = {
    /**
     * Loads the current consulting text from the database.
     */
    load: function() {        
        Projects.get(function(project) {                
            $(".section.project-consulting").empty()
                    .append(project.consultingText);
        });        
    }
};