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

d3.csv("../DATA_VIZ/TEST_CSV/AT_cp_06.csv", function (d) {
    return {
        pos: +d.pos,
        source: d.source,
        RM: d.RM,
        all: +d.all,
        only: +d.only
    };
})
.then(function (data) {
    var height = 380;
    var width = 600;
    var margin = ({ top: 5, right: 15, bottom: 80, left: 40 });

    // Another column is added that holds the value of all - only from the dataset, to help with the creation of the bars
    data.forEach(element => {
        element.all_without = element.all - element.only;
    });
    data.columns.push("all_without")
    
    // Create the SVG object
    const svg = d3.select("div.rni")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    // Sort alphabetically
    data.sort(function (a, b) {
      return d3.ascending(a.RM, b.RM) || d3.descending(a.source, b.source);
    });

    // Color palette for the fill of the bars
    var roadmap_colors = d3.scaleOrdinal()
        .domain(["CAT", "ELT", "ALT", "SMO", "INF", "NTM", "VDM"])
        .range(["#7e66a4", "#e8ce70", "#91a957", "#e69c58", "#6991C6", "#ca6b7e", "#45868c"])
        .unknown("#404040");

    // Color palette for the strokes
    var strokes_colors = d3.scaleOrdinal()
        .domain(["MS", "H2020", "FP7"])
        .range(["#404040", "#004494", "#FFD617"])

    var groupKey = data.columns[2];
    var keys = data.columns[1];
    
    // Prepare the scales
    var x0 = d3.scaleBand()
        .domain(data.map(d => d[groupKey]))
        .rangeRound([margin.left, width - margin.right])
        .paddingInner(0.1)
    var x1 = d3.scaleBand()
        .domain(data.map(d => d[keys]))
        .rangeRound([0, x0.bandwidth()])
        .padding(0.03)
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.all) * 1.1])
        .range([height - margin.bottom, margin.top])

    // Prepare the two axis
    var xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x0).tickSize(0).tickPadding(5).ticks())
        .style("font-size", 10)
        .style("color", "black");
    var yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(4))
        .style("font-size", 10)
        .style("color", "black");
    
    // Prepare the grid lines on the y axis
    var yAxisGrid = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisRight(y).ticks(5).tickSize(width - margin.left - margin.right).tickFormat(""))
        .call(g => g.select(".domain")
             .remove())
         .call(g => g.selectAll(".tick line")
             .attr("stroke-opacity", 0.15)
             .style("color", "black"))
    
    // Print the grid
    svg.append("g")
        .call(yAxisGrid);

    // Stacking the data for the columns
    var series = d3.stack()
      .keys(data.columns.slice(4))
    (data)
      .map(d => (d.forEach(v => v.key = d.key), d))

    svg.append("g")
        .selectAll("g")
        .data(series)
        .join("g")
        .selectAll("rect")
        .data(d => d)
        .join("rect")
          .attr("transform", d => `translate(${x0(d.data.RM)},0)`)      // First we position the three bars in the correct place using the x0 scale
          .attr("fill", d => roadmap_colors(d.data.RM))
          .attr("stroke", d => strokes_colors(d.data.source))
          .attr("stroke-opacity", "1")
          .attr("fill-opacity", d => {    // This way we can control the opacity of each bar
                if (d.key === "only")
                  return 0.9;
                else
                  return 0.7;
            })
          .attr("x", d => x1(d.data.source))    // Then we use the x1 scale to position the bars next to each other
          .attr("y", d => y(d[1]))
          .attr("height", d => y(d[0]) - y(d[1]))
          .attr("width", x1.bandwidth())
    
    // Print the axis after all that
    svg.append("g")
        .call(xAxis);
    svg.append("g")
        .call(yAxis);

    // Building the legend now
    var legend_text = ["FUNDING:", "STATE", "H2020", "EUC FP7"];
    svg.append("g")         // First the texts
        .attr("font-family", "sans-serif")
        .selectAll("text")
        .data(legend_text)
        .enter()
        .append("text")
        .text(d => d)
        .attr("font-size", 10)
        .attr("dominant-baseline", "central")
        .attr("fill", "#002F67")
        .attr("y", height - margin.bottom/2 + 15/2)
        .attr("x", function (d, i) {
            return margin.left + d3.sum(legend_text.slice(0, i), d => BrowserText.getWidth(d, 10, 'sans-serif')) + 25 * i
        });
    svg.append("g")         // Then the squares
        .selectAll("rect")
        .data(strokes_colors.domain())
        .join("rect")
          .attr("transform", (d, i) => `translate(${margin.left + d3.sum(legend_text.slice(0, i + 2), d => BrowserText.getWidth(d, 10, 'sans-serif')) + 25 * (i + 1) + 4}, ${height - margin.bottom/2})`)
          .attr("fill", "white")
          .attr("stroke", d => strokes_colors(d))
          .attr("x", 0)
          .attr("y", 0)
          .attr("height", 15)
          .attr("width", 15);

    // Now the second half of the legend
    var second_legend_text = ["ROADMAPS' OVERLAP", "SINGLE ROADMAP"];
    svg.append("g")         // First the texts
        .attr("font-family", "sans-serif")
        .selectAll("text")
        .data(second_legend_text)
        .enter()
        .append("text")
        .text(d => d)
        .attr("font-size", 10)
        .attr("dominant-baseline", "central")
        .attr("fill", "#002F67")
        .attr("y", height - margin.bottom/2 + 15/2)
        .attr("x", function (d, i) {
            return width - margin.right - d3.sum(second_legend_text.slice(0, i + 1), d => BrowserText.getWidth(d, 10, 'sans-serif')) - 25 * (i + 1)
        });
    svg.append("g")         // Then the squares
        .selectAll("rect")
        .data(second_legend_text)
        .join("rect")
          .attr("transform", (d, i) => `translate(${width - margin.right - d3.sum(second_legend_text.slice(0, i), d => BrowserText.getWidth(d, 10, 'sans-serif')) - 25 * (i + 1) + 4}, ${height - margin.bottom/2})`)
          .attr("fill", "#004494")
          .attr("opacity", (d , i) => 0.6 + (0.2 * i))
          .attr("x", 0)
          .attr("y", 0)
          .attr("height", 15)
          .attr("width", 15);
});