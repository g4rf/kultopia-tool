/* global Projects, Templates, API, Helper, Auth, Config */

/**
 * Holds functions for the budget section.
 * @namespace
 */
var Budget = {
    keyTimer: null,
    
    /**
     * Loads the current budget form and the data from the database.
     */
    load: function() {
        // update export-to-csv link
        if(Auth.isCurator()) {
            $(".project-budget .export-to-excel").attr("href", 
                Config.apiUrl + "budget/export/" + Projects.current.id)
                        .removeClass("hidden");
        } else {
            $(".project-budget .export-to-excel").attr("href", "")
                .addClass("hidden");
        }
        
        // load budget from database    
        API.call("budget/" + Projects.current.id, {
            "200": function(budget) {
                // the form
                var form = $(".project-budget form");
                // the templates
                var templates = $(".project-budget .template");
                
                /*** build the form ***/
                // expenses
                var expenses = $(".expenses", form).empty();                
                jQuery.each(budget.expenses, function(index, category) {
                    var categoryElement = $(".category", templates).clone();
                    $(".category-name", categoryElement).append(category.name);
                    expenses.append(categoryElement);
                    
                    // cost centers
                    jQuery.each(category.costcenters, function(index, costcenter) { // cost center (eng): Kostenstelle
                        var costcenterElement = $(".cost-center", templates).clone();
                        $("[name='cost-center-name']", costcenterElement).val(costcenter.name);
                        costcenterElement.insertBefore($(".add-cost-center", categoryElement));
                        
                        // positions
                        jQuery.each(costcenter.positions, function(index, position) {
                            var positionElement = $(".position", templates).clone();
                            $("[name='position-name']", positionElement).val(position.name);
                            $("[name='position-detail']", positionElement).val(position.detail);
                            $("[name='position-value']", positionElement).val(position.value);
                            positionElement.insertBefore($(".add-position", costcenterElement));
                        });
                    });
                });

                // earnings
                var earnings = $(".earnings", form);
                $(".earning", earnings).remove();
                jQuery.each(budget.earnings, function(index, earning) {
                    var earningElement = $(".earning", templates).clone();
                    $("[name='earning-name']", earningElement).val(earning.name);
                    $("[name='earning-detail']", earningElement).val(earning.detail);
                    $("[name='earning-status']", earningElement).val(earning.status);
                    $("[name='earning-value']", earningElement).val(earning.value);
                    earningElement.insertBefore($(".add-earning", earnings));
                });
                
                // update sums
                Budget.updateSums();
                
                // budget closed?)
                if(Projects.current.budgetClosed) {
                    if(! Auth.isCurator()) {
                        $("input", form).attr("readonly", "readonly");
                        $("a, button", form).addClass("hidden");
                    }
                    $(".project-budget .closed").removeClass("hidden");
                } else {                    
                    $("a, button", form).removeClass("hidden");
                    $(".project-budget .closed").addClass("hidden");
                }
            }
        });
    },
    
    /**
     * Saves the budget data to the database.
     */
    save: function() {
        var form = $(".project-budget form");
        var data = {};
        
        /** build data **/
        // expenses
        data.expenses = [];
        $(".category", form).each(function(index, categoryElement) {
            var category = {};
            category.name = $(".category-name", categoryElement).text();
            category.costcenters = [];
            
            // cost centers
            $(".cost-center", categoryElement).each(function(index, costcenterElement) {
                var costcenter = {};
                costcenter.name = $("[name='cost-center-name']", costcenterElement).val();
                costcenter.positions = [];
                
                // positions
                $(".position", costcenterElement).each(function(index, positionElement) {
                    var position = {};
                    position.name = $("[name='position-name']", positionElement).val();
                    position.detail = $("[name='position-detail']", positionElement).val();
                    position.value = $("[name='position-value']", positionElement).val();
                    costcenter.positions.push(position);
                });
                
                category.costcenters.push(costcenter);
            });
            
            data.expenses.push(category);
        });
        
        // earnings
        data.earnings = [];
        $(".earning", form).each(function(index, earningElement) {
            var earning = {};
            earning.name = $("[name='earning-name']", earningElement).val();
            earning.detail = $("[name='earning-detail']", earningElement).val();
            earning.status = $("[name='earning-status']", earningElement).val();
            earning.value = $("[name='earning-value']", earningElement).val();
            data.earnings.push(earning);
        });
        
        API.call("budget/" + Projects.current.id, {
            "200": function(data) {
                //console.log(data);
            }
        }, "PUT", data);
    },
    
    /**
     * Updates the sums of the cost-centers and categories and formats the numbers.
     */
    updateSums: function() {
        var form = $(".project-budget form");
        var total = $(".project-budget .total");
        var expensesSum = 0;
        var earningsSum = 0;
        
        // expenses
        $(".category", form).each(function(index, category) {
            var categorySum = 0;
            $(".cost-center", category).each(function(index, costcenter) {
                var costcenterSum = 0;
                $(".position", costcenter).each(function(index, position) {
                    var value = Helper.toDecimal(
                            $("[name='position-value']", position).val());
                    costcenterSum += value;
                    categorySum += value;
                    expensesSum += value;
                });
                $(".cost-center-value", this).empty()
                        .append(Helper.toCurrency(costcenterSum));
            });
            $(".category-value", category).empty()
                    .append(Helper.toCurrency(categorySum));
        });
        
        // earnings
        $(".earning", form).each(function(index, earning) {
            var value = Helper.toDecimal(
                    $("[name='earning-value']", earning).val());
            earningsSum += value;
        });
        
        // total
        $(".expenses .value", total).empty().append(Helper.toCurrency(expensesSum));
        $(".earnings .value", total).empty().append(Helper.toCurrency(earningsSum));
        $(".balance .value", total).empty().append(
                Helper.toCurrency(earningsSum - expensesSum));
    },
    
    /**
     * Returns the expenses and earnings for the given project to a callback.
     * @param {Function} callback The callback, with parameters func(expenses, earnings).
     * @param {String} projectId The id of the project. Defaults to Projects.current.id.
     * @returns The expenses and earning to the callback func(expenses, earnings).
     */
    getSums: function(callback, projectId) {
        var id;
        if(typeof projectId != "undefined") id = projectId;
        else if(Projects.current) id = Projects.current.id;
        else {
            callback(0, 0);
            return;
        }
            
        var expensesSum = 0;
        var earningsSum = 0;
        
        API.call("budget/" + id, {
            "200": function(budget) {
                // expenses
                jQuery.each(budget.expenses, function(index, category) {
                    // cost centers
                    jQuery.each(category.costcenters, function(index, costcenter) {
                        // positions
                        jQuery.each(costcenter.positions, function(index, position) {
                            expensesSum += Helper.toDecimal(position.value);
                        });
                    });
                });

                // earnings
                jQuery.each(budget.earnings, function(index, earning) {
                    earningsSum += Helper.toDecimal(earning.value);
                });

                callback(expensesSum, earningsSum);                
            }
        });
    }
};

/** save inputs, calculate sums **/
$(".project-budget form").on("keyup", "textare, input", function() {
    window.clearTimeout(Budget.keyTimer);
    Budget.keyTimer = window.setTimeout(function() {
        Budget.save();
        Budget.updateSums();        
    }, 1000);
});

/** add  **/
$(".project-budget form").on("click", ".add-cost-center", function() {
    var element = $(".cost-center", $(".project-budget .template")).clone()
            .insertBefore(this);
    $("[name='cost-center-name']", element).focus();
});
$(".project-budget form").on("click", ".add-position", function() {
    var element = $(".position", $(".project-budget .template")).clone()
            .insertBefore(this);
    $("[name='position-name']", element).focus();
});
$(".project-budget form").on("click", ".add-earning", function() {
    var element = $(".earning", $(".project-budget .template")).clone()
            .insertBefore(this);
    $("[name='earning-name']", element).focus();
});

/** delete **/
$(".project-budget form").on("click", ".del-cost-center", function() {
    var element = $(this).parent();
    var name = $("[name='cost-center-name']", element).val();
    Helper.dialog("Soll die Kostenstelle <u>" + name + "</u> entfernt werden?", [{
        name: _("Abbrechen"),
        class: "cancel",
        callback: function() {
            Helper.closeDialog();
        }
    },{
        name: _("Kostenstelle entfernen"),
        callback: function() {
            element.remove();
            Budget.save();
            Budget.updateSums();
            Helper.closeDialog();
        }
    }]);    
});
$(".project-budget form").on("click", ".del-position", function() {
    var element = $(this).parent();
    var name = $("[name='position-name']", element).val();
    Helper.dialog("Soll die Position <u>" + name + "</u> entfernt werden?", [{
        name: _("Abbrechen"),
        class: "cancel",
        callback: function() {
            Helper.closeDialog();
        }
    },{
        name: _("Position entfernen"),
        callback: function() {
            element.remove();
            Budget.save();
            Budget.updateSums();
            Helper.closeDialog();
        }
    }]);    
});
$(".project-budget form").on("click", ".del-earning", function() {
    var element = $(this).parent();
    var name = $("[name='earning-name']", element).val();
    Helper.dialog("Soll die Einnahme <u>" + name + "</u> entfernt werden?", [{
        name: _("Abbrechen"),
        class: "cancel",
        callback: function() {
            Helper.closeDialog();
        }
    },{
        name: _("Einnahme entfernen"),
        callback: function() {
            element.remove();
            Budget.save();
            Budget.updateSums();
            Helper.closeDialog();
        }
    }]);    
});