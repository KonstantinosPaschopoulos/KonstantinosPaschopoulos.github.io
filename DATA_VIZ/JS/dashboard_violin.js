d3.csv("../DATA_VIZ/TEST_CSV/df_5_1.csv", function (d) {
    return {
        fund_scheme: d.fund_scheme,
        field_eu_contribution: +d.field_eu_contribution
    };
})
.then(function (data) {
    var width = 600;
    var height = 490;
    var margin = ({ top: 50, right: 50, bottom: 50, left: 50 });

    // Create the SVG object
    const svg = d3.select("div.violin")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create the axis
    var x = d3.scaleBand()
        .domain(["FP7-TRANSPORT", "FP7-Other", "H2020-3.4", "H2020-Other", "Other European"])
        .rangeRound([margin.left, width - margin.right])
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.field_eu_contribution) * 1.1])
        .range([height - margin.bottom, margin.top]);

    var xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .style("font-size", 8)
        .call(d3.axisBottom(x).tickSize(0).tickPadding(5))
        .call(g => g.select(".domain")
            .attr("stroke","white"))
        .call(g => g.selectAll(".tick text")
            .attr("fill","white"))
    var yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .style("font-size", 8)
        .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(5).tickFormat(x => (x / 1e6).toFixed(0) + "M€"))
        .call(g => g.select(".domain")
            .attr("stroke","white"))
        .call(g => g.selectAll(".tick text")
            .attr("fill","white"))

    // Adding the grid lines
    var yAxisGrid = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisRight(y).ticks(4).tickSize(width - margin.left - margin.right).tickFormat(""))
        .call(g => g.select(".domain")
            .remove())
         .call(g => g.selectAll(".tick line")
            .attr("stroke", "white")
            .attr("stroke-dasharray", "2.5")
            .attr("stroke-opacity", 0.45))
    
    var xAxisGrid = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisTop(x).tickSize(height - margin.top - margin.bottom).tickFormat(""))
        .call(g => g.select(".domain")
            .remove())
         .call(g => g.selectAll(".tick line")
            .attr("stroke", "white")
            .attr("stroke-dasharray", "2.5")
            .attr("stroke-opacity", 0.45))

    svg.append("g")
        .call(xAxisGrid);
    svg.append("g")
        .call(yAxisGrid);

    // Creating the histogram to be used for the violins
    var histogram = d3.histogram()
        .domain(y.domain())
        .thresholds(y.ticks(30))    // How detailed the violin is
        .value(d => d);

    // Compute the binning for each group of the dataset
    var sumstat = d3.nest()
        .key(function(d) { return d.fund_scheme;})
        .rollup(function(d) {   // For each key
            input = d.map(function(g) { return g.field_eu_contribution;})   // Use the EU contribution value to calculate the histogram value
            bins = histogram(input)   // Compute the binning on it
            return(bins)
        })
        .entries(data)

    // What is the biggest number of value in a bin? We need it cause this value will have a width of 100% of the bandwidth.
    var maxNum = 0
    for ( i in sumstat ){
        var allBins = sumstat[i].value;
        var lengths = allBins.map(function(a){return a.length;});
        var longest = d3.max(lengths);
        if (longest > maxNum) { maxNum = longest };
    }

    // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
    var xNum = d3.scaleLinear()
        .domain([-maxNum,maxNum])
        .range([0, x.bandwidth()])

    // Add the violin
    svg.selectAll("myViolin")
        .data(sumstat)
        .enter()        // So now we are working group per group
        .append("g")
        .attr("transform", function(d){ return(`translate(${x(d.key)} , -2)`) } ) // Translation on the right to be at the group position
        .append("path")
            .datum(function(d){ return(d.value)})     // So now we are working bin per bin
            .style("fill","#FFF0AC")                  // Color of the violin
            .attr("d", d3.area()
                .x0(xNum(0))    // This way only half of the violin shows
                .x1(function(d){ return(xNum(d.length)) } )
                .y(function(d){ return(y(d.x0)) } )
                .curve(d3.curveCatmullRom)
            )

    // Adding the dots
    // To add the dots we use a static simulation
    // The three forces are for the x and y values + the radius of the dots
    var simulation = d3.forceSimulation(data)
        .force("x", d3.forceX((d) => {
            return x(d.fund_scheme) + xNum(0);
            }).strength(0.1))
        .force("y", d3.forceY((d) => {
            return y(d.field_eu_contribution);
            }).strength(7))
        .force("collide", d3.forceCollide((d) => {
            return 2;
            }).strength(1))
        .stop()

    // Use a timeout to allow the rest of the page to load first.
    d3.timeout(function() {
        // See https://github.com/d3/d3-force/blob/master/README.md#simulation_tick
        for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
            simulation.tick();
        }
        svg.append("g")
            .selectAll("circle")
            .data(data)
            .enter().append("circle")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", 2)
            .attr("fill", "#00387F");           // Color of the dots
    });

    // Adding the axis on top of everything
    svg.append("g")
        .call(xAxis);
    svg.append("g")
        .call(yAxis);
});