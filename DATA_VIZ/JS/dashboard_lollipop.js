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

// d3.csv("./TEST_CSV/df_3_1.csv", function (d) {
d3.csv("http://demotrimis.com/web/sites/default/files/csv/df_3_1.csv", function (d) {
    return {
        id: d.id,
        year: +d.year,
        gdp: +d.gdp,
        transport: +d.transport,
        ratio: +d.ratio
    };
})
.then(function (data) {
    var height = 500;
    var width = 600;
    var margin = ({ top: 50, right: 50, bottom: 50, left: 50 });

    var EU_avg = 9.813747;  // Hardcoded for now

    // Sort the data
    data.sort((a, b) => d3.ascending(a.ratio, b.ratio));
    
    // Create the SVG object
    const svg = d3.select("div.ecl-col-sm-12")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create the axis
    var x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.ratio) * 1.1])
        .rangeRound([margin.left, width - margin.right]);
    var y = d3.scalePoint()
        .domain(data.map(d => d.id))
        .rangeRound([margin.top, height - margin.bottom]);

    var xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .style("font-size", 8)
        .call(d3.axisBottom(x).ticks(5).tickSize(0).tickPadding(5))
        .call(g => g.select(".domain")
            .attr("stroke","white"))
        .call(g => g.selectAll(".tick text")
            .attr("fill","white"));
    var yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .style("font-size", 8)
        .call(d3.axisLeft(y).tickSize(0).tickPadding(5))
        .call(g => g.select(".domain")
            .attr("stroke","white"))
        .call(g => g.selectAll(".tick text")
            .attr("fill","white"));

    // Append the axis to the SVG
    svg.append("g")
        .call(xAxis);
    svg.append("g")
        .call(yAxis);

    // Add the white grid lines
    var yAxisGrid = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisRight(y).tickSize(width - margin.left - margin.right).tickFormat(""))
        .call(g => g.select(".domain")
            .remove())
         .call(g => g.selectAll(".tick line")
            .attr("stroke", "white")
            .attr("stroke-dasharray", "2.5")
            .attr("stroke-opacity", 0.45))
    
    var xAxisGrid = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisTop(x).ticks(5).tickSize(height - margin.top - margin.bottom).tickFormat(""))
        .call(g => g.select(".domain")
            .remove())
         .call(g => g.selectAll(".tick line")
            .attr("stroke", "white")
            .attr("stroke-dasharray", "2.5")
            .attr("stroke-opacity", 0.45))

    // Append the grid lines to the SVG
    svg.append("g")
        .call(xAxisGrid);
    svg.append("g")
        .call(yAxisGrid);

    // Create the lines for the chart
    svg.append("g")
      .selectAll("line")
      .data(data)
      .join("line")
        .attr("id", d => d.id)
        .attr("stroke", "#003D84")
        .attr("stroke-width", 2)
        .attr("x1", x(EU_avg))
        .attr("x2", d => x(d.ratio))
        .attr("y1", d => y(d.id))
        .attr("y2", d => y(d.id));

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
                .style("font-size", "8px")
                .style("font-family", "sans-serif");

    function hoverOver(d, dot) {
        // Dot animation
        d3.select(this)
            .transition()
            .duration(200)
            .attr("r", radius * 2);

        // Line animation
        svg.select("#" + dot.id).transition()
            .duration(200).attr("stroke-width", 4)

        // Adding the text to the tooltip and making it visible
        let textWidth = BrowserText.getWidth("Ratio: " + d3.format(".2f")(dot.ratio).toString(), 8, 'sans-serif') + 6
        tooltipRect.transition().duration(200).style('opacity', '1');
        tooltipText.transition().duration(200).text("Ratio: " + d3.format(".2f")(dot.ratio)).style('opacity', '1');

        // // Positioning the tooltip right or left of the dot respectively, depending on the where the line is
        if (dot.ratio > EU_avg) {
            tooltipText
                .attr("transform", `translate(${x(dot.ratio) + 13}, ${y(dot.id) + 3})`)

            tooltipRect
                .attr("transform", `translate(${x(dot.ratio) + 10}, ${y(dot.id) - 8})`)
                .attr('width', textWidth)
                .attr('height', 16)
        } else {
            tooltipText
                .attr("transform", `translate(${x(dot.ratio) - textWidth - 7}, ${y(dot.id) + 3})`)

            tooltipRect
                .attr("transform", `translate(${x(dot.ratio) - 10 - textWidth}, ${y(dot.id) - 8})`)
                .attr('width', textWidth)
                .attr('height', 16)
        }
    }

    function hoverOut(d, dot) {
        // Clearing the tooltip and reverting the line and dot back to their normal sizes
        tooltipRect.transition().duration(200).style('opacity', '0');    
        tooltipText.transition().duration(200).style('opacity', '0');    

        svg.select("#" + dot.id).transition()
            .duration(200).attr("stroke-width", 2)   

        d3.select(this)
            .transition()
            .attr("r", radius);
    }

    // Create the circles for the chart
    var radius = 4
    svg.append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
            .attr("fill", "#003D84")    // The color of the dots
            .attr("cx", d => x(d.ratio))
            .attr("cy", d => y(d.id))
            .attr("r", radius)
            .on("mouseover", hoverOver)
            .on("mouseout", hoverOut);

    // Adding the line for the EU average
    svg.append("g")
        .append("line")
            .attr("stroke", "#F8AE21")
            .attr("stroke-width", 2)
            .attr("x1", x(EU_avg))
            .attr("x2", x(EU_avg))
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom);
});