const settings = {
    settings: ipc.sendSync("loadJson", "settings.json"),
    paths: ipc.sendSync("loadJson", "pfade.json"),
    current: {
        schüler: [],
        berufe: [],
        berechnung: [],
        merged: []
    },
    initialize: () => {

        // Set button functions
        $("#settingsToggleDark").click(settings.toggleDarkMode);

        // Load settings
        settings.toggleDarkMode(settings.settings.darkMode);
    },
    toggleDarkMode: (setVal) => {

        // Css object
        var linking = $("link[href*='css/lightMode.css']");

        // If bool sets value
        if (typeof(setVal) == "boolean") linking.attr("disabled", setVal ? "disabled" : null);
        else {

            // Activate/Deactivate Css by current status
            if (settings.settings.darkMode) linking.attr("disabled", null);
            else linking.attr("disabled", "disabled");

            // Set new data
            settings.settings.darkMode = !settings.settings.darkMode;

            // Write json
            ipc.send("writeFile", JSON.stringify(settings.settings), ["app", "json", "settings.json"]);
        }

        document.getElementById("settingsToggleDark").checked = settings.settings.darkMode ? true : false;
    },
    save: () => {
        // Stores data
        ipc.send("writeFile", JSON.stringify(settings.settings), ["app", "json", "settings.json"]);
        ipc.send("writeFile", JSON.stringify(settings.paths), ["app", "json", "pfade.json"]);
    }
};
