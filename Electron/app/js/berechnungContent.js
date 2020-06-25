function loadTableCalculate() {

    new Table("berechnung", (type, self) => {

        // Important data to sort
        const data = {
            schülerwünsche: {},
            initialSchülerwünsche: {},
            courseCouples: {},
            max: null,
            min: null,
            blocked: {},
            ungenauigkeit: 1.2
        };

        $("#berechnungContentCalculate")
            .click(() => {

                // Reset errors
                let error = document.getElementById("berechnungError");
                error.innerHTML = "";
                error.removeClass("error");

                // Get data from sheets -- cloning data
                var berufe = JSON.parse(JSON.stringify(settings.current.berufe));
                var schüler = JSON.parse(JSON.stringify(settings.current.schüler));

                // Procceed if data is correct
                if (berufe.length > 1 && schüler.length > 1) {

                    // Reset data
                    data.schülerwünsche = {};
                    data.blocked = {};
                    getUserData();

                    // Object creation for wishes
                    for (var time = 0; time < berufe[0].length; time++) {
                        data.schülerwünsche[berufe[0][time]] = {};

                        for (var i = 1; i < berufe.length; i++) {
                            data.schülerwünsche[berufe[0][time]][berufe[i][time]] = [];
                        }
                    }

                    // Verify compatibility of data and first sorting
                    if (!schüler[0][0]) schüler[0].shift();
                    var errorList = [];

                    if (schüler[0].equals(berufe[0])) {
                        for (var time = 0; time < schüler[0].length; time++) {
                            for (var i = 1; i < schüler.length; i++) {
                                try {
                                    // Ignore student if wish is empty
                                    if (schüler[i][time + 1]) data.schülerwünsche[schüler[0][time]][schüler[i][time + 1]].push(schüler[i][0]);
                                } catch (e) {
                                    errorList.push("Fehler: Schüler <b>" + schüler[i][0] + "</b> hat bei <b>" + schüler[0][time] + "</b> eine fehlerhaft Wahl.");
                                }
                            }
                        }
                    } else errorList.push("Fehler: Die Liste der Schüler ist nicht mit den Berufen kompatibel.");

                    // Fehler anzeigen
                    if (errorList.length) {

                        error.addClass("error");
                        errorList.forEach((errorStudent) => error.innerHTML += errorStudent + "\n");
                    } else {
                        // Set initial wishes - cloning
                        data.initialSchülerwünsche = JSON.parse(JSON.stringify(data.schülerwünsche));

                        // Table creation
                        schülerwünscheIntoTabe(data.schülerwünsche);

                        // Static data
                        data.courseCouples = courseCouples(data.schülerwünsche);

                        // Show umverteilung
                        $("#berechnungContentExtraButtons")
                            .css({
                                display: ""
                            });
                    }
                }
                else {
                    schülerwünscheIntoTabe({});

                    error.addClass("error");
                    error.innerHTML = "Die Daten sind Fehlerhaft oder leer.";
                }
            });

        function schülerwünscheIntoTabe(schülerwünsche) {

            // Fill in with data and load
            self.load(Object.entries(schülerwünsche)
                .reduce((current, [date, courses]) => {
                        current[0].push(date);

                        Object.entries(courses)
                            .forEach(([course, students], index) => current[index + 1].push(course != "undefined" ? (course + "<p style='color:" + colorParticipants(data.min, data.max, students.length) + ";' >" + students.length + "</p>") : ""));

                        return current;
                    },
                    // Create appropiate array size
                    (() => {
                        var keys = Object.keys(schülerwünsche);
                        if (keys.length) return Object.keys(schülerwünsche[keys[0]])
                            .reduce((current) => {
                                current.push([]);
                                return current;
                            }, [
                                []
                            ]);
                        else return [
                            []
                        ];
                    })()),
                // Type
                type,
                // Event listener
                (event) => {
                    event.path.some((element) => {

                        // Search for correct element
                        if (element.tagName == "TD") {

                            let course = element.childNodes[0].textContent;
                            let date = Object.keys(data.initialSchülerwünsche)[Array.prototype.slice.call(element.parentElement.children)
                                .indexOf(element)];

                            // Clear all students out of course
                            clearCourse(course, date);

                            // Student gets one free hour if shift is pressed
                            if (event.ctrlKey) clearCourseFreeLesson(course, date);

                            return true;
                        }
                    });
                });

            // Refresh absolute and relative sorting values
            var current = getStudentWishes(schülerwünsche);
            var initial = getStudentWishes(data.initialSchülerwünsche);

            // All wishes by student
            var allWishes = {};

            var relative = {
                wrong: 0,
                all: 0
            };
            var absolute = {
                wrong: 0,
                all: 0
            };

            // Iterate days for relative and absolute data
            Object.entries(initial)
                .forEach(([time, students]) => {

                    // Iterate students
                    Object.entries(students)
                        .forEach(([student, initialWish]) => {

                            // If not same add to wrong relative
                            if (initialWish != current[time][student]) relative.wrong += 1;
                            relative.all += 1;

                            // Add wish to list
                            if (allWishes[student]) {
                                allWishes[student]["current"].push(current[time][student]);
                                allWishes[student]["initial"].push(initialWish);
                            } else {
                                allWishes[student] = {
                                    "current": [current[time][student]],
                                    "initial": [initialWish]
                                };
                            }
                        });
                });

            // Iterate students for absolute
            Object.entries(allWishes)
                .forEach(([student, wishes]) => {

                    // Add wrong and complete length to absolute
                    absolute.all += wishes.initial.length;
                    absolute.wrong += wishes.initial.reduce((current, initialWish) => {

                            // Remove element by current
                            var index = current.indexOf(initialWish);
                            if (index != -1) current.splice(index, 1);

                            return current
                        }, wishes.current)
                        .length;
                });

            // Set percentage and color
            [
                [document.getElementById("berechnungRelativePercentage"), relative],
                [document.getElementById("berechnungAbsolutePercentage"), absolute]
            ].forEach(([percentageObj, percentageValue]) => {

                // Percentage
                var percentage = Math.round(percentageValue.wrong / percentageValue.all * 100);

                percentageObj.innerText = percentage + "%";
                percentageObj.style.color = 'rgb(' + (255 * percentage / 100) + ',' + (255 - (255 * percentage / 100)) + ',0)';
            });
        }

        // Changes the color of participant texts depending to the users data.max and data.min values
        function colorParticipants(min, max, participants) {
            if (participants == 0) return "red";
            if (max && min) {
                if (participants >= max * data.ungenauigkeit || participants * data.ungenauigkeit < min) return "red";
                else if (participants > max || participants < min) return "yellow";
            } else if (max && !min) {
                if (participants >= max * data.ungenauigkeit) return "red";
                else if (participants > max) return "yellow";
            } else if (min && !max) {
                if (participants * data.ungenauigkeit < min) return "red";
                else if (participants < min) return "yellow";
            }
            return "green";
        }

        $("#berechnungContentRedistribute")
            .click(() => {

                // Reset data
                getUserData();

                // Objects for faster sorting
                let studentWishes = getStudentWishes(data.schülerwünsche);

                // Get average students for courses if no max and min value is given
                let averageCourses = Object.fromEntries(Object.entries(data.courseCouples)
                    .map(([course, dates]) => {
                        return [course, dates.reduce((current, date) => {
                            return current + data.schülerwünsche[date][course].length;
                        }, 0) / dates.length];
                    }));

                // Get sizes of courses to distribute and sort for iteration
                getSizeCourses(data.schülerwünsche, averageCourses)
                    .sort((a, b) =>

                        // Sorts by importance -- min and max values or average
                        sortByMinMaxPull(a.students, b.students, averageCourses[a.course], averageCourses[b.course])

                    )
                    .some((sizeCoursesSorted) => {

                        // Sort students
                        sort(sizeCoursesSorted, averageCourses, studentWishes);
                    });

                // Load new table
                schülerwünscheIntoTabe(data.schülerwünsche);
            });

        function sort(sizeCoursesSorted, averageCourses, studentWishes) {

            // Seek for same course in couples
            Object.entries(data.courseCouples[sizeCoursesSorted.course].reduce((current, date) => {

                // Remove courses which are blocked to sort into and are the same date
                if (date != sizeCoursesSorted.date && (!data.blocked[date] ||
                    !data.blocked[date].includes(sizeCoursesSorted.course)))
                        current[date] = data.schülerwünsche[date][sizeCoursesSorted.course];
                return current;

            }, {}))
            .sort(([courseA, studentsA], [courseB, studentsB]) =>

                // Sorted courses by user data
                sortByMinMaxPull(studentsA.length, studentsB.length, 1, 1)

                // Iterate same courses
            )
            .some(([orderedCourse]) => {

                // Skip iteration if course is in great condition -- "true" is replied
                return skipIteration(sizeCoursesSorted.date, sizeCoursesSorted.course, averageCourses, () => {

                    // Seek for smallest courses to swap with
                    Object.entries(Object.entries(data.schülerwünsche[sizeCoursesSorted.date][sizeCoursesSorted.course].reduce((current, student) => {

                        // Do not add to list if it is the same course or it has been assigned already
                        // Do not add course if the current time doesnt offer it
                        if (!current[studentWishes[orderedCourse][student]] &&
                            studentWishes[orderedCourse][student] != sizeCoursesSorted.course &&
                            Object.keys(data.schülerwünsche[sizeCoursesSorted.date]).includes(studentWishes[orderedCourse][student]))
                                current[studentWishes[orderedCourse][student]]
                                    = data.schülerwünsche[orderedCourse][studentWishes[orderedCourse][student]].length;
                        return current;

                    }, {}))
                    // Remove blocked courses from list
                    .reduce((current, [course, students]) => {

                        // Add to current if initial date is not in blocked or not the course
                        if (!data.blocked[sizeCoursesSorted.date] ||
                            !data.blocked[sizeCoursesSorted.date].includes(course))
                                current[course] = students;

                        return current;

                    }, {}))
                    .sort(([courseA, studentsA], [courseB, studentsB]) =>

                        // Sorted courses by user data for iteration
                        sortByMinMaxPull(studentsA, studentsB, averageCourses[courseA], averageCourses[courseB])

                    )
                    // Iterate swap courses
                    .forEach(([orderedSwapCourse]) => {

                        // Iterate students out of orderedSwapCourses
                        data.schülerwünsche[orderedCourse][orderedSwapCourse].some((studentInSwapCourse) => {

                            // Breaks iteration if "true"
                            return skipIteration(sizeCoursesSorted.date, sizeCoursesSorted.course, averageCourses, () => {

                                // Checks if student in new time and new course is present in initial
                                let cutIndex = data.schülerwünsche[sizeCoursesSorted.date][sizeCoursesSorted.course].indexOf(studentInSwapCourse);

                                if (cutIndex != -1) {

                                    // Swap courses -- cuts from initial course to new course in same time and cuts from different course to initial course in different time
                                    data.schülerwünsche[sizeCoursesSorted.date][orderedSwapCourse]
                                        = data.schülerwünsche[sizeCoursesSorted.date][orderedSwapCourse]
                                            .concat(data.schülerwünsche[sizeCoursesSorted.date][sizeCoursesSorted.course]
                                                .splice(cutIndex, 1));

                                    data.schülerwünsche[orderedCourse][sizeCoursesSorted.course]
                                        = data.schülerwünsche[orderedCourse][sizeCoursesSorted.course]
                                            .concat(data.schülerwünsche[orderedCourse][orderedSwapCourse]
                                                .splice(data.schülerwünsche[orderedCourse][orderedSwapCourse]
                                                    .indexOf(studentInSwapCourse), 1));
                                }
                            });
                        });
                    });
                });
            });
        }

        // Sorting method for min and max values
        function sortByMinMaxPull(a, b, averageA, averageB) {
            if (
                (data.min && (a < data.min || b < data.min)) ||
                (data.max && (a > data.max || b > data.max))
            )
                return ((data.min || 0) - Math.min(a, b) > Math.max(a, b) - (data.max || Math.max(a, b))) ? a - b : b - a;
            else return Math.abs(1 - (b / averageB)) - Math.abs(1 - (a / averageA));
        }

        function sortByMinMaxPush(a, b) {
            // If greater than zero -- pushes into course
            return (a ? (b ? a - b : -1) : 1);
        }

        // Iteration skipper if course has been sorted well
        function skipIteration(date, course, averageCourses, worker) {
            // Both - min and max - combined
            if (data.min && data.max) {
                return ((data.schülerwünsche[date][course].length < data.min && data.schülerwünsche[date][course].length < averageCourses[course]) || data.schülerwünsche[date][course].length > data.max) ? worker() : true;
            }
            // Completely clear course if it is too small
            else if (data.min) {
                return (data.schülerwünsche[date][course].length < data.min && data.schülerwünsche[date][course].length < averageCourses[course]) ? worker() : true;
            } else if (data.max) {
                return (data.schülerwünsche[date][course].length > data.max) ? worker() : true;
            }
            // Remove students above average
            else {
                return (data.schülerwünsche[date][course].length > averageCourses[course]) ? worker() : true;
            }
        }

        // Importnat functions to calculate distribution
        function courseCouples(wishes) {

            return Object.entries(wishes)
                .reduce((current, [date, courses]) => {

                    // Add courses
                    Object.entries(courses)
                        .forEach(([course, students]) => {
                            current[course] ? current[course].push(date) : current[course] = [date];
                        });

                    return current;
                }, {});
        }

        function getSizeCourses(wishes, average) {

            return Object.entries(wishes)
                .reduce((current, [date, courses]) => {

                    Object.entries(courses)
                        .forEach(([course, students]) => {

                            if (students.length) current.push({
                                students: students.length,
                                date: date,
                                course: course
                            });
                        });

                    return current;
                }, []);
        }

        // Create object about student wishes by date
        function getStudentWishes(wishes) {

            // Iterate wishes
            return Object.fromEntries(Object.entries(wishes)
                .map(([date, courses]) =>

                    // Iterate courses in wish
                    [date, Object.fromEntries(Object.entries(courses)
                        .reduce((array, [course, students]) =>

                            // Return student with course wish
                            array.concat(students.map((student) => [student, course])), []))]
                ));
        }

        // Export Excel sheet
        $("#berechnungContentExport")
            .click(() => {

                // Get initial data and calculate wishes
                var initial = settings.current.schüler;
                var wishes = getStudentWishes(data.schülerwünsche);

                let newData = [[settings.current.schüler[0]]];
                let dataIndex = 0;
                let subIndex = 0;

                // Replace new data
                for (var index = 1; index < initial.length; index++) {

                    // Check for empty
                    if (!initial[index][0]) {

                        // Create new list
                        newData.push([settings.current.schüler[0]]);
                        subIndex = index;
                        dataIndex += 1;
                    }
                    else {
                        // Exend new lists
                        newData[dataIndex].push(initial[index]);

                        for (var date = 1; date < initial[index].length; date++) {

                            // New course
                            newData[dataIndex][index - subIndex][date] = wishes[initial[0][date]][initial[index][0]];
                        }
                    }
                }

                // Save data
                excel.saveExcel(newData);
            });

        function getUserData() {
            // Get user data
            data.max = parseInt($("#berechnungContentMax")
                .val()) || 0;
            data.min = parseInt($("#berechnungContentMin")
                .val()) || 0;

            // Verify user data
            if (data.min && data.max && data.min > data.max)[data.min, data.max] = [data.max, data.min];

            // Student twice the same course
            data.double = document.getElementById("berechnungContentDoppeltBelegung")
                .checked;
        }

        // Flush all students out of a course
        function clearCourse(course, date) {

            getUserData();

            // Sets static data for last Sorting -- breaks on data.max
            var startedOverMax = data.schülerwünsche[date][course].length > data.max;

            // Sort students as best as possible
            sort({
                    date: date,
                    course: course
                },
                // Get average students for courses if no max and min value is given
                Object.fromEntries(Object.entries(data.courseCouples)
                    .map(([course, dates]) => {
                        return [course, dates.reduce((current, date) => {
                            return current + data.schülerwünsche[date][course].length;
                        }, 0) / dates.length];
                    })),
                // Objects for faster sorting
                getStudentWishes(data.schülerwünsche)
            );

            // Add to blocked courses
            data.blocked[date] ? data.blocked[date].push(course) : data.blocked[date] = [course];

            // Get array of all wishes for sorting
            let studentWishesArray = Object.entries(getStudentWishes(data.schülerwünsche))
                .reduce((current, [time, students]) => {

                    Object.entries(students)
                        .forEach(([student, course]) => {
                            current[student] ? current[student].push(course) : current[student] = [course];
                        });

                    return current;
                }, {});

            // Search for ideal courses
            data.schülerwünsche[date][course].reduce((current, student) => {

                    // Break if max value is given and current course size is lower than max value
                    if (startedOverMax && data.schülerwünsche[date][course].length - current.length <= data.max) return current;

                    // Look up best alternative course
                    Object.keys(data.schülerwünsche[date])
                        .sort((a, b) =>

                            // Sorted courses by user data
                            sortByMinMaxPush(data.schülerwünsche[date][a].length, data.schülerwünsche[date][b].length)

                        )
                        .some((alternativeCourse) => {

                            // Check that student is not redistributed into same course, that he is not going into the same course at two times and checks if the current course isnt blocked
                            if (alternativeCourse != course &&
                                (!studentWishesArray[student].includes(alternativeCourse) || data.double) &&
                                !data.blocked[date].includes(alternativeCourse)) {

                                data.schülerwünsche[date][alternativeCourse].push(student);
                                current.push(student);
                                return true;
                            }
                        });

                    return current;
                }, [])
                // Remove students from former list
                .forEach((student) => data.schülerwünsche[date][course].splice(data.schülerwünsche[date][course].indexOf(student), 1));

            // Load new table
            schülerwünscheIntoTabe(data.schülerwünsche);
        }

        function clearCourseFreeLesson(course, date) {

            // Removes all students from course
            data.schülerwünsche[date][course] = [];

            // Load new table
            schülerwünscheIntoTabe(data.schülerwünsche);
        }
    });
}
