class Table {
    constructor(type, extraWorker) {

        this.type = type;

        // Store important elements
        this.table = $("#" + this.type + "ContentTable");
        this.tableHeader = $("#" + this.type + "ContentTableContainerHeader");
        this.tableBody = $("#" + this.type + "ContentTableContainerBody");
        this.thead = this.table.find("thead")[0];
        this.tbody = this.table.find("tbody")[0];

        extraWorker(this.type, this);

        // Horizontal scroll
        $(this.tableBody).scroll(this.scroll.bind(this));

        // Resize on menu selection
        $("#" + this.type).click(this.resize.bind(this));

        /* ---------- Inspired by http://jsfiddle.net/hashem/CrSpu/554/ from https://stackoverflow.com/questions/17067294/html-table-with-100-width-with-vertical-scroll-inside-tbody ---------- */

        // Adjust the width of thead cells when window resizes and trigger immediately
        $(window).resize(this.resize.bind(this));
    }

    resize() {

        // Get the tbody columns width array
        var colWidth = this.table.find('tbody tr:first').children().map(function() {
            return this.offsetWidth;
        }).get();

        // Set the width of thead columns
        this.table.find('thead tr').children().each(function(i, v) {
            $(v).width();
            // Prevent width to lower
            $(v).css({
                minWidth: colWidth[i],
                maxWidth: colWidth[i],
                width: colWidth[i]
            });
        });

        // Set the height of tbody columns
        $(this.tableBody).height($(this.table).height() - $(this.table.find("thead")[0]).height() + "px");
    }

    // Scrolls thead
    scroll() {
        $(this.thead).css({
            left: -$(this.tableBody).scrollLeft()
        });
    }

    // Load content
    load(content, type, listener) {

        // Add to current dataset
        if (!document.getElementById(type + "Error").classList.contains("error")) settings.current[type] = content;
        else settings.current[type] = [];

        // Removing old table
        this.clear();

        // Trim content
        excel.trim(content);

        // Creating columns
        this.createTablecolumn(this.thead, content[0], "th", content[0].length);
        for (var i = 1; i < content.length; i++) {
            this.createTablecolumn(this.tbody, content[i], "td", content[0].length, listener);
        }

        this.resize();
    }

    // Clear current content
    clear() {
        this.removeChildren(this.thead);
        this.removeChildren(this.tbody);
    }

    // Remove all children
    removeChildren(parent) {
        while (parent.lastChild) parent.removeChild(parent.lastChild);
    }

    // Create tablecolumn
    createTablecolumn(parent, content, type, length, listener) {
        var columnParent = parent.createElement("tr");

        for (var i = 0; i < length; i++) {
            var element = columnParent.createElement(type);
            if (content[i]) element.innerHTML = content[i];

            // Add element listener if available
            if (listener) {
                element.addEventListener("click", listener);
            }
        }
    }
}
