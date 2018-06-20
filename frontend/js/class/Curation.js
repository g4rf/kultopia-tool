/* global API, Projects */

/**
 * Holds functions for the curation section.
 * @namespace
 */
var Curation = {
    /**
     * Loads the upload section.
     */
    loadUpload: function() {
        var section = $(".project-curation-upload");
        var uploader = $(".uploader", section);
        
        // get uploads
        API.call("curation-upload/" + Projects.current.id, {
            "200": function(uploads) {
                console.log(uploads);
            }
        });
        
        // prepare uploader
        $(".file", uploader).not(".template").remove();
        var newFile = $(".file.template", uploader).clone().removeClass("template")
                .appendTo(uploader);
        $(".input-file", newFile).attr("name", "file[0]");
        $(".input-description", newFile).attr("name", "description[0]");
    }
};

/** add more file fields **/
$(".project-curation-upload .uploader").on("change", ".input-file", function() {
    var uploader = $(".project-curation-upload .uploader");
    var self = $(this);
    var description = $(".input-description", self.parent());
        
    if(self[0].files.length > 0) {
        // set description to filename
        description.val(self[0].files[0].name);
        
        // add new field
        var length = $(".file", uploader).not(".template").length;
        var newFile = $(".file.template", uploader).clone().removeClass("template")
                .appendTo(uploader);        
        $(".input-file", newFile).attr("name", "file[" + length + "]");
        $(".input-description", newFile).attr("name", "description[" + length + "]");
    }
});

/** upload button **/
$(".project-curation-upload button.upload").click(function() {
    var uploader = $(".project-curation-upload .uploader");
    var info = $(".upload-info", uploader);
    var data = new FormData();
    
    info.empty().append(_("Starte Upload..."));
    
    $(".file", uploader).not(".template").each(function(index, field) {
        var inputFile = $(".input-file", field);
        
        if(inputFile[0].files.length == 0) return; // if no file, go to next
        data.append("file[]", inputFile[0].files[0]);
        data.append("description[]", $(".input-description", field).val());
    });
    
    info.empty().append(_("Lade Dateien hoch..."));
    
    API.call("curation-upload/" + Projects.current.id, {
        "200": function(data) {
            info.empty();
            console.log(data);
        }
    }, "POST", data, null, {
        processData: false,  // tell jQuery not to process the data
        contentType: false  // tell jQuery not to set contentType
    });
});
