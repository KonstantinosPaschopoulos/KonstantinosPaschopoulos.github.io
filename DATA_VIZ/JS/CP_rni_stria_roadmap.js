d3.csv("../DATA_VIZ/TEST_CSV/AT_cp_05.csv", function (d) {
    return {
        pos: +d.pos,
        RM: d.RM,
        all: +d.all,
        only: +d.only
    };
})
.then(function (data) {
    var height = 380;
    var width = 600;
    var margin = ({ top: 50, right: 15, bottom: 30, left: 50 });

    // Another column is added that holds the value of all - only from the dataset, to help with the creation of the bars
    data.forEach(element => {
        element.all_without = element.all - element.only;
    });
    data.columns.push("all_without")
    
    // Create the SVG object
    const svg = d3.select("div.rni_stria")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    // Sort alphabetically the roadmaps
    data.sort(function (a,b) {return d3.ascending(a.RM, b.RM);});
    
    // Color palette
    var roadmap_colors = d3.scaleOrdinal()
        .domain(["CAT", "ELT", "ALT", "SMO", "INF", "NTM", "VDM"])
        .range(["#7e66a4", "#e8ce70", "#91a957", "#e69c58", "#6991C6", "#ca6b7e", "#45868c"])
        .unknown("#404040");
    
    // Prepare the two scales
    var x = d3.scaleBand()
        .domain(data.map(d => d.RM))
        .rangeRound([margin.left, width - margin.right])
        .padding(0.14)
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.all) * 1.1])
        .range([height - margin.bottom, margin.top])

    // Prepare the two axis
    var xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSize(0).tickPadding(5).ticks())
        .style("font-size", 10)
        .style("color", "black");
    var yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(4))
        .style("font-size", 10)
        .style("color", "black");
    
    // Creating the grid lines on the y axis
    var yAxisGrid = g => g
        .attr("transform", `translate(${margin.left - 3},0)`)
        .call(d3.axisRight(y).ticks(4).tickSize(width - margin.left - margin.right + 3).tickFormat(""))
        .call(g => g.select(".domain")
             .remove())
         .call(g => g.selectAll(".tick line")
             .attr("stroke-opacity", 0.15)
             .style("color", "black"))
    
    // Print the grid lines on the y axis
    svg.append("g")
        .call(yAxisGrid);

    // Stacking the data for the columns
    series = d3.stack()
      .keys(data.columns.slice(3))
    (data)
      .map(d => (d.forEach(v => v.key = d.key), d))

    // Render the bars in one go
    svg.append("g")
        .selectAll("g")
        .data(series.reverse())
        .join("g")
        .selectAll("rect")
        .data(d => d)
        .join("rect")
          .attr("fill", d => roadmap_colors(d.data.RM))
          .attr("stroke", d => roadmap_colors(d.data.RM))
          .attr("fill-opacity", "0.7")
          .attr("stroke-opacity", "1")
          .attr("x", (d, i) => x(d.data.RM))
          .attr("y", d => y(d[1]))
          .attr("height", d => y(d[0]) - y(d[0] + d[1]))    // This way each bar goes all the way down, and with the overlap it creates we get the difference in color we want
          .attr("width", x.bandwidth())
    
    // Do each column in each own loop to be able to customize it more
    // svg.append("g")
    //     .selectAll("rect")
    //     .data(data)
    //     .join("rect")
    //       .attr("fill", d => roadmap_colors(d.RM))
    //       .attr("stroke", d => roadmap_colors(d.RM))
    //       .attr("fill-opacity", "0.6")
    //       .attr("stroke-opacity", "1")
    //       .attr("x", d => x(d.RM))
    //       .attr("y", d => y(d.all))
    //       .attr("height", d => y(0) - y(d.all))
    //       .attr("width", x.bandwidth());

    // svg.append("g")
    //     .selectAll("rect")
    //     .data(data)
    //     .join("rect")
    //       .attr("fill", d => roadmap_colors(d.RM))
    //       .attr("stroke", d => roadmap_colors(d.RM))
    //       .attr("fill-opacity", "0.6")
    //       .attr("stroke-opacity", "1")
    //       .attr("x", d => x(d.RM))
    //       .attr("y", d => y(d.only))
    //       .attr("height", d => y(0) - y(d.only))
    //       .attr("width", x.bandwidth());

    // Print the two axis after all that
    svg.append("g")
        .call(xAxis);
    svg.append("g")
        .call(yAxis);
});