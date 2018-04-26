/* global Auth, Options */

// this is for correct timezone support
Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});
Date.prototype.toTimeInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(11,16);
});
Date.prototype.toChatDateTime = (function() {
    var local = new Date(this);
    var weekday = [_("Sonntag"), _("Montag"), _("Dienstag"), _("Mittwoch"), 
        _("Donnerstag"), _("Freitag"), _("Samstag")];
    //local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    var day = weekday[local.getDay()];
    var today = new Date();
    if(today.getDate() == local.getDate() 
            && today.getMonth() == local.getMonth()
            && today.getFullYear() == local.getFullYear()) {
        day = _("heute");
    }
    return day + ", " + local.toTimeString().substr(0,5);
});

// set ajax calls to non cached
$.ajaxSetup({
    cache: false
});

// set all date inputs to today
$("[type='date']").val(new Date().toDateInputValue());
// set all time inputs to 00:00
$("[type='time']").val("00:00");

// initialize trumbowyg wysiwyg editor
$.trumbowyg.svgPath = "/pic/icons.svg";
var trumbowygOptions = {
    btns: [
        ['viewHTML'],
        ['historyUndo', 'historyRedo'],
        ['formatting'],
        ['strong', 'em', 'del'],
        ['foreColor', 'backColor'],
        //['superscript', 'subscript'],
        ['link'],
        ['base64'],
        ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
        ['unorderedList', 'orderedList'],
        ['horizontalRule'],
        //['removeformat'],
        ['fullscreen']
    ],
    lang: 'de',
    removeformatPasted: true,
    urlProtocol: true
};
$('textarea.wysiwyg').trumbowyg(trumbowygOptions);

// start processing
$(window).on("load", function() {
    Options.get("frontpage", function(value) {
        $(".section.frontpage").empty().append(value);
    });
    
    // try to login with saved key
    Auth.checkKey().always(function() {
        
    });
});