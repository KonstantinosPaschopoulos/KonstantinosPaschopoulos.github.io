// The only difference between the two chord chart scripts is the CSV used and the countries that are present in the CSV file
d3.csv("../DATA_VIZ/TEST_CSV/df_4_1.csv", function (d) {
    return {
        or: d.or,
        DE: +d.DE,
        FR: +d.FR,
        ES: +d.ES,
        IT: +d.IT,
        NL: +d.NL,
        SE: +d.SE,
        AT: +d.AT,
        BE: +d.BE,
        UK: +d.UK
    };
})
.then(function (data) {
    // Function to fix the data for the d3.chord() function
    function formatData(dataset) {
        // First I turn the array of objects into an array of arrays
        var arrayResult = dataset.map(Object.values);

        for (let index = 0; index < arrayResult.length; index++) {
            // Remove the 'or' attribute from the arrays
            arrayResult[index].shift(1);

            // Change the diagonal NaN values to 0
            arrayResult[index][index] = 0;
        }

        return arrayResult
    }

    // The tooltip code
    var tooltip = d3.select('body')
        .append('div')
        .attr('class', 'd3-tooltip')
        .style("font-size", "8px")
        .style("font-family", "sans-serif")
        .style('position', 'absolute')
        .style('z-index', '10')
        .style('visibility', 'hidden')
        .style('padding', '4px')
        .style('background', 'rgba(0,0,0,0.6)')
        .style('border-radius', '4px')
        .style('color', '#fff')
        .text('a simple tooltip');

    // returns an event handler for fading all chords not belonging to a specific group
    function groupFade(d, group, opacity) {
        svg.selectAll(".chords path")
            .filter(function(d) { return d.source.index != group.index
                                      && d.target.index != group.index; })
            .transition()
            .style("opacity", opacity);

        groupTip(d, group, opacity);
    }

    // Deals with rendering the tooltip for a group
    function groupTip(d, group, opacity) {
        if (opacity == 1) {
            tooltip.html(``).style('visibility', 'hidden');
        } else {
            tooltip
                .html(
                  `<div>${data[group.index].or} (total): ${d3.sum(matrixData[group.index])}</div>`
                )
                .style('visibility', 'visible');

            tooltip
                .style('left', d.pageX + 10 + 'px')
                .style('top', d.pageY - 20 + 'px');
        }    
    }

    // returns an event handler for fading all chords except for the one given
    function chordFade(d, chord, opacity) {
        svg.selectAll(".chords path")
            .filter(function(d) { return d.source.index != chord.source.index
                                      || d.target.index != chord.target.index;
            })
            .transition()
            .style("opacity", opacity);
        
        chordTip(d, chord, opacity);
    }

    // Deals with rendering the tooltip for a single chord
    function chordTip(d, chord, opacity) {
        if (opacity == 1) {
            tooltip.html(``).style('visibility', 'hidden');
        } else {
            tooltip
                .html(
                  `<div>${data[chord.source.index].or} &rarr; ${data[chord.target.index].or}: ${matrixData[chord.source.index][chord.target.index]}</div>
                  <div>${data[chord.target.index].or} &rarr; ${data[chord.source.index].or}: ${matrixData[chord.target.index][chord.source.index]}</div>`
                )
                .style('visibility', 'visible');

            tooltip
                .style('left', d.pageX + 10 + 'px')
                .style('top', d.pageY - 20 + 'px');
        }   
    }

    var width = 530;
    var height = 530;

    // This variable isused to automatically change the colors of the chart
    var RM = "CAT";

    // Calculating the size of the chart
    var innerRadius = Math.min(width, height) * 0.5 - 125;
    var outerRadius = innerRadius + 15;

    // Setting up two maps for the colors. The first one has the lightest one and the second the darkest one
    var colorsEnd = new Map([
        ["CAT", "#f9f7fa"],
        ["ELT", "#fdfaf1"],
        ["ALT", "#fafbf7"],
        ["SMO", "#fefaf7"],
        ["INF", "#f8fafc"],
        ["NTM", "#fcf8f9"],
        ["VDM", "#f6f9f9"]
    ]);

    var colorsStart = new Map([
        ["CAT", "#5f4d7b"],
        ["ELT", "#80713e"],
        ["ALT", "#66763d"],
        ["SMO", "#a16d3e"],
        ["INF", "#445e81"],
        ["NTM", "#8d4b58"],
        ["VDM", "#305e62"]
    ]);

    // Create the SVG object
    const svg = d3.select("div.chord_rni")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);       // Put chart in the middle

    // Country names
    var names = data.columns;
    names = names.slice(1);

    // Generate the color scale, using the maps from above and the amount of names
    var colorScale = d3.scaleLinear()
        .domain([0, names.length])
        .interpolate(d3.interpolateHcl)
        .range([colorsStart.get(RM), colorsEnd.get(RM)])

    // Reformat the data to the format used by the chord function
    var matrixData = formatData(data);

    // Build the chords
    var chords = d3.chord()
        .padAngle(5 / innerRadius)
        .sortSubgroups(d3.descending)
        (matrixData);

    const group = svg.append("g")
            .attr("font-size", 8)
            .attr("font-family", "sans-serif")
        .selectAll("g")
        .data(chords.groups)
        .join("g");

    // Adding the ticks
    var tickStep = d3.tickStep(0, d3.sum(matrixData.flat()), 50)
    function ticks({startAngle, endAngle, value}) {
        const k = (endAngle - startAngle) / value;
        return d3.range(0, value, tickStep).map(value => {
            return {value, angle: value * k + startAngle};
        });
    }
    var groupTick = group.append("g")
        .selectAll("g")
        .data(ticks)
        .join("g")
          .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);
    groupTick.append("line")
        .attr("stroke", "black")
        .attr("x2", 4);
    groupTick.append("text")
        .attr("x", 6)
        .attr("dy", "0.35em")
        .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-16)" : null)
        .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
        .text(d => d.value);
        
    // Adding the sourounding arc over the ticks
    var arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);
    group.append("path")
        .attr("fill", (d, i) => colorScale(i))
        .attr("stroke", (d, i) => colorScale(i))
        .attr("d", arc)
        .on("mouseover", function(d, group) {
              return groupFade(d, group, 0.2);
          })
        .on("mouseout", function(d, group) {
            return groupFade(d, group, 1);
        });

    // Add the ribbons
    var ribbon = d3.ribbon()
        .radius(innerRadius);
    svg.append("g")
          .attr("class", "chords")
          .attr("fill-opacity", 0.9)
          .attr("stroke-opacity", 0.7)
          .attr("stroke-width", 0.5)
        .selectAll("path")
        .data(chords)
        .join("path")
          .attr("fill", function (d) {
            return colorScale(d.target.index)
          })
          .attr("stroke", colorsStart.get(RM))
          .attr("d", ribbon)
          .on("mouseover", function(d, chord) {
                return chordFade(d, chord, 0.2);
            })
          .on("mouseout", function(d, chord) {
              return chordFade(d, chord, 1);
          });

    // Add the names of the countries
    group.append("text")
        .each(d => (d.angle = (d.startAngle + d.endAngle) / 2))
        .attr("dy", "0.35em")
        .attr("transform", d => `
          rotate(${(d.angle * 180 / Math.PI - 90)})
          translate(${outerRadius + 35})
          ${d.angle > Math.PI ? "rotate(180)" : ""}
        `)
        .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
        .attr("font-size", 18)
        .text(d => names[d.index]);
});