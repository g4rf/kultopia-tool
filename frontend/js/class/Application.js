/* global Projects, Templates, API, Helper */

/**
 * Holds functions for the application section.
 * @namespace
 */
var Application = {    
    /**
     * Loads the current application form and the data from the database.
     */
    load: function() {
        // load template from database
        Templates.get(Projects.current.templateApplication, function(template) {
            // parse the structure
            var structure = JSON.parse(template.structure);
            
            // clear the form
            var form = $(".project-application form").empty();
            
            // build the form            
            jQuery.each(structure, function(index, section) {
                var htmlSection = $("<fieldset />");
                $("<legend />").append(section.heading).appendTo(htmlSection);
                jQuery.each(section.inputs, function(index, input) {
                    var htmlInput = $("<" + input.tag + " />")
                            .attr(input.attributes);                    
                    $("<label />")
                        .append("<div class='label-caption'>" + input.label + "</div>")
                        .append(htmlInput).appendTo(htmlSection);
                });
                htmlSection.appendTo(form);
            });
            // trumbowyg
            $("textarea.wysiwyg", form).trumbowyg();

            // load the application data from database
            API.call("application/" + Projects.current.id, {
                "200": function(data) {
                    console.log(data);
                    // fill in the data in the form
                    Helper.fillFields(data, form);
                }
            });
        });
    },
    
    /**
     * Saves the application data to the database.
     */
    save: function() {
        var form = $(".project-application form");
        API.call("application/" + Projects.current.id, {
            "200": function(data) {
                console.log(data);
                // fill in the data in the form
                Helper.fillFields(data, form);
            }
        }, "PUT", form.serialize());
    }
};

/** save inputs **/
$(".project-application form").on("change", "textare, input", Application.save);