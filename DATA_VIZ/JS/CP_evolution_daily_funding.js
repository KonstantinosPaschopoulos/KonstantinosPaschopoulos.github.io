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

d3.csv("../DATA_VIZ/TEST_CSV/AT_cp_04.csv", function (d) {
    var formatDate = d3.timeParse("%Y-%m-%d");
    if (d.mode === "Air")
        d.mode = "Airborne"
    else if (d.mode === "Water")
        d.mode = "Waterborne"
    return {
        fund_date: formatDate(d.fund_date),
        mode: d.mode.toUpperCase(),
        ecContribution: +d.ecContribution
    };
})
.then(function (data) {
    var height = 410;
    var width = 610;
    var margin = ({ top: 10, right: 15, bottom: 80, left: 40 });

    // Hover function
    function hover(svg, path) {
         // An easy way to keep only the unique dates of the dataset, to be used later for the hover function
        var dates = sumstat[0].values.map(d => d.fund_date)

        if ("ontouchstart" in document) svg
            .style("-webkit-tap-highlight-color", "transparent")
            .on("touchmove", moved)
            .on("touchstart", entered)
            .on("touchend", left)
        else svg
            .on("mousemove", moved)
            .on("mouseenter", entered)
            .on("mouseleave", left);

        const dot = svg.append("g")
            .attr("display", "none");

        dot.append("circle")
            .attr("r", 2.5);

        function moved(event) {
            event.preventDefault();
            const pointer = d3.pointer(event, this);
            const xm = x.invert(pointer[0]);            // With this we get from the position of the mouse the date and contribution value
            const ym = y.invert(pointer[1]);
            const i = d3.bisectCenter(dates, xm);       // This way we get the index of the date closest to the mouse
            const s = d3.least(sumstat, d => Math.abs(d.values[i].ecContribution - ym));
            path.attr("stroke-opacity", d => d === s ? "1" : "0.3").filter(d => d === s).raise();   // Make only one of them with full opacity
            dot.attr("transform", `translate(${x(s.values[i].fund_date)},${y(s.values[i].ecContribution)})`);

            let textWidth = BrowserText.getWidth("Date: " + new Date(s.values[i].fund_date).toJSON().slice(0,10).split('-').reverse().join('/'), 10, 'sans-serif') + 6
            tooltipRect.style('opacity', '1');
            tooltipText.style('opacity', '1');
            tooltipText.select(".amount").text("Funding: " + d3.format(".0f")(s.values[i].ecContribution) + "€").style('opacity', '1');
            tooltipText.select(".date").text("Date: " + new Date(s.values[i].fund_date).toJSON().slice(0,10).split('-').reverse().join('/')).style('opacity', '1');

            // Checking if the tooltip goes outside of the SVG borders
            if (new Date(xm) <= new Date("1/2/2019")) {
                // When it is inside the SVG borders it updates automatically
                tooltipText
                    .attr("transform", `translate(${x(s.values[i].fund_date) + 13}, ${y(s.values[i].ecContribution) + 21})`)
    
                tooltipRect
                    .attr("transform", `translate(${x(s.values[i].fund_date) + 10}, ${y(s.values[i].ecContribution) + 10})`)
                    .attr('width', textWidth)
                    .attr('height', 26)

                previousX = x(s.values[i].fund_date);
            } else {
                // When it goes outside the SVG borders it updates a hardcoded value for the x axis in order to stay inside the borders
                tooltipText
                    .attr("transform", `translate(${x(new Date("1/2/2019")) + 13}, ${y(s.values[i].ecContribution) + 21})`)
    
                tooltipRect
                    .attr("transform", `translate(${x(new Date("1/2/2019")) + 10}, ${y(s.values[i].ecContribution) + 10})`)
                    .attr('width', textWidth)
                    .attr('height', 26)
            }
        }

        function entered() {
            path.style("mix-blend-mode", null).attr("stroke-opacity", "1");
            dot.attr("display", null);
        }

        function left() {
            path.style("mix-blend-mode", "multiply").attr("stroke-opacity", "1");
            dot.attr("display", "none");
            tooltipRect.style('opacity', '0');    
            tooltipText.select(".amount").style('opacity', '0'); 
            tooltipText.select(".date").style('opacity', '0'); 
        }
    }
    
    // Colour palette and the icons
    var colour = d3.scaleOrdinal().domain(["AIRBORNE", "MULTIMODAL", "RAIL", "ROAD", "WATERBORNE"])
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
        .style("font-size", 10)
        .style("color", "black");
    
    // Creating the Y-Axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.ecContribution) * 1.1])
        .range([height - margin.bottom, margin.top])
    var yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(5).tickFormat(function(d) {return d/1000000 + "M€"}))
        .style("font-size", 10)
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

    // Drawing them to the SVG
    svg.append("g")
        .call(yAxisGrid);

    // Group the data together
    var sumstat = d3.nest()
        .key(function(d) { return d.mode;})
        .entries(data);

    // Draw the lines
    const path = svg.append("g")
        .selectAll(".line")
        .data(sumstat)
        .enter()
        .append("path")
            .attr("fill", "none")
            .style("mix-blend-mode", "multiply")
            .attr("stroke", d => colour(d.key))
            .attr("stroke-width", 1.5)
            .attr("d", function(d){
                return d3.line()
                    .curve(d3.curveBasis)
                    .x(function(d) { return x(d.fund_date); })
                    .y(function(d) { return y(d.ecContribution); })
                    (d.values)
                })
    
    // Adding the hover functionality
    svg.call(hover, path);

    // Draw the two axis on top of the lines
    svg.append("g")
        .call(xAxis);
    svg.append("g")
        .call(yAxis);

    // Creating the legend icons
    svg.append("g")
        .selectAll("image")
        .data(colour.domain().reverse())
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
            return width - margin.right - d3.sum(colour.domain().reverse().slice(0, i + 1), d => BrowserText.getWidth(d, 10, 'sans-serif')) - 20*i - 25/2 + BrowserText.getWidth(d, 10, 'sans-serif')/2
        })

    // Add the text for the icons and the text in the beginning of the legend
    svg.append("g")
        .attr("font-family", "sans-serif")
        .selectAll("text")
        .data(colour.domain().reverse())
        .enter()
        .append("text")
        .text(d => d)
        .attr("font-size", 10)
        .attr("fill", "#002F67")
        .attr("y", height - margin.bottom/2 + 35)
        .attr("x", function (d, i) {
            return width - margin.right - d3.sum(colour.domain().reverse().slice(0, i + 1), d => BrowserText.getWidth(d, 10, 'sans-serif')) - 20*i
        })
    svg.append("g")
        .append("text")
        .attr("font-size", 10)
        .attr("font-family", "sans-serif")
        .attr("fill", "#002F67")
        .text("TRANSPORT MODES:")
        .attr("y", height - margin.bottom/2 + 35)
        .attr("x", width - margin.right - d3.sum(colour.domain(), d => BrowserText.getWidth(d, 10, 'sans-serif')) - 20 * colour.domain().length - BrowserText.getWidth("TRANSPORT MODES:", 10, 'sans-serif')
            )

        // The tooltip code is in the end of the script in order for the tooltip to appear on top of everything else on the SVG
        var tooltip = svg.append("g");
        var tooltipRect = tooltip.append('rect')
                .attr("rx", 4)
                .attr("ry", 4)
                .style('fill', 'rgba(0,0,0,0.6)')
                .style("opacity", 0);
        var tooltipText = tooltip.append("text")
                    .attr("fill", "white")
                    .style("opacity", 0)
                    .style("font-size", "10px")
                    .style("font-family", "sans-serif");
        tooltipText.append("tspan").attr("class", "amount").attr("x", 0);
        tooltipText.append("tspan").attr("class", "date").attr("x", 0).attr("dy", 10);
});