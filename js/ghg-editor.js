var GHGEDITOR = (function() {

    var CONFIG = {
        data: null
    };

    function init() {

        $('.selector').chosen({
            disable_search_threshold: 10,
            allow_single_deselect: true
        });

        $('input').keyup(function() {
            var v = parseFloat($('#' + this.id).val());
            if (isNaN(v) || v < 0) {
                console.log('invalid selection @ ' + this.id);
            } else {
                var year = this.id.substring(1 + this.id.indexOf('_'));
                addPointToChart1(year, v);
            }
        });

        var series_1 = [
            {
                name: 'Agricultural Total (FAOSTAT)',
                domain: 'GT',
                country: '48',
                item: '1711',
                element: '7231'
            }
        ];
        createChart('chart_1', 'Agricultural Total', series_1);

        var series_2 = [
            {
                name: 'Enteric Fermentation (FAOSTAT)',
                domain: 'GT',
                country: '48',
                item: '5058',
                element: '7231'
            },
            {
                name: 'Manure Management (FAOSTAT)',
                domain: 'GT',
                country: '48',
                item: '5059',
                element: '7231'
            }
        ];
        createChart('chart_2', 'Enteric Fermentation and Manure Management', series_2);

        var series_3 = [
            {
                name: 'Rice Cultivation (FAOSTAT)',
                domain: 'GT',
                country: '48',
                item: '5060',
                element: '7231'
            },
            {
                name: 'Agricultural Soils (FAOSTAT)',
                domain: 'GT',
                country: '48',
                item: '1709',
                element: '7231'
            }
        ];
        createChart('chart_3', 'Rice Cultivation and Agricultural Soils', series_3);

        var series_4 = [
            {
                name: 'Burning of Savanna (FAOSTAT)',
                domain: 'GT',
                country: '48',
                item: '5067',
                element: '7231'
            },
            {
                name: 'Burning of Crop Residues (FAOSTAT)',
                domain: 'GT',
                country: '48',
                item: '5066',
                element: '7231'
            }
        ];
        createChart('chart_4', 'Burning of Savanna and Burning of Crop Residues', series_4);

    };

    function createChart(chart_id, title, series) {
        var p = {
            chart: {
                events: {
                    load: function() {
                        for (var i = 0 ; i < series.length ; i++) {
                            var chart_series = this.series[i];
                            plotSeries(chart_series, series[i].domain, series[i].country, series[i].item, series[i].element);
                        }
                    }
                }
            },
            title: {
                text: title,
                x: -20
            },
            subtitle: {
                text: 'Source: FAOSTAT',
                x: -20
            },
            xAxis: {
                type: 'datetime',
                labels: {
                    rotation: -45
                }
            },
            yAxis: {
                title: {
                    text: 'CO2Eq (Gg)'
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
            }
        };
        p.series = [];
        for (var i = 0 ; i < series.length ; i++) {
            p.series[i] = {};
            p.series[i].name = series[i].name;
            p.series[i].type = 'column';
        }
        p.series[series.length] = {};
        p.series[series.length].name = 'User Data';
        p.series[series.length].type = 'column';
        $('#' + chart_id).highcharts(p);
    };

    function plotSeries(series, domain_code, country, item, element) {
        var p = {};
        p.datasource = 'faostat';
        p.domainCode = domain_code;
        p.lang = 'E';
        p.nullValues = true;
        p.thousand = '.';
        p.decimal = ',';
        p.decPlaces = 2;
        p.limit = 100;
        p['list1Codes'] = ['\'' + country + '\''];
        p['list2Codes'] = ['\'' + item + '\''];
        p['list3Codes'] = ['\'' + element + '\''];
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
                var data = [];
                var year = 1990;
                for (var i = json.length - 1 ; i >= 0 ; i--) {
                    var tmp = [];
                    tmp.push(Date.UTC(parseInt(json[i][10])));
                    tmp.push(parseFloat(json[i][13]));
                    data.push(tmp);
                    year++;
                }
                series.setData(data);
            },
            error: function (e, b, c) {
                console.log(e);
                console.log(b);
                console.log(c);
            }
        });
    };

    function addPointToChart1() {
        var chart = $('#chart_1').highcharts();
        var data = [];
        var inputs = $('input');
        for (var i = 0 ; i < inputs.length ; i++) {
            if (inputs[i].id.indexOf('4_') > -1) {
                var year = inputs[i].id.substring(1 + inputs[i].id.indexOf('_'));
                var value = $(inputs[i]).val();
                var tmp = [];
                tmp.push(Date.UTC(parseInt(year)));
                tmp.push(parseFloat(value));
                data.push(tmp);
            }
        }
        chart.series[1].setData(data);
    };

    function showHideTable(left_table_id, right_table_id, label_id) {
        if ($('#' + left_table_id).css('display') == 'none') {
            $('#' + left_table_id).css('display', 'block');
            $('#' + left_table_id).animate({opacity: 1});
            $('#' + label_id).removeClass('fa fa-expand').addClass('fa fa-compress');
        } else {
            $('#' + left_table_id).animate(
                {opacity: 0}, function() {
                    $('#' + left_table_id).css('display', 'none');
                });
            $('#' + label_id).removeClass('fa fa-compress').addClass('fa fa-expand');
        }
        if ($('#' + right_table_id).css('display') == 'none') {
            $('#' + right_table_id).css('display', 'block');
            $('#' + right_table_id).animate({opacity: 1});
        } else {
            $('#' + right_table_id).animate(
                {opacity: 0}, function() {
                    $('#' + right_table_id).css('display', 'none');
                });
        }
    };

    return {
        CONFIG : CONFIG,
        init : init,
        addPointToChart1:addPointToChart1,
        showHideTable: showHideTable
    };

})();