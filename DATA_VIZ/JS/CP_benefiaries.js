// This function is used to calculate the width of a text in an SVG
var BrowserText = (function () {
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d');

    /**
     * Measures the rendered width of arbitrary text given the font size and font face
     * @param {string} text The text to measure
     * @param {number} fontSize The font size in pixels
     * @param {string} fontFace The font face ("Arial", "Helvetica", etc.)
     * @returns {number} The width of the text
     **/
    function getWidth(text, fontSize, fontFace) {
        context.font = fontSize + 'px ' + fontFace;
        return context.measureText(text).width;
    }

    return {
        getWidth: getWidth
    };
})();

d3.csv("../DATA_VIZ/TEST_CSV/AT_cp_07.csv", function (d) {
    if (d.field_transport_modes === "Air")
        d.field_transport_modes = "Airborne"
    else if (d.field_transport_modes === "Water")
        d.field_transport_modes = "Waterborne"
    return {
        shortName: d.shortName,
        field_transport_modes: d.field_transport_modes.toUpperCase(),
        ecContribution: +d.ecContribution,
        total: +d.total
    };
})
.then(function (data) {
    // Each transport mode needs to have the same amount of values
    // This function checks that and adds any necessary values that might be missing
    function assignDefaultValues(dataset)
    {
        var keys = ["AIRBORNE", "MULTIMODAL", "RAIL", "ROAD", "WATERBORNE"];
        var newData = [];
        var prevTotal = -1;

        // Group the data together and sort them according to the total value
        var nested_sorted = d3.nest()
            .key(function(d) { return d.shortName;})
            .entries(dataset);
        nested_sorted.sort((a, b) => b.values[0].total - a.values[0].total);

        nested_sorted.forEach(function(row){
            // Check if there are any modes of transport missing
            if (row.values.length != keys.length) {
                for (let index = 0; index < keys.length; index++) {
                    prevTotal = row.values[0].total;
                    if (row.values.some(e => e.field_transport_modes === keys[index])) {
                        continue;
                    } else {
                        newData.push({"shortName": row.key, "field_transport_modes": keys[index], "ecContribution": 0, "total": prevTotal});
                    }
                }
            }
        });

        return dataset.concat(newData).sort((a, b) => b.total - a.total);
    }

    var height = 410;
    var width = 610;
    var margin = ({ top: 10, right: 15, bottom: 80, left: 70 });
    
    // Create the SVG object
    const svg = d3.select("div.beneficiaries")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    var colors = new Map([
        ["AIRBORNE", "#40679B"],
        ["MULTIMODAL", "#AB823B"],
        ["RAIL", "#704539"],
        ["ROAD", "#4D4D4F"],
        ["WATERBORNE", "#2F6E6A"]
    ]);

    var icons = d3.scaleOrdinal().domain(["AIRBORNE", "MULTIMODAL", "RAIL", "ROAD", "WATERBORNE"])
        .range(["../ICONS/Airborne.svg", "../ICONS/MultiModal.svg", "../ICONS/Rail.svg", "../ICONS/Road.svg", "../ICONS/Waterborne.svg"]);
    
    // To be able to stack the data, they must all have the same length
    var fixedData = assignDefaultValues(data);
    
    // Color palette
    var color = d3.scaleOrdinal()
        .domain(colors.keys())
        .range(colors.values());
    
    // Stacking based on the mode of transport
    var series = d3.stack()
        .keys(colors.keys())
        .value((group, key) => group.get(key).ecContribution)
        .order(d3.stackOrderReverse)
      (d3.rollup(fixedData, ([d]) => d, d => d.shortName, d => d.field_transport_modes).values())
        .map(s => (s.forEach(d => d.data = d.data.get(s.key)), s))

    // Render the two scales
    var x = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]) * 1.11)])
        .range([margin.left, width - margin.right])
    var y = d3.scaleBand()
        .domain(fixedData.map(d => d.shortName))
        .rangeRound([margin.top, height - margin.bottom])
        .padding(0.14)
   
    // Create the two axis
    var xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(4).tickSize(0).tickPadding(5).tickFormat(x => (x / 1e6).toFixed(0) + "M€"))
        .style("font-size", 10)
        .style("color", "black");
    var yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSize(0).tickPadding(5))
        .style("font-size", 10)
        .style("color", "black");
    
    // The dashed grid lines on the x axis
    // But first calculate the grid lines to be in between the ticks of the axis
    var ticksArr = d3.axisBottom(x).scale().ticks(4)    // This array holds the values of the ticks on the X axis
    var gridTicks = []
    for (let index = 1; index < ticksArr.length; index++) {
        let inBetween = (ticksArr[index - 1] + ticksArr[index]) / 2;
        gridTicks.push(inBetween)   // Push in this array the values for the grid lines that are between the ticks of the x Axis      
    }
    var xAxisGrid = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisTop(x).tickSize(height - margin.top - margin.bottom).tickFormat("").tickValues(gridTicks)) // Use the array we calculated before
        .call(g => g.select(".domain")
             .remove())
         .call(g => g.selectAll(".tick line")
             .attr("stroke-opacity", 0.15)
             .attr("stroke-dasharray", "2.5")
             .style("color", "black"))
    
    // Render the axis and the grid lines
    svg.append("g")
        .call(xAxis);
    svg.append("g")
        .call(yAxis);
    svg.append("g")
        .call(xAxisGrid);

    // The functions that deal with the tooltip
    function showTooltip(bar) {
        // Adding the text to the tooltip and making it visible
        let textWidth = BrowserText.getWidth(d3.format(".0f")(bar.data.ecContribution).toString() + "€", 10, 'sans-serif') + 6
        tooltipRect.transition().duration(200).style('opacity', '1');
        tooltipText.transition().duration(200).text(d3.format(".0f")(bar.data.ecContribution).toString() + "€").style('opacity', '1');

        tooltipText
            .attr("transform", `translate(${x(bar[1]) + 8}, ${y(bar.data.shortName) + y.bandwidth()/2 + 3})`)

        tooltipRect
            .attr("transform", `translate(${x(bar[1]) + 5}, ${y(bar.data.shortName) + y.bandwidth()/2 - 8})`)
            .attr('width', textWidth)
            .attr('height', 16)
    }
    function hideTooltip() {
        // Clearing the tooltip
        tooltipRect.transition().duration(200).style('opacity', '0');    
        tooltipText.transition().duration(200).style('opacity', '0'); 
    }

    svg.append("g").attr("class", "stacks");

    function updateStack(arr) {
        let stackData = series;
        if (arr.length != 0) {
            // Re-calculate the stacked bars position using only the ones that are turned on by the user
            stackData = d3.stack()
                .keys(solo_modes)
                .value((group, key) => group.get(key).ecContribution)
                .order(d3.stackOrderReverse)
              (d3.rollup(fixedData, ([d]) => d, d => d.shortName, d => d.field_transport_modes).values())
                .map(s => (s.forEach(d => d.data = d.data.get(s.key)), s))
        }

        stackData.forEach((stackedBar) => {
          stackedBar.forEach((stack) => {
            stack.id = `${stackedBar.key}-${stack.data.shortName}`;
          });
        });

        let bars = svg
          .selectAll("g.stacks")
          .selectAll(".stack")
          .data(stackData, (d) => {
            return d.key;
          });

        bars.join(
          (enter) => {
            const barsEnter = enter.append("g").attr("class", "stack");

            barsEnter
              .append("g")
              .attr("class", "bars")
              .attr("fill", (d) => {
                return color(d.key);
              });

            updateRects(barsEnter.select(".bars"));

            return enter;
          },
          (update) => {
            const barsUpdate = update.select(".bars");
            updateRects(barsUpdate);
          },
          (exit) => {
            exit.selectAll("rect")
                .transition()
                .duration(700)
                .attr("x", x(0))
                .attr("width", 0)
                .call(exit =>
                    exit.remove()
                )
            
            return exit.transition().duration(700).remove();
          }
        );
    }

    function updateRects(childRects) {
        childRects
          .selectAll("rect")
          .data(
            (d) => d,
            (d) => d.id
          )
          .join(
            (enter) =>
              enter
                .append("rect")
                .attr("id", (d) => d.id)
                .attr("class", "bar")
                .attr("y", d => y(d.data.shortName))
                .attr("x", x(0))
                .attr("height", y.bandwidth())
                .on("mouseover", function(d, bar) {
                        return showTooltip(bar);
                    })
                    .on("mouseout", function() {
                        return hideTooltip();
                    })
                .call((enter) =>
                  enter
                    .transition()
                    .duration(700)
                    .attr("x", x(0))
                    .attr("width", d => x(d[1]) - x(0))
                ),
            (update) =>
              update.call((update) =>
                update
                  .transition()
                  .duration(700)
                  .attr("x", x(0))
                  .attr("width", d => x(d[1]) - x(0))
              )
          );
    }

    var solo_modes = [];
    updateStack(solo_modes);

    // The tooltip code
    var tooltip = svg.append("g");
    var tooltipRect = tooltip.append('rect')
            .attr("rx", 4)
            .attr("ry", 4)
            .style('fill', 'rgba(0,0,0,0.6)')
            .style("opacity", 0);
    var tooltipText = tooltip.append('text').text('EMPTY')
                .attr('fill', 'white')
                .style("opacity", 0)
                .style("font-size", "10px")
                .style("font-family", "sans-serif");

    // Creating the legend icons and adding the clicking interaction
    svg.append("g")
        .selectAll("image")
        .data(color.domain().reverse())
        .enter()
        .append("svg:image")
        .attr("xlink:href", d => icons(d))
        .attr("width", 25)
        .attr("height", 25)
        .attr("y", height - margin.bottom/2)
        .attr("x", function (d, i) {
            // The first two terms make sure that we respect the margin that has been specified
            // The next two terms calculate how much space each word needs
            // The last two terms take care of positioning the icon in the middle of the word
            return width - margin.right - d3.sum(color.domain().reverse().slice(0, i + 1), d => BrowserText.getWidth(d, 10, 'sans-serif')) - 20*i - 25/2 + BrowserText.getWidth(d, 10, 'sans-serif')/2
        })
        .on("click", function (d, icon) {
            // Add or remove a mode of transport
            if (solo_modes.includes(icon)) {
                solo_modes = solo_modes.filter(item => item !== icon)
            } else {
                solo_modes.push(icon)
            }

            // Call the update function to redraw the bars
            updateStack(solo_modes)
        })
    
    // Add the text for the icons and the text in the beginning of the legend
    svg.append("g")
        .attr("font-family", "sans-serif")
        .selectAll("text")
        .data(color.domain().reverse())
        .enter()
        .append("text")
        .text(d => d)
        .attr("font-size", 10)
        .attr("fill", "#002F67")
        .attr("y", height - margin.bottom/2 + 35)
        .attr("x", function (d, i) {
            return width - margin.right - d3.sum(color.domain().reverse().slice(0, i + 1), d => BrowserText.getWidth(d, 10, 'sans-serif')) - 20*i
        })
    svg.append("g")
        .append("text")
        .attr("font-size", 10)
        .attr("font-family", "sans-serif")
        .attr("fill", "#002F67")
        .text("TRANSPORT MODES:")
        .attr("y", height - margin.bottom/2 + 35)
        .attr("x", width - margin.right - d3.sum(color.domain(), d => BrowserText.getWidth(d, 10, 'sans-serif')) - 20 * color.domain().length - BrowserText.getWidth("TRANSPORT MODES:", 10, 'sans-serif')
        )
});