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

d3.csv("../DATA_VIZ/TEST_CSV/df_2_2.csv", function (d) {
    if (d.field_transport_modes === "Air")
        d.field_transport_modes = "Airborne"
    else if (d.field_transport_modes === "Water")
        d.field_transport_modes = "Waterborne"
    return {
        country: d.country,
        field_transport_modes: d.field_transport_modes.toUpperCase(),
        funding: +d.funding,
        total: +d.total
    };
})
.then(function (data) {
    function assignDefaultValues(dataset)
    {
        var keys = ["AIRBORNE", "MULTIMODAL", "RAIL", "ROAD", "WATERBORNE"];
        var newData = [];
        var prevTotal = -1;

        // Group the data together and sort them according to the total value
        var nested_sorted = d3.nest()
            .key(function(d) { return d.country;})
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
                        newData.push({"country": row.key, "field_transport_modes": keys[index], "funding": 0, "total": prevTotal});
                    }
                }
            }
        });

        return dataset.concat(newData).sort((a, b) => b.total - a.total);
    }
    var height = 430;
    var width = 600;
    var margin = ({ top: 5, right: 20, bottom: 80, left: 35 });
    
    // Create the SVG object
    const svg = d3.select("div.stacked_countries")
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
        .value((group, key) => group.get(key).funding)
        .order(d3.stackOrderReverse)
      (d3.rollup(fixedData, ([d]) => d, d => d.country, d => d.field_transport_modes).values())
        .map(s => (s.forEach(d => d.data = d.data.get(s.key)), s))
    
    // Render the axis
    var x = d3.scaleBand()
        .domain(fixedData.map(d => d.country))
        .rangeRound([margin.left, width - margin.right])
        .padding(0.14)
        .paddingOuter(0)
    var y = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]) * 1.11)])
        .range([height - margin.bottom, margin.top])
    var xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSize(0).tickPadding(5))
        .call(g => g.select(".domain").remove())
        .style("color", "black")
        .style("font-size", 9);
    var yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(5).tickFormat(x => (x / 1e6).toFixed(0) + "M€"))
        .style("font-size", 9)
        .style("color", "black");
    
    // The dashed grid lines on the y axis
    var yAxisGrid = g => g
        .attr("transform", `translate(${margin.left - 5},0)`)
        .call(d3.axisRight(y).ticks(4).tickSize(width - margin.left - margin.right + 5).tickFormat(""))
        .call(g => g.select(".domain")
             .remove())
         .call(g => g.selectAll(".tick line")
             .attr("stroke-opacity", 0.15)
             .attr("stroke-dasharray", "2.5")
             .style("color", "black"));
    
    // The grid lines on the x axis
    var xAxisGrid = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisTop(x).tickSize(height - margin.top - margin.bottom + 5).tickFormat(""))
        .call(g => g.select(".domain")
             .remove())
         .call(g => g.selectAll(".tick line")
             .attr("stroke-opacity", 0.15)
             .style("color", "black"));
    
    svg.append("g")
        .call(xAxis);
    svg.append("g")
        .call(yAxis);
    svg.append("g")
        .call(yAxisGrid);
    svg.append("g")
        .call(xAxisGrid);
    
    // Creating the chart
    svg.append("g")
        .selectAll("g")
        .data(series)
        .join("g")
            .attr("fill", ({key}) => color(key))
            .call(g => g.selectAll("rect")
                .data(d => d)
                .join("rect")
                    .attr("x", d => x(d.data.country))
                    .attr("y", d => y(d[1]))
                    .attr("width", x.bandwidth())
                    .attr("height", d => y(d[0]) - y(d[1] + d[0])));
    
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