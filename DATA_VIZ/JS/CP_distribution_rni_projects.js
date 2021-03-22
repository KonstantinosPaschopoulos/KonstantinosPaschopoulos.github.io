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

d3.csv("../DATA_VIZ/TEST_CSV/AT_cp_02.csv", function (d) {
    if (d.field_transport_modes === "Air")
        d.field_transport_modes = "Airborne"
    else if (d.field_transport_modes === "Water")
        d.field_transport_modes = "Waterborne"
    return {
        field_transport_modes: d.field_transport_modes.toUpperCase(),
        share: +d.share,
        nproj: +d.nproj,
        cum_share: +d.cum_share
    };
})
.then(function (data) {
    // Calculate from where each bar should start
    var index = 0, temp = 0;
    data.forEach(function(d) {
        index = temp;
        temp += +d.share;
        d.starting = index;
    });
    
    var width = 402;
    var height = 135;
    var margin = ({ top: 60, right: 15, bottom: 20, left: 15 })

    // Use one scale to asssign the colours and one scale for the X-axis
    var colour = d3.scaleOrdinal().domain(["AIRBORNE", "RAIL", "ROAD", "WATERBORNE", "MULTIMODAL"])
        .range(["#40679B", "#704539", "#4D4D4F", "#2F6E6A", "#AB823B"]);
    var icons = d3.scaleOrdinal().domain(["AIRBORNE", "MULTIMODAL", "RAIL", "ROAD", "WATERBORNE"])
        .range(["http://demotrimis.com/web/sites/default/files/icons/Airborne - Round - on color.svg", "http://demotrimis.com/web/sites/default/files/icons/MultiModal - Round - on color.svg", "http://demotrimis.com/web/sites/default/files/icons/Rail - Round - on color.svg", "http://demotrimis.com/web/sites/default/files/icons/Road - Round - on color.svg", "http://demotrimis.com/web/sites/default/files/icons/Waterborne - Round - on color.svg"]);
    var x = d3.scaleLinear([0, 100], [margin.left, width - margin.right]);

    // Checking if the first and last labels overflow outside of the dimension of the SVG
    // If the text is wider than the width of its respective rectangle then I add the difference to the margin
    // After that I recompute the x axis scale, this time with the new margins
    if (x(data[0].share) < BrowserText.getWidth(data[0].field_transport_modes, 11, 'sans-serif'))       // Checking the first label
            margin.left += (BrowserText.getWidth(data[0].field_transport_modes, 11, 'sans-serif') - x(data[0].share)) / 2 + 2;
    if (x(data[data.length - 1].share) < BrowserText.getWidth(data[data.length - 1].field_transport_modes, 11, 'sans-serif'))   // And the second one
            margin.right += (BrowserText.getWidth(data[data.length - 1].field_transport_modes, 11, 'sans-serif') - x(data[data.length - 1].share)) / 2 + 2;
    var x = d3.scaleLinear([0, 100], [margin.left, width - margin.right]);

    // Create the SVG object
    const svg = d3.select("div.nr_projects")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Define the div for the tooltip
    const tooltip = svg.append("g");

    // Create a g object to hold all the rectangles
    svg.append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("fill", d => colour(d.field_transport_modes))
        .attr("x", d => x(d.starting))
        .attr("y", margin.top)
        .attr("width", d => x(d.share + d.starting) - x(d.starting))    // Need to do it like this to get the width right with the margins
        .attr("height", height - margin.top - margin.bottom)
        // Adding the title text when hovering over
        .on("mouseover", (event, d) => {
            tooltip.append("text")
                .attr("transform", `translate(${x(d.starting) + ((x(d.share + d.starting) - x(d.starting)) / 2)}, ${margin.top})`)
                .call(text => text.append("tspan")
                    .attr("font-size", 11)
                    .attr("y", "-1em")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "central")
                    .attr("fill", "#002F67")
                    .text(d.field_transport_modes))
        })
        .on("mouseout", function(){return tooltip.selectAll("text").remove("tspan");});

    // Create another g object to hold all the texts
    svg.append("g")
        .attr("font-family", "sans-serif")
        .selectAll("text")
        .data(data)
        .join("text")
        .attr("transform", d => `translate(${x(d.starting) + ((x(d.share + d.starting) - x(d.starting)) / 2)}, ${margin.top})`)
        .call(text => text.append("tspan")                      // Text inside the rectangles
            .attr("y", (height - margin.top - margin.bottom) / 2)
            .attr("font-size", 13)
            .attr("fill", "white")
            .attr("font-weight", "bold")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            // .text(d => (d.share + "%"))
            .text(d => {
                // If the bar is too small, don't print anything
                if (BrowserText.getWidth(d.share.toString() + "%", 11, 'sans-serif') > x(d.share + d.starting) - x(d.starting))
                    return ""
                return (d.share + "%")
                })
            )
        // Adding the title text when hovering over
        .on("mouseover", (event, d) => {
            tooltip.append("text")
                .attr("transform", `translate(${x(d.starting) + ((x(d.share + d.starting) - x(d.starting)) / 2)}, ${margin.top})`)
                .call(text => text.append("tspan")
                    .attr("font-size", 11)
                    .attr("y", "-1em")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "central")
                    .attr("fill", "#002F67")
                    .text(d.field_transport_modes))
        })
        .on("mouseout", function(){return tooltip.selectAll("text").remove("tspan");});
        // .call(text => text.append("tspan")                      // Text for the titles
        //     .attr("font-size", 11)
        //     .attr("x", 0)
        //     .attr("y", "-1em")
        //     .attr("text-anchor", "middle")
        //     .attr("dominant-baseline", "central")
        //     .attr("fill", "#002F67")
        //     .text(d => (d.field_transport_modes)))

    // Adding the icons
    svg.append("g")
        .selectAll("image")
        .data(data)
        .enter()
        .append("svg:image")
        .attr("transform", d => `translate(${x(d.starting)}, ${margin.top/3})`)
        .attr("xlink:href", d => icons(d.field_transport_modes))
        .attr("x", d => ((x(d.share + d.starting) - x(d.starting))/2 - 15))        // To get it perfectly centered: half the width of the bar - half the width of the icon
        .attr("y", -10)
        .attr("width", 30)
        .attr("height", 30)
        .on("mouseover", (event, d) => {
            tooltip.append("text")
                .attr("transform", `translate(${x(d.starting) + ((x(d.share + d.starting) - x(d.starting)) / 2)}, ${margin.top})`)
                .call(text => text.append("tspan")
                    .attr("font-size", 11)
                    .attr("y", "-1em")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "central")
                    .attr("fill", "#002F67")
                    .text(d.field_transport_modes))
        })
        .on("mouseout", function(){return tooltip.selectAll("text").remove("tspan");});
});