/* global API, Projects, Helper */

/**
 * Holds functions for the curation section.
 * @namespace
 */
var Curation = {
    /**
     * Loads the settings section.
     */
    loadSettings: function() {
        var section = $(".project-curation-settings");
        
        // status
        if(typeof Projects.current.status != "undefined") {
            $("[name='status']", section).val(Projects.current.status);
        } else $("[name='status']", section).prop("selectedIndex", 0);
    },
    
    /**
     * Loads the upload section.
     */
    loadUpload: function() {
        var section = $(".project-curation-upload");
        var uploads = $(".uploads", section);
        var uploader = $(".uploader", section);
        
        // get uploads
        $(".file", uploads).not(".template").remove();
        API.call("curation/files/" + Projects.current.id, {
            "200": function(files) {
                if(files.length == 0) {
                    $(".no-data", uploads).removeClass("hidden");
                    return;
                }
                
                $(".no-data", uploads).addClass("hidden");
                jQuery.each(files, function(index, file) {
                    var newFile = $(".file.template", uploads).clone()
                            .removeClass("template").appendTo(uploads)
                            .data("info", file);
                    $(".name", newFile).append(file.name);
                    $(".description", newFile).append(file.description);
                    $(".download", newFile).attr("href", 
                                    Helper.createDownloadLink(file.fileName));
                });
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


/*===== Settings =====*/

$(".project-curation-settings form").on("change", "select,input,textarea", function() {
    API.call("curation/settings/" + Projects.current.id, {
        "200": function(project) {
            Projects.current = project;
        }
    }, "PUT", $(".project-curation-settings form").serialize());
});


/*===== Uploads =====*/

/** delete file **/
$(".project-curation-upload .uploads").on("click", "button.delete", function() {
    var info = $(this).parent().data("info");
    API.call("curation/file/" + info.fileName, {
        "200": function() {
            Curation.loadUpload();
            Helper.hint(_("Datei gelöscht."));
        },
        "404": function() {
            Curation.loadUpload();
            Helper.hint(_("Datei nicht (mehr) gefunden."));
        }
    }, "DELETE");
});

/** add more file fields **/
$(".project-curation-upload .uploader").on("change", ".input-file", function() {
    var uploader = $(".project-curation-upload .uploader");
    var self = $(this);
    var description = $(".input-description", self.parent());
        
    if(self[0].files.length > 0) {
        // set focus to description
        description.focus();
        
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
    var button = $(this);
    var uploader = $(".project-curation-upload .uploader");
    var info = $(".project-curation-upload .upload-info");
    var data = new FormData();
    
    button.hide();
    info.empty().append(_("Starte Upload..."));
    
    $(".file", uploader).not(".template").each(function(index, field) {
        var inputFile = $(".input-file", field);
        
        if(inputFile[0].files.length == 0) return; // if no file, go to next
        data.append("file[]", inputFile[0].files[0]);
        data.append("description[]", $(".input-description", field).val());
    });
    
    info.empty().append(_("Lade Dateien hoch. Bitte warten..."));
    
    API.call("curation/files/" + Projects.current.id, {
        "200": function() {
            info.empty();
            button.show();
            Curation.loadUpload();
            Helper.hint(_("Dateien hochgeladen."));
        }
    }, "POST", data, null, {
        processData: false,  // tell jQuery not to process the data
        contentType: false  // tell jQuery not to set contentType
    });
});
