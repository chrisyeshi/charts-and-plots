const trace = (...args) => {
    console.log(...args);
    return args[0];
}

const updateData = data => {
    $('#data').val(d3.csvFormat(data));
}

const updateVisualization = svg => {
    $('#visualization').empty();
    $('#visualization').append(svg);
}

const updateCustomizations = inConfig => {
    const config = completeConfigWithDefaultValues(inConfig);
}

const updateCode = (svg) => {
    $('#code-svg').val(svg.outerHTML);
}

d3.csv('/flowers.tsv', (error, data) => {
    if (error) throw error;

    data.forEach(d => {
        d.sepalLength = +d.sepalLength;
        d.sepalWidth = +d.sepalWidth;
    });

    const config = completeConfigWithDefaultValues();
    const svg = makeSvgScatterPlot(data, config);
    updateData(data);
    updateVisualization(svg);
    updateCustomizations(config);
    updateCode(svg);
});

const completeConfigWithDefaultValues = (inConfig) => {
    const defaultConfig = {
        width: 500,
        height: 300,
        radius: 5,
        paddings: {
            top: 20, right: 20, bottom: 30, left: 50
        },
        get plotArea() {
            return {
                width: this.width - this.paddings.left - this.paddings.right,
                height: this.height - this.paddings.top - this.paddings.bottom,
                margins: this.paddings
            }
        },
        get chartArea() {
            return {
                width: this.width,
                height: this.height,
                paddings: this.paddings
            }
        }
    };
    return R.merge(defaultConfig, inConfig);
};

const createSvgElement = () => {
    const svg = document.createElementNS(d3.namespaces.svg, 'svg');
    svg.setAttributeNS(
            d3.namespaces.xmlns, "xmlns:xlink", d3.namespaces.xlink);
    return svg;
}

const makeSvgScatterPlot = (data, inConfig) => {
    const config = completeConfigWithDefaultValues(inConfig);
    console.log(config);

    const svg = createSvgElement();

    const firstKey = Object.keys(data[0])[0];
    const secondKey = Object.keys(data[0])[1];

    const x = d3.scaleLinear()
        .range([0, config.plotArea.width])
        .domain(d3.extent(data, d => d[firstKey]));
    const y = d3.scaleLinear()
        .range([config.plotArea.height, 0])
        .domain(d3.extent(data, d => d[secondKey]));

    const group = d3.select(svg)
            .attr('width', config.chartArea.width)
            .attr('height', config.chartArea.height)
        .append('g')
            .attr('transform',
                'translate(' + config.plotArea.margins.left + ','
                    + config.plotArea.margins.top + ')');

    // all the circles
    group.selectAll('dot')
            .data(data)
        .enter().append('circle')
            .attr('r', config.radius)
            .attr('cx', d => x(d[firstKey]))
            .attr('cy', d => y(d[secondKey]));

    // x axis
    group.append('g')
            .attr('transform', 'translate(0,' + config.plotArea.height + ')')
            .call(d3.axisBottom(x));

    // y axis
    group.append('g')
            .call(d3.axisLeft(y));

    return svg;
};