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
                        .append("<span class='label-caption'>" + input.label + "</span>")
                        .append(htmlInput).appendTo(htmlSection);
                });
                htmlSection.appendTo(form);
            });
            // application closed
            if(Projects.current.applicationClosed) {
                $(".project-application .closed").removeClass("hidden");
                $("input, textarea", form).attr("readonly", "readonly");
                // radios and boxes
                $("input[type='radio'],input[type='checkbox']", form)
                        .not(":checked").parent().addClass("hidden");
                $("input[type='radio'],input[type='checkbox']", form)
                        .addClass("hidden");
            } else {
                // trumbowyg
                $("textarea.wysiwyg", form).trumbowyg();
                $(".project-application .closed").addClass("hidden");
            }

            // load the application data from database
            API.call("application/" + Projects.current.id, {
                "200": function(data) {
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
                //console.log(data);
            }
        }, "PUT", form.serialize());
    }
};

/** save inputs **/
$(".project-application form").on("change", "textarea, input", Application.save);