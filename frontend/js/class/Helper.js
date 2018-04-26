/**
 * Holds some general functions.
 * @namespace
 */
var Helper = {    
    /**
     * Shows a dialog with some buttons.
     * @param {String|DOM|jQuery} main Something to paste in the main pane.
     * @param {Array} [buttons] If none is given, a close button is added. 
     *      An array of objects with two properties:
     *          name: the name of the button, text or html
     *          callback: the function that is executed on click event
     * @returns {jQuery} A reference to the dialog.
     */
    dialog: function(main, buttons) {
        // show dialog background
        $("#dialog-background").show();
        
        // if no button is given, add a close button
        buttons = buttons || [{
            name: _("Schließen"),
            callback: function() {
                Helper.closeDialog();
            }
        }];
        // add buttons to button pane
        $("#dialog .buttonpane").empty();
        jQuery.each(buttons, function(index, button) {
            $("<button />").attr({
                "class": button.class})
                .append(button.name)
                .prependTo("#dialog .buttonpane")
                .click(button.callback);
        });
        
        // fill main pane
        $("#dialog .mainpane").empty().append(main);
        
        return $("#dialog").show(0, function() {
            // center dialog
            $("#dialog").center();
            
            // focus on first input element, if any
            $('#dialog :input:visible:enabled:first').focus();
        });
    },
    
    /*
     * Closes the dialog.
     * @returns {jQuery} A reference to the dialog.
     */
    closeDialog: function() {
        // hide dialog background
        $("#dialog-background").fadeOut();
        
        return $("#dialog").fadeOut();
    },
    
    /**
     * Shows a little hint and fades it out after some time.
     * @param {String} msg The message.
     * @param {Number} [delay=3000] The milliseconds the hint is shown.
     * @returns {jQuery} A reference to the hint.
     */
    hint: function(msg, delay) {
        delay = delay || 3000;
        return $("#hint").text(msg).finish().show().delay(delay).fadeOut();        
    },
    
    /**
     * Fills out form fields with the keys and values of an object.
     * @param {Object} object A plain object that holds the data.
     * @param {jQuery|DOMElement} form The HTML object that holds the fields.
     */
    fillFields(object, form) {
        jQuery.each(object, function(key, value) {
            if(jQuery.isArray(value) || jQuery.isPlainObject(value)) {
                // array or object
                $("input[name='" + key + "[]']", form).prop("checked", false);
                jQuery.each(value, function(index, val) {
                    $("input[name='" + key + "[]'][value='" + val + "']", 
                        form).prop("checked", true);
                });
            } else {
                // string
                var field = $("[name='" + key + "']", form);

                if(field.is("input") && field.prop("type") != "file") {
                    field.val(value);
                } else if(field.hasClass("trumbowyg-textarea")) {
                    field.trumbowyg('html', value);
                } else if(field.is("textarea")) {
                    field.empty().append(value);
                } else if(field.is("select")) {
                    field.val(value);
                }
            }
        });
    },
    
    /**
     * Generates a hashcode from a string.
     * @param {String} str The string.
     * @returns {Number} A decimal hashcode.
     */
    hashCode: function(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
           hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    },

    /**
     * Converts a decimal number to a color.
     * @param {Integer} i The number.
     * @returns {String} A html hex color.
     */
    intToRGB: function(i){
        var c = (i & 0x00FFFFFF).toString(16).toUpperCase();
        return "00000".substring(0, 6 - c.length) + c;
    },
    
    /**
     * Converts a string to a hex color.
     * @param {String} str The string.
     * @param {Float) [a=1] The alpha.
     * @returns {String} A css rgba color.
     */
    stringToColor: function(str, a) {
        if(typeof a == "undefined") a = 1;
        
        var hex = Helper.intToRGB(Helper.hashCode(str));
        var r = hex.substr(0, 2), g = hex.substr(2, 2), b = hex.substr(4, 2);
        
        return "rgba(" + parseInt(r, 16) + "," + parseInt(g, 16) + "," +
                parseInt(b, 16) + "," + a + ")";
    }
};