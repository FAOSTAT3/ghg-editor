var GHGEDITOR = (function() {

    var CONFIG = {
        data: null
    };

    function init() {
        $('.selector').chosen({
            disable_search_threshold: 10,
            allow_single_deselect: true
        });
        $('input[type="number"]').keyup(function() {
            var v = parseFloat($('#' + this.id).val());
            if (isNaN(v) || v < 0) {
                console.log('unvalid selection @ ' + this.id);
            } else {
                var year = this.id.substring(1 + this.id.indexOf('_'));
                addPointToChart1(year, v);
            }
        });
        queryDB();
    };

    function createCharts() {
        var data = [];
        var year = 1990;
        for (var i = 1 ; i < GHGEDITOR.CONFIG.data.length ; i++) {
            var tmp = [];
            tmp.push(parseInt(year))
            tmp.push(parseFloat(GHGEDITOR.CONFIG.data[i][13]));
            data.push(tmp);
            year++;
        }
        createChart1(data);
    };

    function createChart1(data) {
        var categories = [];
        for (var i = 1990 ; i <= 2015 ; i++)
            categories.push(i);
        GHGEDITOR.CONFIG.chart_1 = $('#chart_1').highcharts({
            title: {
                text: 'Agricultural Total',
                x: -20
            },
            subtitle: {
                text: 'Source: FAOSTAT',
                x: -20
            },
            xAxis: {
                labels: {
                    rotation: -45
                }
            },
            yAxis: {
                title: {
                    text: 'CO<sub>2</sub>Eq (Gg)'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                valueSuffix: ' Gg'
            },
            legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom',
                borderWidth: 0
            },
            series: [{
                name: 'FAOSTAT',
                data: data
            }, {
                name: 'User Data',
                data: []
            }]
        });
    };

    function addPointToChart1() {
        var chart = $('#chart_1').highcharts();
        var data = [];
        var inputs = $('input[type="number"]');
        for (var i = 0 ; i < inputs.length ; i++) {
            var year = inputs[i].id.substring(1 + inputs[i].id.indexOf('_'));
            var value = $(inputs[i]).val();
            var tmp = [];
            tmp.push(parseInt(year));
            tmp.push(parseFloat(value));
            data.push(tmp);
        }
        chart.series[1].setData(data);
    };

    function queryDB() {
        var p = {};
        p.datasource = 'faostat';
        p.domainCode = 'GT';
        p.lang = 'E';
        p.nullValues = true;
        p.thousand = '.';
        p.decimal = ',';
        p.decPlaces = 2;
        p.limit = 100;
        p['list1Codes'] = ['\'48\''];
        p['list2Codes'] = ['\'5058\''];
        p['list3Codes'] = ['\'7231\''];
        p['list4Codes'] = ['\'1990\'', '\'1991\'', '\'1992\'', '\'1993\'', '\'1994\'', '\'1995\'', '\'1996\'', '\'1997\'', '\'1998\'', '\'1999\'',
                           '\'2000\'', '\'2001\'', '\'2002\'', '\'2003\'', '\'2004\'', '\'2005\'', '\'2006\'', '\'2007\'', '\'2008\'', '\'2009\'',
                           '\'2010\'', '\'2011\'', '\'2012\'', '\'2013\'', '\'2014\'', '\'2015\''];
        p['list5Codes'] = [];
        p['list6Codes'] = [];
        p['list7Codes'] = [];
        var data = {};
        data.payload = JSON.stringify(p);
        $.ajax({
            type: 'POST',
            url: 'http://localhost:8080/wds/rest/procedures/data',
            data: data,
            success: function (response) {
                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);
                GHGEDITOR.CONFIG.data = json;
                createCharts();
            },
            error: function (e, b, c) {
                console.log(e);
                console.log(b);
                console.log(c);
            }
        });
    };

    return {
        CONFIG : CONFIG,
        init : init,
        queryDB : queryDB,
        addPointToChart1:addPointToChart1
    };

})();