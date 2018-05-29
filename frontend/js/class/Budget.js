/* global Projects, Templates, API, Helper */

/**
 * Holds functions for the budget section.
 * @namespace
 */
var Budget = {
    /**
     * Loads the current budget form and the data from the database.
     */
    load: function() {
        // load template from database
        Templates.get(Projects.current.templateBudget, function(template) {
            // parse the structure
            var structure = JSON.parse(template.structure);
            
            // clear the form
            var form = $(".project-budget form").empty();
            
            /*** build the form ***/
            // expenses
            jQuery.each(structure.expenses, function(category, centers) { // Kostenstelle eng: cost center
                
            });
            // earnings
            
            // load the budget data from database
            API.call("budget/" + Projects.current.id, {
                "200": function(data) {
                    console.log(data);
                    // fill in the data in the form
                    Helper.fillFields(data, form);
                }
            });
        });
    },
    
    /**
     * Saves the budget data to the database.
     */
    save: function() {
        var form = $(".project-budget form");
        API.call("budget/" + Projects.current.id, {
            "200": function(data) {
                console.log(data);
                // fill in the data in the form
                Helper.fillFields(data, form);
            }
        }, "PUT", form.serialize());
    }
};

/** save inputs **/
$(".project-budget form").on("change", "textare, input", Budget.save);

/** update sums **/
// TODO