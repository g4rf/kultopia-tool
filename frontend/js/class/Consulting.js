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
            var section = $(".section.project-consulting");
            var uploads = $(".uploads", section);
            
            $(".heading", section).empty().append(project.name);
            $(".content", section).empty().append(project.consultingText);
            
            // get uploads
            $(".link-uploads, .uploads", section).addClass("hidden");
            $(".file", uploads).not(".template").remove();
            API.call("curation-upload/" + Projects.current.id, {
                "200": function(files) {
                    if(files.length == 0) return;
                    
                    $(".link-uploads, .uploads", section).removeClass("hidden");

                    jQuery.each(files, function(index, file) {
                        var description = "";
                        if(file.description) description = " (" + file.description + ")";
                        $(".file.template", uploads).clone()
                                .removeClass("template")
                                .append(file.name + description)
                                .attr("href", file.file)
                                .appendTo(uploads);
                    });
                }
            });
        });        
    }
};