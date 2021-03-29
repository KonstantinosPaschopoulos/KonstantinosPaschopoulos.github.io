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

d3.csv("../DATA_VIZ/TEST_CSV/df_1_5.csv", function (d) {
    var formatDate = d3.timeParse("%Y-%m-%d");
    if (d.mode === "Air")
        d.mode = "Airborne"
    else if (d.mode === "Water")
        d.mode = "Waterborne"
    return {
        fund_date: formatDate(d.fund_date),
        mode: d.mode.toUpperCase(),
        projects: +d.projects
    };
})
.then(function (data) {
    var height = 380;
    var width = 600;
    // var margin = ({ top: 50, right: 50, bottom: 120, left: 50 });
    var margin = ({ top: 20, right: 5, bottom: 80, left: 35 });

    var formatDate = d3.timeParse("%Y-%m-%d");

    // This variable is used to change the color of the chart automatically
    var RM = "CAT";

    var roadmap_colors = d3.scaleOrdinal()
        .domain(["CAT", "ELT", "ALT", "SMO", "INF", "NTM", "VDM"])
        .range(["#7e66a4", "#e8ce70", "#91a957", "#e69c58", "#6991C6", "#ca6b7e", "#45868c"])

    // Color palette
    var color = d3.scaleOrdinal().domain(["AIRBORNE", "MULTIMODAL", "RAIL", "ROAD", "WATERBORNE"])
        .range(["#40679B", "#AB823B", "#704539", "#4D4D4F", "#2F6E6A"]);
    var icons = d3.scaleOrdinal().domain(["AIRBORNE", "MULTIMODAL", "RAIL", "ROAD", "WATERBORNE"])
        .range(["http://demotrimis.com/web/sites/default/files/icons/Airborne - Round - on color.svg", "http://demotrimis.com/web/sites/default/files/icons/MultiModal - Round - on color.svg", "http://demotrimis.com/web/sites/default/files/icons/Rail - Round - on color.svg", "http://demotrimis.com/web/sites/default/files/icons/Road - Round - on color.svg", "http://demotrimis.com/web/sites/default/files/icons/Waterborne - Round - on color.svg"]);

    // Create the SVG object
    const svg = d3.select("div.daily")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Creating the X-Axis
    var x = d3.scaleUtc()
        .domain(d3.extent(data, d => d.fund_date))
        .range([margin.left, width - margin.right])
    var xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSize(0).tickPadding(10))
        .style("font-size", 9)
        .style("color", "black");

    // Creating the Y-Axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.projects) * 1.35])
        .range([height - margin.bottom, margin.top])
    var yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(5).tickFormat(x => (x / 1e3) + "M€"))
        .style("font-size", 9)
        .style("color", "black");

    // Adding the grids for the y and x axis
    var yAxisGrid = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisRight(y).ticks(4).tickSize(width - margin.left - margin.right).tickFormat(""))
        .call(g => g.select(".domain")
             .remove())
         .call(g => g.selectAll(".tick line")
             .attr("stroke-opacity", 0.15)
             .style("color", "black"))
    svg.append("g")
        .call(yAxisGrid);

    var xAxisGrid = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisTop(x).tickSize(height - margin.top - margin.bottom).tickFormat("").tickValues([formatDate("2009-01-01"), formatDate("2011-01-01"), formatDate("2013-01-01"), formatDate("2015-01-01"), formatDate("2017-01-01"), formatDate("2019-01-01")]))
        .call(g => g.select(".domain")
             .remove())
         .call(g => g.selectAll(".tick line")
             .attr("stroke-dasharray", "2.5")
             .attr("stroke-opacity", 0.15)
             .style("color", "black"))
    svg.append("g")
        .call(xAxisGrid);

    // Group the data together
    var sumstat = d3.nest()
        .key(function(d) { return d.mode;})
        .entries(data);
    
    // Draw the lines
    svg.selectAll(".line")
        .data(sumstat)
        .enter()
        .append("path")
            .attr("fill", "none ")
            .attr("stroke", d => color(d.key))
            .attr("stroke-width", 1.5)
            .attr("d", function(d){
                return d3.line()
                    .curve(d3.curveBasis)
                    .x(function(d) { return x(d.fund_date); })
                    .y(function(d) { return y(d.projects); })
                    (d.values)
                })

    // Draw the two axis on top of the lines
    svg.append("g")
        .call(xAxis);
    svg.append("g")
        .call(yAxis);

    // Creating the legend icons
    svg.append("g")
        .selectAll("image")
        .data(color.domain().reverse())
        .enter()
        .append("svg:image")
        .attr("xlink:href", d => icons(d))
        .attr("width", 20)
        .attr("height", 20)
        .attr("y", height - margin.bottom/2)
        .attr("x", function (d, i) {
            return width - margin.right - d3.sum(color.domain().reverse().slice(0, i + 1), d => BrowserText.getWidth(d, 9, 'sans-serif')) - 25*(i+1) - 5
        })
    
    // Creating the legend text
    // Adding the transport modes first and the legend title second
    svg.append("g")
        .attr("font-family", "sans-serif")
        .selectAll("text")
        .data(color.domain().reverse())
        .enter()
        .append("text")
        .text(d => d)
        .attr("font-size", 9)
        .attr("dominant-baseline", "central")
        .attr("fill", "#5F4D7B")
        .attr("y", height - margin.bottom/2 + 20/2)
        .attr("x", function (d, i) {
            return width - margin.right - d3.sum(color.domain().reverse().slice(0, i + 1), d => BrowserText.getWidth(d, 9, 'sans-serif')) - 25*(i+1) + 20 - 5
        })
    svg.append("g")
        .append("text")
        .attr("font-size", 9)
        .attr("font-family", "sans-serif")
        .attr("dominant-baseline", "central")
        .attr("fill", "#5F4D7B")
        .text("TRANSPORT MODES:")
        .attr("y", height - margin.bottom/2 + 20/2)
        .attr("x", width - margin.right - d3.sum(color.domain(), d => BrowserText.getWidth(d, 9, 'sans-serif')) - 25 * (color.domain().length + 1) - BrowserText.getWidth("TRANSPORT MODES:", 9, 'sans-serif')
            )
});