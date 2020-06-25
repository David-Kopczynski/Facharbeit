const ipc = require("electron").ipcRenderer;
const win = require('electron').remote.getCurrentWindow();

function onload() {
    /* ---------- Basic window features ---------- */
    // Create minimise/restore/close buttons work when they are clicked
    document.getElementById('min-button').addEventListener("click", function() {
        win.minimize();
    });
    document.getElementById('restore-button').addEventListener("click", function() {
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
    });
    document.getElementById('close-button').addEventListener("click", function() {
        win.close();
    });

    /* ---------- Onclick event for different menu-pages ---------- */
    var menuButtons = document.getElementById("menu").childNodes;
    for (var i = 0; i < menuButtons.length; i++) {
        menuButtons[i].onclick = function() {
            [...document.getElementsByClassName("active")].removeClass("active");
            [document.getElementById(this.id + "Content"), this].addClass("active");
        }
    }

    // Load Tables
    loadTableBerufeSchüler();
    loadTableCalculate();
    settings.initialize();

    // Save data into json
    window.onbeforeunload = () => {
        settings.save();
    }
}
