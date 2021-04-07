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

d3.csv("../DATA_VIZ/TEST_CSV/df_3_2.csv", function (d) {
    return {
        id: d.id,
        ratio_2019: +d.ratio_2019,
        ratio_2010: +d.ratio_2010
    };
})
.then(function (data) {
    var height = 450;
    var width = 600;
    var margin = ({ top: 10, right: 50, bottom: 50, left: 50 });

    // Hardcoding the values for now
    var EU_avg = 9.813747;
    var EU_avg_2010 = 4.266749;

    // Sort the data
    data.sort((a, b) => d3.ascending(a.ratio_2019, b.ratio_2019));
    
    // Create the SVG object
    const svg = d3.select("div.cleveland")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create the axis scales
    var x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.ratio_2019) * 1.1])
        .rangeRound([margin.left, width - margin.right]);
    var y = d3.scalePoint()
        .domain(data.map(d => d.id))
        .rangeRound([margin.top, height - margin.bottom]);

    // Create the axis elements
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
            .attr("stroke-opacity", 0.45));
    var xAxisGrid = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisTop(x).ticks(5).tickSize(height - margin.top - margin.bottom).tickFormat(""))
        .call(g => g.select(".domain")
            .remove())
         .call(g => g.selectAll(".tick line")
            .attr("stroke", "white")
            .attr("stroke-dasharray", "2.5")
            .attr("stroke-opacity", 0.45));

    // Append the grid lines to the SVG
    svg.append("g")
        .call(xAxisGrid);
    svg.append("g")
        .call(yAxisGrid);

    // Adding the arrow
    var defs = svg.append('svg:defs')
    svg.append('svg:g')
        .attr('id', 'markers')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    defs.append('svg:marker')
        .attr('id', 'arrowhead')
        .attr('markerHeight', 6)
        .attr('markerWidth', 6)
        .attr('markerUnits', 'strokeWidth')
        .attr('refX', 6)
        .attr('refY', 6)
        .attr("orient","auto-start-reverse")
        .attr('viewBox', '0 0 12 12')
        .append('svg:path')
            .attr('d', "M2,2 L10,6 L2,10 L6,6 L2,2")
            .attr('fill', "#F8AE21");       // Arrowhead color
    
    // Adding the line for the arrow
    svg.append("g")
        .append("line")
        .attr("x1", x(EU_avg) - 5)  
        .attr("y1", y(data[0].id) - 4)  
        .attr("x2", x(EU_avg_2010))  
        .attr("y2", y(data[0].id) - 4)
        .attr("stroke","#F8AE21")           // Arrow line color
        .attr("stroke-width",2)
        .attr("marker-start","url(#arrowhead)");

    // Adding the line for the 2019 EU average
    svg.append("g")
        .append("line")
            .attr("stroke", "#F8AE21")          // The color of the 2019 EU average line
            .attr("stroke-width", 2)
            .attr("x1", x(EU_avg))
            .attr("x2", x(EU_avg))
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom);

    // Adding the line for the 2010 EU average
    svg.append("g")
        .append("line")
            .attr("stroke", "#FFE879")          // The color of the 2010 EU average line
            .attr("stroke-width", 2)
            .attr("x1", x(EU_avg_2010))
            .attr("x2", x(EU_avg_2010))
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom);

    // Create the lines for the chart
    svg.append("g")
      .selectAll("line")
      .data(data)
      .join("line")
        .attr("id", d => d.id)
        .attr("stroke", "#003D84")          // The color of the lines
        .attr("stroke-width", 2)
        .attr("x1", function (d) {
            if (!isNaN(d.ratio_2010)) {
                return x(d.ratio_2010);
            } else {
                return x(d.ratio_2019);
            }
        })
        .attr("x2", d => x(d.ratio_2019))
        .attr("y1", d => y(d.id))
        .attr("y2", d => y(d.id));

    // Create the circles for the 2019 values
    var radius2019 = 4;
    svg.append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
            .attr("fill", "#003D84")    // The color of the big dots
            .attr("cx", d => x(d.ratio_2019))
            .attr("cy", d => y(d.id))
            .attr("r", radius2019)
            .on("mouseover", function(d, dot) {
                // Dot animation
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", radius2019 * 2);

                // Line animation
                svg.select("#" + dot.id).transition()
                    .duration(200).attr("stroke-width", 4)

                // Adding the tooltip
                let textWidth = BrowserText.getWidth("Ratio: " + d3.format(".2f")(dot.ratio_2019).toString(), 8, 'sans-serif') + 6
                tooltipRect.transition().duration(200).style('opacity', '1');
                tooltipText.transition().duration(200).text("Ratio: " + d3.format(".2f")(dot.ratio_2019)).style('opacity', '1');

                // Positioning the tooltip, but making sure to pick the correct side to show it
                if (dot.ratio_2010 > dot.ratio_2019) {
                    tooltipText
                        .attr('x', x(dot.ratio_2019) - 57)
                        .attr('y', y(dot.id) + 3)

                    tooltipRect
                        .attr('width', textWidth)
                        .attr('height', 16)
                        .attr('x', x(dot.ratio_2019) - 60)
                        .attr('y', y(dot.id) - 8)
                } else {
                    tooltipText
                        .attr('x', x(dot.ratio_2019) + 13)
                        .attr('y', y(dot.id) + 3)

                    tooltipRect
                        .attr('width', textWidth)
                        .attr('height', 16)
                        .attr('x', x(dot.ratio_2019) + 10)
                        .attr('y', y(dot.id) - 8)
                }
            })
            .on("mouseout", function(d, dot) {
                // Clearing the tooltip and reverting the line and dot back to their normal sizes
                tooltipRect.transition().duration(200).style('opacity', '0');    
                tooltipText.transition().duration(200).style('opacity', '0'); 

                // Line animation
                svg.select("#" + dot.id).transition()
                    .duration(200).attr("stroke-width", 2)

                d3.select(this)
                    .transition()
                    .attr("r", radius2019);
            });

    // Create the circles for the 2010 values
    var radius2010 = 2;
    svg.append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
            .attr("cx", function (d) {
                if (!isNaN(d.ratio_2010)) {
                    return x(d.ratio_2010)
                } else {
                    return x(d.ratio_2019);
                }
            })
            .attr("fill", "#8F9CC5")            // The color of the small dots
            .attr("stroke", "#003D84")          // The stroke of the small dots
            .attr("stroke-width", "0.4")
            .attr("cy", d => y(d.id))
            .attr("r", function (d) {
                if (!isNaN(d.ratio_2010)) {
                    return radius2010;
                } else {
                    return 0;
                }
            })
            .on("mouseover", function(d, dot) {
                // Dot animation, but no line animation
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", radius2010 * 2);

                // Adding the tooltip
                let textWidth = BrowserText.getWidth("Ratio: " + d3.format(".2f")(dot.ratio_2010).toString(), 8, 'sans-serif') + 6
                tooltipRect.transition().duration(200).style('opacity', '1');
                tooltipText.transition().duration(200).text("Ratio: " + d3.format(".2f")(dot.ratio_2010)).style('opacity', '1');

                // Positioning the tooltip picking the correct side
                if (dot.ratio_2010 >= dot.ratio_2019) {
                    tooltipText
                        .attr('x', x(dot.ratio_2010) + 13)
                        .attr('y', y(dot.id) + 3)

                    tooltipRect
                        .attr('width', textWidth)
                        .attr('height', 16)
                        .attr('x', x(dot.ratio_2010) + 10)
                        .attr('y', y(dot.id) - 8) 
                } else {
                    tooltipText
                        .attr('x', x(dot.ratio_2010) - 46)
                        .attr('y', y(dot.id) + 3)

                    tooltipRect
                        .attr('width', textWidth)
                        .attr('height', 16)
                        .attr('x', x(dot.ratio_2010) - 49)
                        .attr('y', y(dot.id) - 8) 
                }
                 
            })
            .on("mouseout", function(d, dot) {
                // Clearing the tooltip and reverting the line and dot back to their normal sizes
                tooltipRect.transition().duration(200).style('opacity', '0');    
                tooltipText.transition().duration(200).style('opacity', '0');      

                d3.select(this)
                    .transition()
                    .attr("r", radius2010);
            });

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
});