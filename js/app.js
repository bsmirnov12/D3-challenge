/** ********************************
 *           Global Constants
 ********************************** */

const xChoices = ['poverty', 'age', 'income'];
const yChoices = ['healthcare', 'smokes', 'obesity'];

// Labels for Axes
const labels = {
    poverty: "In Poverty (%)",
    age: "Age (Median)",
    income: "Household Income (Median)",
    healthcare: "Lacks Healthcare (%)",
    obesity: "Obese (%)",
    smokes: "Smokes (%)"
};

// Tootltip templates
const templateBits = {
    state: "`${d.state}`",
    poverty: "`Poverty: ${d.poverty}%`",
    age: "`Age: ${d.age}`",
    income: "`Income: ${d.income}`",
    healthcare: "`Healthcare: ${d.healthcare}%`",
    obesity: "`Obese: ${d.obesity}%`",
    smokes: "`Smokes: ${d.smokes}%`"
};

// ============
//   Plot box
// ============

const plotWidth = 960;
const plotHeight = 800;

const margins = {
    top: 20,
    right: 20,
    bottom: 100,
    left: 100
};

const width  = plotWidth  - margins.left - margins.right;
const height = plotHeight - margins.top  - margins.bottom;


/** ********************************
 *           Global Variables
 ********************************** */

// Loaded data is referenced via this variable
var table = [];

// Axis choices (column names from the dataset)
var xChoice = xChoices[0];
var yChoice = yChoices[0];

// SVG wrapper for the whole chart
var svg = d3.select("#scatter")
    .append("svg")
        .attr("width", plotWidth)
        .attr("height", plotHeight);

// SVG group containing all the chart elements (axes, labels, circles)
var chartGroup = svg.append("g")
    .attr("transform", `translate(${margins.left}, ${margins.top})`);

// Labels group for X-axis
var xLabelsGroup = chartGroup.append("g")
        .attr("transform", `translate(${width / 2}, ${height + 20})`);

// Labels group for Y-axis
var yLabelsGroup = chartGroup.append("g")
        .attr("transform", `rotate(-90) translate(${-height / 2}, 0)`);

// Group of circles and internal text
var circlesGroup = chartGroup.append("g").attr('id', 'circles');

// Axes (DOM-nodes in Chart Group)
var xAxis = null;
var yAxis = null;

// Scales. Need them to scatter dots over the plot
var xScale = null;
var yScale = null;


/** ********************************
 *            Main part
 ********************************** */

/**
 * Render X-axis
 * @param {String} choice - column name of the dataset (from xChoices array)
 */
function renderXAxis(choice) {
    // Step 1. Build scale (domain and range)
    xScale = d3.scaleLinear()
        .domain([
            d3.min(table, row => row[choice]) * 0.95,
            d3.max(table, row => row[choice]) * 1.05
        ])
        .range([0, width]);

    // Step 2. Create new Axis
    let newAxis = d3.axisBottom(xScale);

    // Step 3. Add the axis to the Chart Group, but if it already exists make transition from old to new one
    if (xAxis) { // Transition to new axis
        xAxis.transition()
            .duration(1000)
            .call(newAxis);
    } else { // Create new axis
        xAxis = chartGroup.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(newAxis)
    }

    // Step 4. Create or Update labels
    xLabelsGroup.selectAll('text')
        .data(xChoices)
        .join('text')
            .attr("x", 0)
            .attr("y", (_, i) => 20 * (i + 1))
            .classed("axisText", true)
            .classed("active", label => label === choice)
            .classed("inactive", label => label !== choice)
            .text(label => labels[label])

    // Step 5. Save new choice
    xChoice = choice;
}

/**
 * Render Y-axis
 * @param {String} choice - column name of the dataset (from yChoices array)
 */
function renderYAxis(choice) {
    // Step 1. Build scale (domain and range)
    yScale = d3.scaleLinear()
        .domain([
            d3.min(table, row => row[choice]) * 0.8,
            d3.max(table, row => row[choice]) * 1.05
        ])
        .range([height, 0]);

    // Step 2. Create new Axis
    let newAxis = d3.axisLeft(yScale);

    // Step 3. Add the axis to the Chart Group, but if it already exists make transition from old to new one
    if (yAxis) {
        yAxis.transition()
            .duration(1000)
            .call(newAxis);
    } else {
        yAxis = chartGroup.append("g").call(newAxis);
    }

    // Step 4. Create or Update labels
    yLabelsGroup.selectAll('text')
        .data(yChoices)
        .join('text')
            .attr("x", 0)
            .attr("y", (_, i) => -20 * (i + 1))
            .attr("dy", "-1em")
            .classed("axisText", true)
            .classed("active", label => label === choice)
            .classed("inactive", label => label !== choice)
            .text(label => labels[label]);

    // Step 5. Save new choice
    yChoice = choice;
}

/**
 * Move around the circles depending on the chosen labels
 * This function relies on global variables xChoice and yChoice
 */
function renderCircles() {
    circlesGroup.selectAll("g")
        .data(table)
        .transition()
        .duration(1000)
            .attr("transform", row => `translate(${xScale(row[xChoice])}, ${yScale(row[yChoice])})`);
}

/**
 * Label click handler: determines which axis needs to be redefined and calls corresponding renderer
 * @param {String} newChoice - choice value from one of xChoices or yChoices
 */
function labelClickHandler(newChoice) {
    let oldChoice, renderAxis;

    // Find out which axis generated the event and choose corresponding axis renderer
    if (xChoices.includes(newChoice)) {
        oldChoice = xChoice;
        renderAxis = renderXAxis;
    } else {
        oldChoice = yChoice;
        renderAxis = renderYAxis;
    }

    // Check if we need to do anything
    if (newChoice !== oldChoice) { // yes, we do
        renderAxis(newChoice);
        renderCircles();
    }
}

/**
 * Randomly return 0 or function parameter
 * @param {integer} n - some number
 * @return {integer} - with 50% probability 0 or n
 */
function rnd(n) { return Math.round(Math.random()) < 0.5 ? 0 : n; }

/** ********************************
 * Loading data and initialization
 ********************************** */

d3.csv("data/data.csv").then((data, error) => {
    if (error) {
        alert('Failed to load data.');
        console.log(error);
        return;
    }

    // Store loaded data into the global variable
    table = data;

    // Parse numeric values
    table.forEach(row => {
        row.poverty = +row.poverty;
        row.age = +row.age;
        row.income = +row.income;
        row.healthcare = +row.healthcare;
        row.obesity = +row.obesity;
        row.smokes = +row.smokes;
    });

    // Create axes
    renderXAxis(xChoice);
    renderYAxis(yChoice);

    // Create circles
    const r = 12;
    let movingGroups = circlesGroup.selectAll("g")
        .data(table)
        .join("g")
            .attr("transform", d => `translate(${rnd(width)}, ${rnd(height)})`)
            .html(d => `<circle class="stateCircle" cx="0" cy="0" r="${r}" />
                        <text class="stateText" x="0" y="${r*5/12}" opacity="1" text-anchor="middle">${d.abbr}</text>`);
    
    // Render circles
    renderCircles();

    // Initialize tooltips
    let tooltip = d3.tip()
        .attr("class", "d3-tip")
        .offset([80, -60])
        .html(d => `${d.state}<br>${eval(templateBits[xChoice])}<br>${eval(templateBits[yChoice])}`);

    chartGroup.call(tooltip);
    movingGroups.on("mouseover", d => { tooltip.show(d); }).on("mouseout", tooltip.hide);

    // Install label click handlers
    xLabelsGroup.selectAll('text').on('click', labelClickHandler);
    yLabelsGroup.selectAll('text').on('click', labelClickHandler);

}).catch(error => { console.log(error); });
