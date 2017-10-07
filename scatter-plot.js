const createLogFunc = func => {
    return (...args) => {
        func(...args);
        return args[0];
    }
}
const info = createLogFunc(R.bind(console.log, console));
// const info = createLogFunc(() => {});
const warning = createLogFunc(R.bind(console.log, console));

const update = (data, inConfig) => {
    const config = completeConfigWithDefaultValues(inConfig);
    const svg = makeSvgScatterPlot(data, config);
    updateData(data);
    updateVisualization(svg);
    updateCustomizations(config);
    updateCode(svg);
}

const updateData = data => {
    if (R.isNil(data)) {
        $('#data').val('');
    } else {
        $('#data').val(d3.csvFormat(data));
    }
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

const createSvgElement = () => {
    const svg = document.createElementNS(d3.namespaces.svg, 'svg');
    svg.setAttributeNS(
            d3.namespaces.xmlns, "xmlns:xlink", d3.namespaces.xlink);
    return svg;
}

const getPlotArea = config => {
    return {
        width: config.width - config.paddingLeft - config.paddingRight,
        height: config.height - config.paddingTop - config.paddingBottom,
        margins: {
            top: config.paddingTop,
            left: config.paddingLeft,
            bottom: config.paddingBottom,
            right: config.paddingRight
        }
    };
}

const getChartArea = config => {
    return {
        width: config.width,
        height: config.height,
        paddings: {
            top: config.paddingTop,
            left: config.paddingLeft,
            bottom: config.paddingBottom,
            right: config.paddingRight
        }
    };
}

const makeSvgScatterPlot = (data, inConfig) => {
    const config = completeConfigWithDefaultValues(inConfig);

    const svg = createSvgElement();
    if (R.isNil(data) || 0 == data.length) {
        return svg;
    }

    const firstKey = Object.keys(data[0])[0];
    const secondKey = Object.keys(data[0])[1];

    const plotArea = getPlotArea(config);
    const chartArea = getChartArea(config);

    const x = d3.scaleLinear()
        .range([0, plotArea.width])
        .domain(d3.extent(data, d => d[firstKey]));
    const y = d3.scaleLinear()
        .range([plotArea.height, 0])
        .domain(d3.extent(data, d => d[secondKey]));

    const group = d3.select(svg)
            .attr('width', chartArea.width)
            .attr('height', chartArea.height)
        .append('g')
            .attr('transform',
                'translate(' + plotArea.margins.left + ','
                    + plotArea.margins.top + ')');

    // all the circles
    group.selectAll('dot')
            .data(data)
        .enter().append('circle')
            .attr('r', config.pointRadius)
            .attr('cx', d => x(d[firstKey]))
            .attr('cy', d => y(d[secondKey]))
            .attr('fill', d => config.pointColor)

    // x axis
    group.append('g')
            .attr('transform', 'translate(0,' + plotArea.height + ')')
            .call(d3.axisBottom(x));

    // y axis
    group.append('g')
            .call(d3.axisLeft(y));

    info(svg);
    return svg;
};

const loadFlowers = (func) => {
    d3.csv('./flowers.tsv', (error, data) => {
        if (error) throw error;

        data.forEach(d => {
            d.sepalLength = +d.sepalLength;
            d.sepalWidth = +d.sepalWidth;
        });

        func(data);
    })
}

const createLabeledInput = (id, colSize, textSize, label, type, value) => {
    return `
        <div class="col-${colSize}-auto">
            <div class="input-group input-group-${textSize}">
              <span class="input-group-addon">${label}</span>
              <input id="${id}" type="${type}" class="form-control" id="custom-width" aria-describedby="basic-addon3" value="${value}">
            </div>
        </div>
    `;
}

const createLabeledNumberInput = (id, label, value) => {
    return createLabeledInput(id, 'md', 'sm', label, 'number', value);
}

const configSpecs = [
    {
        id: 'chart-width',
        type: 'number',
        label: 'Width',
        key: 'width',
        default: 500
    },
    {
        id: 'chart-height',
        type: 'number',
        label: 'Height',
        key: 'height',
        default: 300
    },
    {
        id: 'chart-padding-top',
        type: 'number',
        label: 'Padding Top',
        key: 'paddingTop',
        default: 20
    },
    {
        id: 'chart-padding-left',
        type: 'number',
        label: 'Padding Left',
        key: 'paddingLeft',
        default: 50,
    },
    {
        id: 'chart-padding-bottom',
        type: 'number',
        label: 'Padding Bottom',
        key: 'paddingBottom',
        default: 30
    },
    {
        id: 'chart-padding-right',
        type: 'number',
        label: 'Padding Right',
        key: 'paddingRight',
        default: 20
    },
    {
        id: 'chart-point-radius',
        type: 'number',
        label: 'Point Radius',
        key: 'pointRadius',
        default: 5
    },
    {
        id: 'chart-point-color',
        type: 'color',
        label: 'Point Color',
        key: 'pointColor',
        default: '#000000'
    }
];

const createDefaultConfigFromSpecs = specs => {
    let config = {};
    R.forEach(spec => {
        config[spec.key] = spec.default;
    }, specs);
    return config;
}

const createCustomizationsUI = () => {
    R.forEach(spec => {
        const elText = createLabeledInput(
                spec.id,
                spec.colSize ? spec.colSize : 'md',
                spec.textSize ? spec.textSize: 'sm',
                spec.label,
                spec.type,
                spec.default);
        $('#customizations').append(elText);
        $('#' + spec.id).change(spec.handler ? spec.handler : inputUpdated);
    }, configSpecs);
}

const gatherConfig = () => {
    let config = {};
    R.forEach(spec => {
        config[spec.key] = $('#' + spec.id).val()
    }, configSpecs);
    return info(config);
}

const completeConfigWithDefaultValues = (inConfig) => {
    const defaultConfig = createDefaultConfigFromSpecs(configSpecs);
    return R.merge(defaultConfig, inConfig);
};

const inputUpdated = () => {
    const text = $('#data').val();
    const data = d3.csvParse(text);
    const config = gatherConfig();
    const svg = makeSvgScatterPlot(data, config);
    updateVisualization(svg);
    updateCode(svg);
}

const main = () => {
    createCustomizationsUI();
    // initialize page with flowers.tsv
    loadFlowers(update);
    // attach events
    $('#data-example').click(R.partial(loadFlowers, [update]));
    $('#data-clear').click(R.partial(update, [null]));
    $('#data-update').click(inputUpdated);
    $('#custom-update').click(inputUpdated);
}

main();