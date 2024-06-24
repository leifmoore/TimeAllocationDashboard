document.addEventListener('DOMContentLoaded', function () {
    // Select DOM elements
    const sliders = document.querySelectorAll('input[type="range"]');
    const resetButton = document.getElementById('resetButton');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const totalDisplay = document.getElementById('totalValue');
    const pieButton = document.getElementById('pieButton');
    const doughnutButton = document.getElementById('doughnutButton');
    const barButton = document.getElementById('barButton');
    const chartCanvas = document.getElementById('myChart').getContext('2d');

    // Default values for sliders
    const defaultValues = {
        productDesign: 40,
        productDevelopment: 15,
        projectManagement: 10,
        stakeholderCommunication: 10,
        continuousLearning: 10,
        marketingStrategy: 15,
    };

    // Current values for sliders
    let currentValues = { ...defaultValues };

    // Color configuration for the chart using CSS variables
    const colors = {
        productDesign: getComputedStyle(document.documentElement).getPropertyValue('--chart-product-design').trim(),
        productDevelopment: getComputedStyle(document.documentElement).getPropertyValue('--chart-product-development').trim(),
        projectManagement: getComputedStyle(document.documentElement).getPropertyValue('--chart-project-management').trim(),
        stakeholderCommunication: getComputedStyle(document.documentElement).getPropertyValue('--chart-stakeholder-communication').trim(),
        continuousLearning: getComputedStyle(document.documentElement).getPropertyValue('--chart-continuous-learning').trim(),
        marketingStrategy: getComputedStyle(document.documentElement).getPropertyValue('--chart-marketing-strategy').trim(),
    };

    // Current chart type
    let currentChartType = 'pie';
    let chart = new Chart(chartCanvas, getChartConfig('pie'));

    // Add event listeners to sliders
    sliders.forEach(slider => {
        slider.addEventListener('input', function () {
            updateValues(slider.id, parseInt(slider.value));
            updateUI();
        });
    });

    // Reset button event listener
    resetButton.addEventListener('click', function () {
        currentValues = { ...defaultValues };
        updateUI();
    });

    // Dark mode toggle event listener
    darkModeToggle.addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');
    });

    // Chart type buttons event listeners
    pieButton.addEventListener('click', function () {
        switchChartType('pie');
    });

    doughnutButton.addEventListener('click', function () {
        switchChartType('doughnut');
    });

    barButton.addEventListener('click', function () {
        switchChartType('bar');
    });

    // Function to switch chart type
    function switchChartType(type) {
        if (currentChartType !== type) {
            currentChartType = type;
            chart.destroy();
            chart = new Chart(chartCanvas, getChartConfig(type));
            updateUI();
        }
    }

    // Function to get chart configuration based on the type
    function getChartConfig(type) {
        if (type === 'bar') {
            return {
                type: 'bar',
                data: {
                    labels: Object.keys(currentValues).map(key => key.replace(/([A-Z])/g, ' $1').trim()),
                    datasets: [
                        {
                            label: 'Current',
                            data: Object.values(defaultValues),
                            backgroundColor: 'rgba(0, 123, 255, 0.5)',
                        },
                        {
                            label: 'Projected',
                            data: Object.values(currentValues),
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        },
                    ],
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                        },
                    },
                },
            };
        } else {
            return {
                type: type,
                data: {
                    labels: Object.keys(currentValues).map(key => key.replace(/([A-Z])/g, ' $1').trim()),
                    datasets: [{
                        data: Object.values(currentValues),
                        backgroundColor: Object.values(colors),
                    }],
                },
                options: {
                    responsive: true,
                },
            };
        }
    }

    // Function to update slider values and ensure the total is 100%
    function updateValues(changedSliderId, newValue) {
        const oldValue = currentValues[changedSliderId];
        const difference = newValue - oldValue;
        const remainingTotal = 100 - newValue;

        currentValues[changedSliderId] = newValue;

        // Calculate the total of the remaining sliders
        const totalOtherSliders = Object.keys(currentValues)
            .filter(id => id !== changedSliderId)
            .reduce((sum, id) => sum + currentValues[id], 0);

        // Adjust the other sliders proportionally
        Object.keys(currentValues)
            .filter(id => id !== changedSliderId)
            .forEach(id => {
                if (totalOtherSliders === 0) {
                    currentValues[id] = remainingTotal / (Object.keys(currentValues).length - 1);
                } else {
                    currentValues[id] = (currentValues[id] / totalOtherSliders) * remainingTotal;
                }
            });

        // Ensure rounding keeps the total at 100%
        roundTotalTo100(changedSliderId);
        sanityCheck();
    }

    // Function to round the total values to 100%
    function roundTotalTo100(changedSliderId) {
        let total = Math.round(Object.values(currentValues).reduce((a, b) => a + b, 0));
        let difference = 100 - total;

        if (difference !== 0) {
            const key = changedSliderId !== 'continuousLearning' ? 'continuousLearning' : Object.keys(currentValues).find(id => id !== changedSliderId);
            currentValues[key] += difference;
        }
    }

    // Sanity check function to ensure total equals 100%
    function sanityCheck() {
        let SliderTotal = Math.round(Object.values(currentValues).reduce((a, b) => a + b, 0));
        let difference = 100 - SliderTotal;

        if (difference !== 0) {
            let key = 'continuousLearning';
            if (currentValues[key] + difference < 0) {
                key = Object.keys(currentValues).find(id => id !== 'continuousLearning' && currentValues[id] + difference >= 0);
            }
            currentValues[key] += difference;
        }

        // Final adjustment to ensure displayed total is exactly 100%
        finalAdjustment();
    }

    // Final adjustment function to correct minor discrepancies
    function finalAdjustment() {
        let total = Math.round(Object.values(currentValues).reduce((a, b) => a + b, 0));
        let difference = 100 - total;

        if (difference !== 0) {
            const key = 'continuousLearning';
            currentValues[key] += difference;
        }
    }

    // Function to get color based on slider value
    function getColor(value, defaultValue) {
        const defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--default-text-color').trim();
        const increasedColor = getComputedStyle(document.documentElement).getPropertyValue('--increased-text-color').trim();
        const decreasedColor = getComputedStyle(document.documentElement).getPropertyValue('--decreased-text-color').trim();

        if (value > defaultValue) {
            // Transition from green to red as value increases
            const ratio = (value - defaultValue) / (100 - defaultValue);
            const red = Math.min(255, Math.floor(255 * ratio));
            const green = Math.max(0, Math.floor(255 * (1 - ratio)));
            return `rgb(${red}, ${green}, 0)`;
        } else {
            // Transition from green to blue as value decreases
            const ratio = value / defaultValue;
            const green = Math.min(255, Math.floor(255 * ratio));
            const blue = Math.max(0, Math.floor(255 * (1 - ratio)));
            return `rgb(0, ${green}, ${blue})`;
        }
    }

    // Function to update the UI with current values
    function updateUI() {
        Object.keys(currentValues).forEach(id => {
            document.getElementById(id).value = currentValues[id];
            const displayValue = Math.round(currentValues[id]);
            const displayColor = getColor(displayValue, defaultValues[id]);
            document.getElementById(id + 'Value').innerText = displayValue + '%';
            document.getElementById(id + 'Value').style.color = displayColor;
        });

        const total = Math.round(Object.values(currentValues).reduce((a, b) => a + b, 0));
        totalDisplay.innerText = total + '%';

        if (currentChartType === 'bar') {
            chart.data.datasets[1].data = Object.values(currentValues);
        } else {
            chart.data.datasets[0].data = Object.values(currentValues);
        }
        chart.update();
    }

    // Initial UI update
    updateUI();
});
