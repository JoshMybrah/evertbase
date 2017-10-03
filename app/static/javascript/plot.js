$(document).ready(function () {
    "use strict";
    controller.init();

    plotController.init();
});

// Data controller for plotting page
var dataController = (function () {
    "use strict";
    var data, DOMStrings, plotState;
    // plotState = plotController.getPlotState();

    // jQuery selectors for DOM objects
    DOMStrings = {
        plant: "select#plotPlant",
        units: "select#plotUnits",
        tags: "select#plotTags",
        type: "select#plotType",
        submitBtn: "input#Submit",
        deleteBtn: "button#deleteplot",
        plotArea: "plot",
        plotAddOnsArea: "plotAddOnsArea",
        subplotsCheck: "input#subplots-check",
        linkXaxesValue: "input#linkXaxesValue",
        linkXaxisCheckbox: "div#linkXcheckbox",
        plotAddOns: 'select#AddOnSelect'
    };

    return {
        // executes the $.getJSON method for asynchronous data handling
        getJSONData: function (route, callback) {
            // required plotting data
            data = {
                plant: $(DOMStrings.plant).val(),
                units: $(DOMStrings.units).val(),
                tags: $(DOMStrings.tags).val(),
                type: $(DOMStrings.type).val(),
                subplotCheck: $(DOMStrings.subplotsCheck).is(":checked"),
                linkXaxes: $(DOMStrings.linkXaxesValue).is(":checked")
            };
            $.getJSON(route, data, callback);
        },
        // return the DOMStrings object
        getDOMStrings: function () {
            return DOMStrings;
        }, timeFormat: function(domain){
            var min = domain[0], max = domain[1];
            var diff = max - min;
            var format;


           if (diff <= 3.6e6){
               format = "%H:%M:%S";
           }else if(diff <= 3.6e6*24 && diff > 3.6e6){
               format = "%H:%M";
           }else if(diff <= 3.6e6*24*30 && diff > 3.6e6*24){
               format = "%d-%b  %H:00";
           }else if(diff <=3.6e6*24*365 && diff > 3.6e6*24*30) {
               format = "%M-%d";
           } else {
               format = "%Y-%m-%d %H:%M";
           }

           return format;
        }
    };
})();
// user interface controller
var UIController = (function () {
    "use strict";
    var DOMStrings;
    // DOM object strings
    DOMStrings = dataController.getDOMStrings();
    // update any select field
    var updateSelect = function (selector, data) {
            selector.empty();
            $.each(data, function (value, key) {
                selector.append($("<option class='active-result'></option>").attr("value", value).text(key));
            });
            selector.trigger("chosen:updated");
        };

    return {
        // initialises the chosen jQuery plugin elements
        init: function () {
            $(DOMStrings.plant).chosen({width: "100%"});
            $(DOMStrings.units).chosen({width: "100%"});
            $(DOMStrings.tags).chosen({width: "100%"});
            $(DOMStrings.type).chosen({width: "100%"});

        },
        // setup of all select elements when plant is changed
        plantSetup: function (data) {
            var $unitselect = $(DOMStrings.units);
            var $tags = $(DOMStrings.tags);

            // updating the unit select field
            updateSelect($unitselect, data.sections);

            //updating the tags select field
            updateSelect($tags, data.alltags);

            $unitselect.trigger("chosen:updated");
            $tags.trigger("chosen:updated");
        },

        // update tags select element
        updateTags: function(data) {
            var $plotTags = $(DOMStrings.tags);
            if (data.unittags){
                updateSelect($plotTags, data.unittags);
            } else {
                updateSelect($plotTags, data.alltags);
            }

        }
    };
})();

// controller to handle plotting logic
var plotController = (function() {
    "use strict";
    var DOMStrings, socket, plotStateObject;
    plotStateObject = new EvertPlotState();
    DOMStrings = dataController.getDOMStrings();

    var updatePlot = function(data) {
        // data coming from websocket after zoom.
        var newData = data.data;
        // names of the traces that need to be updated
        var newDataNames = _.map(newData, function(d){return d.name;});
        var plotArea = document.getElementById("plot");
        // current data visible on the plot
        var currentData = plotArea.data;

        newDataNames.forEach(function(d, i){
            var index = _.findIndex(currentData, ["name", d]);
            currentData[index].x = newData[i].x;
            currentData[index].y = newData[i].y;

        });
        plotArea.data = currentData;
        // redraw plot
        Plotly.redraw(DOMStrings.plotArea);

    };

    return {
         // rendering of plot data
        createPlot: function (plotData, layout, tags_map) {

            // resetting the plot state
            plotStateObject.resetState();
            plotStateObject.subplots = $(DOMStrings.subplotsCheck).prop("checked");
            plotStateObject.linkedXAxis = $(DOMStrings.linkXaxesValue).prop("checked");
            // resetting the add-on space
            Plotly.purge(DOMStrings.plotAddOnsArea);
            $(DOMStrings.plotAddOns).val("none");
            // adding traces to state
            plotData.forEach(function(d, i) {
                plotStateObject.addTrace(new EvertTrace(d.name, d.x, d.y, d.xaxis, d.yaxis));
            });
            // capturing data from forms
            plotStateObject.formData = {
                plant: $(DOMStrings.plant).val(),
                units: $(DOMStrings.units).val(),
                tags: $(DOMStrings.tags).val()
            };

            plotStateObject.tagsMap = tags_map;

            if (layout === undefined){
                if ($(DOMStrings.subplotsCheck).is(":checked")){
                    var frac = 1/plotData.length;
                    layout = {
                        showlegend: true
                    };

                    if (!$(DOMStrings.linkXaxesValue).is(":checked")){
                        plotData.forEach(function(d, i){
                            layout["xaxis".concat(i+1)] = {
                                title: i === 0 ? "Timestamp": undefined,
                                showline: true,
                                ticks: "outside",
                                anchor: "y"+(i+1)
                            };
                            layout["yaxis".concat(i+1)]= {
                                showline: true,
                                ticks: "outside",
                                fixedrange: true,
                                title: d.name,
                                domain: [frac*i + 0.09 , frac*(i+1)]
                            };
                        });

                    } else {

                        layout["xaxis"] = {
                                title: "Timestamp",
                                showline: true,
                                ticks: "outside"

                            };

                        plotData.forEach(function(d, i) {
                            layout["yaxis".concat(i + 1)]= {
                                showline: true,
                                ticks: "outside",
                                fixedrange: true,
                                title: d.name,
                                domain: [frac*i + 0.09 , frac*(i+1)]
                            };
                        });
                    }

                } else if (!$(DOMStrings.subplotsCheck).is(":checked")){
                    layout = {
                        showlegend: true,
                        xaxis : {
                            title: "timestamp",
                            showline: true,
                            ticks: "outside"
                        },
                        yaxis: {
                            showline: true,
                            ticks: "outside",
                            fixedrange: true
                        }
                    };
                }
                plotStateObject.plotLayout = layout;
            }

            Plotly.newPlot(DOMStrings.plotArea, plotData, layout,
                {
                    scrollZoom: true,
                    boxZoom: false,
                    showLink: false,
                    displayLogo: false,
                    showTips: false,
                    modeBarButtonsToRemove: ["autoScale2d", "resetScale2d", "sendDataToCloud"],
                    doubleClick: false
                });
            // Event listener for when plot is zoomed. Must be called after plot is created.
            var plotArea = document.getElementById("plot");
            plotArea.on("plotly_relayout", function(e){
                var keys = Object.keys(e);
                var names;

                if (keys.length > 0 && keys[0].match(/(xaxis[0-9]*)(?=\.range\[[0-9]\])/g) &&
                    keys[1].match(/(xaxis[0-9]*)(?=\.range\[[0-9]\])/g)){

                    var xmin = e[keys[0]];
                    var xmax = e[keys[1]];

                    if (!$(DOMStrings.linkXaxesValue).is(":checked")){
                        socket.emit("zoom_event",
                        {
                            domain: [xmin, xmax],
                            ids: $(DOMStrings.tags).val()
                        });
                    } else {
                         var xAxis = keys[0].match(/(xaxis[0-9]*)(?=\.range\[[0-9]\])/g)[0];
                         var xAxisNumber = xAxis.match(/([0-9])/g);
                         if (!xAxisNumber) {
                            names = _.partition(plotArea.data, function(d){
                                return _.includes(["x"], d.xaxis);
                            })[0];

                         } else if (xAxisNumber){
                             names = _.partition(plotArea.data, function(d){
                                 return _.includes(["x".concat(xAxisNumber)], d.xaxis);
                           })[0];
                         }

                         var ids = [];
                         console.log(plotStateObject);
                         names.forEach(function(d, i){
                             ids.push(plotStateObject.tagsMap[d.name]);
                         });

                         socket.emit("zoom_event",
                        {
                            domain: [xmin, xmax],
                            ids: ids,
                            xAxisNo:  xAxisNumber || 1
                        });
                    }
                }

                plotStateObject.plotLayout = plotArea.layout;
            });

            plotStateObject.initialRange = plotArea.layout.xaxis.range;
            localStorage.setItem("plotState", JSON.stringify(plotStateObject.writeState()));
        },

        uploadFeaturesData: function (data) {

        //     // data coming from websocket after zoom.
        // var newData = data.data;
        // // names of the traces that need to be updated
        // var newDataNames = _.map(newData, function(d){return d.name;});
        // var plotArea = document.getElementById("plot");
        // // current data visible on the plot
        // var currentData = plotArea.data;
        //
        // newDataNames.forEach(function(d, i){
        //     var index = _.findIndex(currentData, ["name", d]);
        //     currentData[index].x = newData[i].x;
        //     currentData[index].y = newData[i].y;
        //
        // });

        // // redraw plot
        // Plotly.redraw(DOMStrings.plotArea);
            console.log(data.data);
            var featureData = data.data;
            var plotArea = document.getElementById(DOMStrings.plotArea);
            var currentData = plotArea.data;
            var dataCount = $(DOMStrings.tags).val().length;

            if (currentData.length === dataCount){
                currentData = currentData.concat(featureData);
                plotArea.data = currentData;
            } else if (currentData.length > dataCount) {
                var newDataNames = _.map(featureData, function(d){return d.name;});
                newDataNames.forEach(function(d, i){
                    var index = _.findIndex(currentData, ["name", d]);
                    currentData[index].x = featureData[i].x;
                    currentData[index].y = featureData[i].y;
                });
                plotArea.data = currentData;
                console.log(newDataNames)
            }


            Plotly.redraw(DOMStrings.plotArea, plotArea.data, plotArea.layout);



        },
        // delete plot from plot area
        deletePlot: function() {
        Plotly.purge(DOMStrings.plotArea);
        plotStateObject.resetState();
        Plotly.purge(DOMStrings.plotAddOnsArea);
        localStorage.setItem("plotData", undefined);
        $(DOMStrings.plotAddOns).val('none');
        // localStorage.setItem('plotDomain', undefined);
        },
        init: function () {
            var namespace = "/test";
            socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port + namespace);

            socket.on("connect", function() {
                        console.log("connected");
                    });


            socket.on("pluginFeaturesEmit", function(data){
                console.log("pluginfeatures");
                plotController.uploadFeaturesData(data);
            });

            socket.on("zoom_return", function(data){
                updatePlot(data);
            });

            socket.on("add_on_return_plot_data", function(data){
                // console.log(data.script.replace(/ /g, ''));
                if (!data.msg){
                    var layout = data.layout;
                    layout.showlegend = data.showlegend;
                    var plotData = data.data;

                    Plotly.newPlot(DOMStrings.plotAddOnsArea, plotData, layout);
                } else if (data.msg) {
                    $.notify(data.msg, {
                            position: "top center",
                            className: "error"
                        });
                    $(DOMStrings.plotArea).val("none");
                }
            });



        },
        getPlotState: function(){
            return plotStateObject;
        },
        getSocket: function () {
            return socket;
        }
    };
})();

// general plot page controller
var controller = (function () {
    "use strict";
    var DOMStrings, plotStateObject;

    DOMStrings = dataController.getDOMStrings();
    plotStateObject = plotController.getPlotState();

    // setting up event listeners
    var setupEventListners = function(){
        // Event listener for plot button
        $(DOMStrings.submitBtn).on("click", function () {
            dataController.getJSONData("/_plotdata", function(d) {
                plotController.createPlot(d.data, undefined, d.tags_map);

            })});


        // Event listener for when units are selected (updates tags)
        $(DOMStrings.units).on("change", function () {
            dataController.getJSONData("/_unitchange", UIController.updateTags);
        });

        // Event listener for when the plant is changed (updates units and tags)
        $(DOMStrings.plant).on("change", function () {
            dataController.getJSONData("/_plantchangesetup", UIController.plantSetup);
        });

        // Event listener for delete button
        $(DOMStrings.deleteBtn).on("click", plotController.deletePlot);

        // Event listener for subplots check button
        $(DOMStrings.subplotsCheck).on("click", function(){
            if ($(this).is(":checked")){
                $(DOMStrings.linkXaxisCheckbox).show();
                plotStateObject.subplots = true;
            } else {
                $(DOMStrings.linkXaxisCheckbox).hide();
                plotStateObject.subplots = false;
            }
        });

        // Event listener for plot add-ons
        $(DOMStrings.plotAddOns).on('change', function(){

            if ($(DOMStrings.linkXaxesValue).is(':checked') || !$(DOMStrings.subplotsCheck).is(':checked')){
                if ($(this).val() === 'gridplot'){
                    Plotly.purge(DOMStrings.plotAddOnsArea);
                    gridplot(plotController.getPlotState(), DOMStrings.plotAddOnsArea);
                } else if ($(this).val() === 'none'){
                    Plotly.purge(DOMStrings.plotAddOnsArea);
                } else {
                    Plotly.purge(DOMStrings.plotAddOnsArea);
                    var socket = plotController.getSocket();
                    socket.emit("add_on_event", {
                    ids: $(DOMStrings.tags).val(),
                    name: $(DOMStrings.plotAddOns).val(),
                    domain: document.getElementById(DOMStrings.plotArea).layout.xaxis.range
                    });
                }
            } else {
                $.notify("Add ons can only be used with a single plot or subplots with linked x-axes", {
                            position: "top center",
                            className: "error"
                        });

                $(DOMStrings.plotAddOns).val("none");
            }
        });
    };

    return {
        init: function () {
            UIController.init();
            setupEventListners();

            console.log("init");
            if (localStorage.getItem("plotState")||false) {

                plotStateObject = new EvertPlotState();
                plotStateObject.readState(JSON.parse(localStorage.getItem("plotState")));
                var formData = plotStateObject.formData;
                DOMStrings = dataController.getDOMStrings();

                $(DOMStrings.plant).val(formData.plant);
                $(DOMStrings.plant).trigger("chosen:updated");
                $(DOMStrings.units).val(formData.units);
                $(DOMStrings.units).trigger("chosen:updated");
                $(DOMStrings.tags).val(formData.tags);
                $(DOMStrings.tags).trigger("chosen:updated");

                $(DOMStrings.subplotsCheck).prop("checked", plotStateObject.subplots);
                $(DOMStrings.linkXaxesValue).prop("checked", plotStateObject.linkedXAxis);
                if (plotStateObject.subplots){
                    $(DOMStrings.linkXaxisCheckbox).show();
                }

                plotController.createPlot(plotStateObject.traces, plotStateObject.plotLayout, plotStateObject.tagsMap);
            }
        }

    };
})();
