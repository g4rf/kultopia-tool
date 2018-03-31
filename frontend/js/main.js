/* global Auth */

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

// start processing
$(window).on("load", function() {
    // try to login with saved key
    Auth.checkKey().always(function() {
        
    });
});