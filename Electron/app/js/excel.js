const xlsx = require("node-xlsx");

const excel = {
  // Import excel sheets -- opens windows prompt
  load: () => {
    return ipc.sendSync("importFiles", "Excel", ["xlsx"]);
  },
  // Export excel sheets -- opens windows prompt
  saveExcel: (file) => {
    ipc.send(
      "exportFile",
      xlsx.build(
        file.map((content, index) => {
          return {
            name: new RegExp("^" + index + ". ").test(
              settings.current.merged[index]
            )
              ? settings.current.merged[index]
              : index.toString() + ". " + settings.current.merged[index],
            data: content,
          };
        })
      ),
      "Excel",
      ["xlsx"]
    );
  },
  // Converts given xlsx path to a usable JSON object
  xlsxToJSON: (xlsxPath, type) => {
    try {
      var sheet = xlsx.parse(xlsxPath);

      // Hide error path
      document.getElementById(type + "Error").removeClass("error");

      if (sheet[0].data.length) return sheet;
    } catch (e) {}

    // If the path does not exist or is not a valid xlsx this error occours
    let error = document.getElementById(type + "Error");
    error.addClass("error");
    error.innerHTML =
      (type == "berechnung" ? error.innerHTML : "") +
      "Fehler: Der Pfad <b>'" +
      xlsxPath +
      "'</b> konnte nicht gefunden werden oder ist ungültig.\n";

    // Generic empty list
    return [
      {
        data: [[]],
      },
    ];
  },
  // Converts given xlsx path to a usable array
  xlsxToArray: (xlsxPath, type) => {
    // Modify merged
    if (type == "schüler") settings.current.merged = [];

    let xlsx = excel.xlsxToJSON(xlsxPath, type);

    return xlsx.reduce(
      (current, list) => {
        // Clean data
        excel.trim(list.data);
        list.data.shift();

        // Add merged
        if (type == "schüler") settings.current.merged.push(list.name);

        // Add ending
        list.data = list.data.concat([Array(current[0].length).fill("")]);

        // Add pages to header
        return current.concat(list.data);
      },
      [xlsx[0].data[0]]
    );
  },
  trim: (array) => {
    // Trim content
        while (!array[array.length -1][0] || !array.length) array.pop();

    return array;
  },
};
