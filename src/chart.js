export default class Chart {
    constructor() {
        this.chart = AmCharts.makeChart('chartdiv', {
            type: 'serial',
            theme: 'light',
            marginRight: 80,
            autoMarginOffset: 20,
            marginTop: 7,
            dataProvider: [],
            valueAxes: [
                {
                    axisAlpha: 0.2,
                    dashLength: 1,
                    position: 'left'
                }
            ],
            mouseWheelZoomEnabled: true,
            graphs: [
                {
                    id: 'g1',
                    balloonText: '[[value]]',
                    bullet: 'round',
                    bulletBorderAlpha: 1,
                    bulletColor: '#FFFFFF',
                    hideBulletsCount: 50,
                    title: 'red line',
                    valueField: 'speed',
                    useLineColorForBulletBorder: true
                }
            ],
            chartScrollbar: {
                autoGridCount: true,
                graph: 'g1',
                scrollbarHeight: 40
            },
            chartCursor: {
                limitToGraph: 'g1'
            },
            categoryField: 'time',
            categoryAxis: {
                axisColor: '#DADADA',
                dashLength: 1,
                minorGridEnabled: true
            }
        });
    }
    updateChartData(newArr) {
        this.chart.dataProvider = newArr;
        this.chart.validateData();
    }
}
