function loadTableBerufeSchüler() {
    ["berufe", "schüler"].forEach(function(item) {
        new Table(item, function(type, self) {

            // Get paths from json
            var paths = settings.paths["path" + type];

            // Load first path
            if (paths.length) self.load(excel.xlsxToArray(paths[0], type), type);

            // Add paths to select
            addOptions(paths);

            // Import excel sheets
            $("#" + type + "ContentImport").click(function() {
                var path = excel.load();

                if (path != null) {

                    // Add paths to json
                    settings.paths["path" + type] = settings.paths["path" + type].concat(path);

                    // Load and add to select element - select newest and load excel sheet
                    var pathNames = addOptions(path);
                    $("#" + type + "ContentDay").val(pathNames[pathNames.length - 1]).change();
                    self.load(excel.xlsxToArray(path[path.length - 1], type), type);
                }
            });

            // Chnage event for excel sheets
            $("#" + type + "ContentDay").change(function(event) {

                // Load current excel sheet
                self.load(excel.xlsxToArray($(event.currentTarget.selectedOptions[0]).attr("path"), type), type);
            });

            // Remove current path and table
            $("#" + type + "ContentRemove").click(function() {

                // Get paths and remove current
                settings.paths["path" + type + ""].splice(settings.paths["path" + type + ""].indexOf($($("#" + type + "ContentDay")[0].selectedOptions[0]).attr("path")), 1);

                // Reload possible selections and load first excel sheet
                self.removeChildren($("#" + type + "ContentDay")[0]);
                addOptions(settings.paths["path" + type]);
                self.clear();

                if (($("#" + type + "ContentDay")[0].childNodes.length > 0)) self.load(excel.xlsxToArray($($("#" + type + "ContentDay")[0].selectedOptions[0]).attr("path"), type), type);
            });

            // Add options to excel selection
            function addOptions(paths) {

                return paths.map((path) => {
                    var pathParts = path.split("\\");
                    var option = document.getElementById(type + "ContentDay").createElement("option");
                    var pathName = pathParts[pathParts.length - 1].split(".")[0];
                    option.innerText = pathName;
                    $(option).attr("path", path);

                    return pathName;
                });
            }

            // Merge current Students
            if ("schüler" == type) $("#schülerContentMerge").click(function() {

                // Remove error statements
                let error = document.getElementById(type + "Error");
                error.removeClass("error");
                error.innerHTML = "";

                settings.current.merged = [];
                var tempMerged = [];

                self.load(settings.paths["pathschüler"].reduce((current, students) => {

                    let list = excel.xlsxToArray(students, type);
                    tempMerged = tempMerged.concat(settings.current.merged);

                    excel.trim(list);

                    // Add to array
                    if (!current.length) current = list;

                    // Append to array if equal header
                    else if (current[0].equals(list.shift())) current = current.concat([Array(current[0].length).fill("")]).concat(list);

                    // Error
                    else {
                        error.addClass("error");
                        error.innerHTML += "Fehler: Die Datei <b>'" + students + "'</b> ist inkompatibel.\n";
                    }

                    return current;
                }, []), type);

                settings.current.merged = tempMerged;
            });
        });
    });

    // Create user data
    // var data = excel.xlsxToArray(ipc.sendSync("loadJson", "pfade.json")["pathberufe"][index], "berufe")
    // ";" + data[0].join(";")
    // Array(länge).fill(0).map((student, index) => ["students" + index, ...Array(6).fill(0).map((num, jobIndex) => data[Math.floor(Math.random() * (data.length -1) +1)][jobIndex])].join(";")).join("\n")
    // Import as 65001: Unicode (UTF-8)
}
