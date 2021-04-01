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

d3.csv("../DATA_VIZ/TEST_CSV/df_1_1.csv").then(function(data) {
  data.forEach(function(d) {
    d.label = d.ongoing.toUpperCase() + " " + "PROJECTS";   // Fixing the labels
    d.rVal = +d.eu_contribution;
    d.xVal = +d.x;
    d.yVal = +d.y;
  });

  var width = 272;
  var height = 200;
  var margin = ({ top: 45, right: 15, bottom: 0, left: 15 });

  // To easily assign the colors
  var circleFill = "#7e66a4";
  var circleStroke = "#5f4d7b";
  var textFill = "#ffffff";
  var titleFill = "#635395";
  var lineStroke = '#473C69';

  // Creating a scale for the radius of the circles, based on the amount of projects
  var rscale = d3.scaleSqrt().domain([0, d3.max(data, d => d.rVal)]).range([0, width/4 - 10]);

  // Create the axis, we need to calculate using not only the margins but the radius of the first and last circle
  x = d3.scaleOrdinal()
      .domain(d3.extent(data, d => d.xVal))
      .range([margin.left + rscale(data[0].rVal), width - margin.right - rscale(data[1].rVal)]);

  // Creating the svg container
  var svg = d3.select("div.eu_contribution")
              .append("svg")
              .attr("width", width)
              .attr("height", height);

  // Attach the data for the circles
  var elem = svg.selectAll("g")
      .data(data);

  // Create and place the "blocks" containing the circle, the values inside them and the vertical line
  var elemEnter = elem.enter()
      .append("g")
      .attr("transform", function (d) {
          return `translate(${x(d.xVal)}, ${margin.top})`
      }
  );

  // Create the circle for each block
  elemEnter.append("circle")
      .attr("r", d => rscale(d.rVal))
      .attr("fill", circleFill)
      .attr("cy", d => rscale(d.rVal))
      .attr("stroke", circleStroke)
      .attr("stroke-width", 6);

  // Adding the text inside the circle
  elemEnter.append("text")
    .text(function(d) {
      return (d.rVal + "M€");
    })
    .attr("dy", d => rscale(d.rVal))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("font-family", "sans-serif")
    .attr("font-weight", "bold")
    .attr("font-size", d => rscale(d.rVal)/2)
    .attr("fill", textFill);

  // Adding the vertical line going to the title
  elemEnter.append("line")
    .attr("x1", function (d){
      return -(rscale(d.rVal)/5);
    })
    .attr("x2", function (d){
      return -(rscale(d.rVal)/5);
    })
    .attr("y1", d => {return rscale(d.rVal) - rscale(d.rVal)/4})
    .attr("y2", -30)
    .attr("stroke", lineStroke);

  // Create a seperate element for the titles to deal with the positioning issues
  var titleElem = elem.enter()
      .append("g")
      .attr("transform", function (d, i) {
        // Checking to see if the text above the circles is bigger then the circles and ends up outside the borders of the SVG
        let remain = BrowserText.getWidth(d.label, 12, 'sans-serif')/2 - rscale(d.rVal)
        if (remain > 0) {
          if (i == 0)
            return `translate(${x(d.xVal) + remain}, ${margin.top})`
          else
            return `translate(${x(d.xVal) - remain}, ${margin.top})`
        } else {
          if (i == 0)
            return `translate(${x(d.xVal)}, ${margin.top})`
          else
            return `translate(${x(d.xVal)}, ${margin.top})`
        }

      }
  );

  // Adding the text above the bubbles
  titleElem.append("text")
    .attr("dy", -38)
    .text(d => d.label)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("fill", titleFill);

  // Adding the horizontal line under the title
  titleElem.append("line")
    .attr("x1", d => -BrowserText.getWidth(d.label, 10, 'sans-serif')/2)
    .attr("x2", d => BrowserText.getWidth(d.label, 10, 'sans-serif')/2)
    .attr("y1", -30)
    .attr("y2", -30)
    .attr("stroke", lineStroke);
  });