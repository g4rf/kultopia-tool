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
        // load budget from database    
        API.call("budget/" + Projects.current.id, {
            "200": function(data) {
                // parse the structure
                var structure = JSON.parse(data.structure);

                // the form
                var form = $(".project-budget form");
                // the templates
                var templates = $(".template", form);
                
                /*** build the form ***/
                // expenses
                var expenses = $(".expenses", form).empty();
                
                jQuery.each(structure.expenses, function(category, costcenters) { // Kostenstelle eng: cost center
                    var categoryElement = $(".category", templates).clone();
                    $(".category-name", categoryElement).append(category);
                    expenses.append(categoryElement);
                });

                // earnings
            }
        });
    },
    
    /**
     * Saves the budget data to the database.
     */
    save: function() {
        return;
        var form = $(".project-budget form");
        var data = {};
        
        // build data
        // TODO
        
        API.call("budget/" + Projects.current.id, {
            "200": function(data) {
                console.log(data);
                // fill in the data in the form
                Helper.fillFields(data, form);
            }
        }, "PUT", data);
    },
    
    /**
     * Update the sums of the cost-centers and the categories
     */
    updateSums: function() {
        // TODO
    }
};

/** save inputs **/
$(".project-budget form").on("keyup", "textare, input", function() {
    Budget.updateSums();
    Budget.save();    
});