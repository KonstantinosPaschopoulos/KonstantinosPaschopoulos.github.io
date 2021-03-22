// d3.csv("./TEST_CSV/df_6_1.csv", function (d) {
d3.csv("http://demotrimis.com/web/sites/default/files/csv/df_6_1.csv", function (d) {
    var formatDate = d3.timeParse("%Y-%m-%d");
    return {
        fund_date: formatDate(d.fund_date),
        overlap: d.overlap,
        projects: +d.projects
    };
})
.then(function (data) {
    var width = 600;
    var height = 444;
    var margin = ({ top: 50, right: 50, bottom: 120, left: 50 });

    var formatDate = d3.timeParse("%Y-%m-%d");

    // These two variables are used in order to change the color of the chart
    var RM = "CAT";
    var roadmap_colors = d3.scaleOrdinal()
        .domain(["CAT", "ELT", "ALT", "SMO", "INF", "NTM", "VDM"])
        .range(["#7e66a4", "#e8ce70", "#91a957", "#e69c58", "#6991C6", "#ca6b7e", "#45868c"])

    // Create the SVG object
    const svg = d3.select("div.ecl-col-sm-12")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Creating the X-Axis
    var x = d3.scaleUtc()
        .domain(d3.extent(data, d => d.fund_date))
        .range([margin.left, width - margin.right])
    var xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .style("font-size", 8)
        .call(d3.axisBottom(x).ticks(width / 80).tickSize(0).tickPadding(10))
        .call(g => g.select(".domain")
            .attr("stroke", roadmap_colors(RM)))
        .call(g => g.selectAll(".tick text")
            .attr("fill", roadmap_colors(RM)));

    // Creating the Y-Axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.projects) * 1.2])
        .range([height - margin.bottom, margin.top])
    var yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .style("font-size", 8)
        .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(5))
        .call(g => g.select(".domain")
            .attr("stroke", roadmap_colors(RM)))
        .call(g => g.selectAll(".tick text")
            .attr("fill", roadmap_colors(RM)));

    // Adding the grids for the y and x axis
    var yAxisGrid = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisRight(y).ticks(4).tickSize(width - margin.left - margin.right).tickFormat(""))
        .call(g => g.select(".domain")
            .remove())
         .call(g => g.selectAll(".tick line")
            .attr("stroke", roadmap_colors(RM))
            .attr("stroke-dasharray", "2.5")
            .attr("stroke-opacity", 0.45))
    var xAxisGrid = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisTop(x).tickSize(height - margin.top - margin.bottom).tickFormat("").tickValues([formatDate("2009-01-01"), formatDate("2011-01-01"), formatDate("2013-01-01"), formatDate("2015-01-01"), formatDate("2017-01-01"), formatDate("2019-01-01")]))
        .call(g => g.select(".domain")
            .remove())
         .call(g => g.selectAll(".tick line")
            .attr("stroke", roadmap_colors(RM))
            .attr("stroke-dasharray", "2.5")
            .attr("stroke-opacity", 0.45))

    svg.append("g")
        .call(yAxisGrid);
    svg.append("g")
        .call(xAxisGrid);

    // Group the data together
    var sumstat = d3.nest()
        .key(function(d) { return d.overlap;})
        .entries(data);
    
    // Draw the lines
    svg.selectAll(".line")
        .data(sumstat)
        .enter()
        .append("path")
            .attr("fill", "none ")
            .attr("stroke", roadmap_colors(RM))
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", function (d) {
                // This if statement decides if the lines is going to be with dots, using the stroke-dasharray attribute
                if (d.key === "N")
                    return "2.5"
                else
                    return "0"
            })
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
});