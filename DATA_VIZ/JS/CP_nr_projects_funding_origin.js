d3.csv("../DATA_VIZ/TEST_CSV/AT_cp_01.csv", function (d) {
    return {
        origin: d.origin,
        nproj: +d.nproj,
        x: +d.x,
        label: d.label,
        label_y: +d.label_y,
    };
})
.then(function (data) {
    var height = 150;
    var width = 382;
    var margin = ({ top: 15, right: 0, bottom: 20, left: 0 });

    // Create the SVG object
    const svg = d3.select("div.origin")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Calculate the correct start and end of the bars
    const total = d3.sum(data, d => d.nproj);
    var value = 0;
    var stack = data.map(d => ({
            origin: d.origin,
            label: d.label,
            value: d.nproj / total,
            startValue: value / total,
            endValue: (value += d.nproj) / total
        }));

    // Create the scale for the x axis
    var x = d3.scaleLinear()
        .domain([0, 1])
        .range([margin.left, width - margin.right]);

    // The values of the colours of the bars and the texts
    var colour = d3.scaleOrdinal(["EC"], ["#003D84"])   // The colour of the EC
        .unknown("#F8AE21")     // The colour to be used for all the countries

    var colourText = d3.scaleOrdinal(["EC"], ["#FFFFFF"])   // The colour of the EC
        .unknown("#004494")     // The colour to be used for all the countries

    // Adding the bars
    svg.append("g")
        .selectAll("rect")
        .data(stack)
        .join("rect")
          .attr("fill", d => colour(d.origin))
          .attr("x", d => x(d.startValue))
          .attr("y", margin.top)
          .attr("width", d => x(d.endValue) - x(d.startValue))
          .attr("height", height - margin.top - margin.bottom)

    // Adding the texts
    svg.append("g")
        .selectAll("text")
        .data(stack)
        .join("text")
          .attr("font-family", "sans-serif")
          .attr("font-size", 20)
          .attr("fill", d => colourText(d.origin))
          .attr("transform", d => `translate(${x(d.startValue + (d.value/2))  }, ${margin.top + (height - margin.top - margin.bottom)/2})`)
          .call(text => text.append("tspan")
              .attr("font-weight", "bold")
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "central")
              .text(d => {return d.label}))
});