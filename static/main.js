// custom javascript

$(function() {
    d3.select(window).on("resize", handleResize);

    // When the browser loads, loadChart() is called
    createGraph();
    
  });

function handleResize() {
    var svgArea = d3.select("svg");

    // If there is already an svg container on the page, remove it and reload the chart
    if (!svgArea.empty()) {
        svgArea.remove();
        createGraph();
    }
}

function createGraph() {
    var winHeight = window.innerHeight;
    var conWidth = d3.select(".container").node().getBoundingClientRect().width;
    var conHeight = d3.select(".container").node().getBoundingClientRect().height + 10;

    var margin = {
      top: 20,
      right: 50,
      bottom: 50,
      left: 30
    };

    var chartWidth = conWidth - margin.left - margin.right;
    var chartHeight = winHeight - conHeight - margin.top - margin.bottom;
  
    var svg = d3.select("#chart").append("svg")
          .attr("height", winHeight-conHeight)
          .attr("width", conWidth);
  
    var chartGroup = svg.append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`);

    var parseTime = d3.timeParse("%-m/%-d/%y");
  
    d3.json('/data').then(function(data){
        // version 1
        // source: https://www.hepatitisc.uw.edu/go/management-cirrhosis-related-complications/liver-transplantation-referral/calculate-meld-score
        // MELD(i) = round[ 0.378 * loge(bilirubin)) + (1.120*loge(INR)) + (0.957*loge(creatinine)) + 0.643 ] * 10(rounded to the tenth decimal place.)
        // MELD = MELD(i) + 1.32 * (137-Na) - [0.033*MELD(i)*(137-Na)]
        //Notes
        //This version of the MELD calculator includes United Network for Organ Sharing (UNOS) modifications of the original model.
        //The MELD utlizes log scale calculations and thus any value less than 1 is automatically given a lower limit value of 1 to prevent generating a negative score.
        //The lower limit of Serum Sodium (Na) is capped at 125, and the upper limit is capped at 137.
        //The upper limit of serum creatinine is capped at 4; in addition, if the patient had dialysis at least twice in the past week, the value for serum creatinine will be automatically adjusted to 4.0.
        //The maximum MELD score is 40.

        // source: https://en.wikipedia.org/wiki/Model_for_End-Stage_Liver_Disease
        //MELD = 3.78×ln[serum bilirubin (mg/dL)] + 11.2×ln[INR] + 9.57×ln[serum creatinine (mg/dL)] + 6.43

        // version 2
        // source: https://www.merckmanuals.com/medical-calculators/MELDNa.htm
        // MELDscore = 10 * ((0.957 * ln(Creatinine)) + (0.378 * ln(Bilirubin)) + (1.12 * ln(INR))) + 6.43
        // MELDNascore = MELDscore - SerumNa - (0.025 * MELDscore * (140 - SerumNa)) + 140

        // version 3
        // source: https://www.mdcalc.com/meld-score-model-end-stage-liver-disease-12-older#evidence
        // MELD(i) = 0.957 × ln(Cr) + 0.378 × ln(bilirubin) + 1.120 × ln(INR) + 0.643
        // Then, round to the tenth decimal place and multiply by 10. 
        // If MELD(i) > 11, perform additional MELD calculation as follows:
        // MELD = MELD(i) + 1.32 × (137 – Na) –  [ 0.033 × MELD(i) × (137 – Na) ]

        var dates = data.dates;

        dates.forEach(function(d) {
            d.date = parseTime(d.date);
            d.bilirubin = +d.bilirubin;
            d.creatinine = +d.creatinine;
            d.sodium = +d.sodium;
            d.inr = +d.inr;
          });

        // version 3
        dates.forEach(function(d) {
            if (d.creatinine > 0 && d.bilirubin > 0 && d.inr > 0){
                cr = d.creatinine < 1 ? 1 : d.creatinine;
                inr = d.inr < 1 ? 1 : d.inr;
                bi = d.bilirubin < 1 ? 1 : d.bilirubin;
                d.meld1 = (10 * parseFloat(0.957 * Math.log(cr) + 0.378 * Math.log(bi) + 1.12 * Math.log(inr) + 0.643).toFixed(1));
            }
            else {d.meld1 = 0;}
        });

        dates.forEach(function(d) {
            if (d.meld1 > 11 && d.sodium > 0) {
                var na = d.sodium;
                if (d.sodium < 125) {
                    na = 125;
                }
                else if (d.sodium > 137) {
                    na = 137;
                }
                d.meld2 = parseFloat((d.meld1+1.32*(137-na)-(0.033*d.meld1*(137-na))).toFixed(1));
            }
            else {d.meld2 = d.meld1;}
        });


        // version 2
        // dates.forEach(function(d) {
        //     if (d.creatinine > 0 && d.bilirubin > 0 && d.inr > 0){
        //         d.meld1 = (10 * ((0.957 * Math.log(d.creatinine)) + (0.378 * Math.log(d.bilirubin)) + (1.12 * Math.log(d.inr))) + 6.43);
        //     }
        //     else {d.meld1 = 0;}
        // });

        // dates.forEach(function(d) {
        //     if (d.meld1 > 0 && d.sodium > 0) {
        //         d.meld2 = parseFloat((d.meld1 - d.sodium - (0.025 * d.meld1 * (140 - d.sodium)) + 140).toFixed(1));
        //     }
        //     else {d.meld2 = 0;}
        // });

        // version 1
        // dates.forEach(function(d) {
        //     if (d.creatinine > 0 && d.bilirubin > 0 && d.inr > 0){
        //         d.meld1 = parseFloat((((0.378*Math.log(d.bilirubin)) + (1.12*Math.log(d.inr)) + (0.957*Math.log(d.creatinine)) + 0.643) * 10).toFixed(1));
        //     }
        //     else {d.meld1 = 0;}
        // });

        // dates.forEach(function(d) {
        //     if (d.meld1 > 0 && d.sodium > 0) {
        //         d.meld2 = parseFloat((d.meld1+1.32*(137-d.sodium)-(0.033*d.meld1*(137-d.sodium))).toFixed(1));
        //     }
        //     else {d.meld2 = 0;}
        // });


        var xTimeScale = d3.scaleTime()
            .range([0, chartWidth])
            .domain(d3.extent(dates, data => data.date));

        var yLinearScale = d3.scaleLinear()
            .range([chartHeight, 0])
            .domain([0, d3.max(dates, data => data.meld2)]);
            
        var bottomAxis = d3.axisBottom(xTimeScale);
        var leftAxis = d3.axisLeft(yLinearScale);
          
        var drawLine = d3
            .line()
            .defined(data => data.meld2 > 0)
            .x(data => xTimeScale(data.date))
            .y(data => yLinearScale(data.meld2));
        
        chartGroup.append("path")
            .datum(dates.filter(drawLine.defined()))
            .attr("d", drawLine)
            .style("stroke-dasharray", ("3, 3"))
            .classed("line", true);
        
        chartGroup.append("path")
            .datum(dates)
            .classed("line", true)
            .attr("d", drawLine);
        
        chartGroup.append("g")
            .classed("axis", true)
            .call(leftAxis);
        
        chartGroup.append("g")
            .classed("axis", true)
            .attr("transform", "translate(0, " + chartHeight + ")")
            .call(bottomAxis);

        var circlesGroup = chartGroup.selectAll("circle")
            .data(dates.filter(drawLine.defined()))
            .enter()
            .append("circle")
            .attr("cx", d => xTimeScale(d.date))
            .attr("cy", d => yLinearScale(d.meld2))
            .attr("r", "8")
            .attr("fill", "gold");

            var dateFormatter = d3.timeFormat("%-m/%-d/%y");

            var toolTip = d3.tip()
              .attr("class", "tooltip")
              .offset([50, 70])
              .html(function(d) {
              return (`<h4>${dateFormatter(d.date)}: ${d.meld2}</h4><hr><p>bilirubin: ${d.bilirubin}<br>creatinine: ${d.creatinine}<br>INR: ${d.inr}<br>sodium: ${d.sodium}</p>`);
              });
      
            chartGroup.call(toolTip);
      
            circlesGroup.on("mouseover", function(d) {
              toolTip.show(d, this);
            })
              .on("mouseout", function(d) {
                toolTip.hide(d);
              });
          
        }).catch(function(error) {
        console.log(error);          
    });
}
  