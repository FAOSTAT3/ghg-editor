var GHGEDITOR = (function() {

    var CONFIG = {
        data: null
    };

    function init() {

        /* Initiate tables. */
        createTable('country_new_data', 'Country New Data', 1990, 2015, 'country_new_data');
        createTable('faostat_emissions_db_nc', 'FAOSTAT Emissions Database - National Communication', 1990, 2015, 'faostat_emissions_db_nc');
        createTable('cnd_fs_difference', '% Difference (CountryNewData - FAOSTAT) / FAOSTAT', 1990, 2015, 'cnd_fs_difference');
        createTable('normalised_cnd_fs_difference', 'Normalised % difference (CountryNewData - FAOSTAT) / FAOSTAT ', 1990, 2015, 'normalised_cnd_fs_difference');
        createTable('cnd_nc_difference', '% Difference (CountryNewData - NC) / NC', 1990, 2015, 'cnd_nc_difference');
        createTable('normalised_cnd_nc_difference', 'Normalised % Difference (CountryNewData - NC) / NC', 1990, 2015, 'normalised_cnd_nc_difference');

        /* Initiate Chosen. */
        $('.selector').chosen({
            disable_search_threshold: 10,
            allow_single_deselect: true
        });

        // TODO Example of adding point to a chart
        $('input').keyup(function() {
            var v = parseFloat($('#' + this.id).val());
            if (isNaN(v) || v < 0) {
                console.log('invalid selection @ ' + this.id);
            } else {
                var year = this.id.substring(1 + this.id.indexOf('_'));
                addPointToChart1(year, v);
            }
        });

        /* Chart 1 Definition. */
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

        /* Chart 2 Definition. */
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

        /* Chart 3 Definition. */
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

        /* Chart 4 Definition. */
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

    /* Charts template. */
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

    /* Query DB and prepare the payload for the charts. */
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

    // TODO Example of adding point to a chart
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

    /* Show or hide a section. */
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

    /* Create the tables through Mustache templating. */
    function createTable(render_id, title, start_year, end_year, id_prefix) {

        /* Load template. */
        $.get('html/templates.html', function (templates) {

            /* Create time-range and inputs. */
            var years = [];
            var inputs_4 = [];
            var inputs_4A = [];
            var inputs_4B = [];
            var inputs_4C = [];
            var inputs_4D = [];
            var inputs_4E = [];
            var inputs_4F = [];
            for (var i = start_year ; i <= end_year ; i++) {
                years.push({'year': i});
                inputs_4.push({'input_id_4': id_prefix + '_4_' + i});
                inputs_4A.push({'input_id_4A': id_prefix + '_4A_' + i});
                inputs_4B.push({'input_id_4B': id_prefix + '_4A_' + i});
                inputs_4C.push({'input_id_4C': id_prefix + '_4A_' + i});
                inputs_4D.push({'input_id_4D': id_prefix + '_4A_' + i});
                inputs_4E.push({'input_id_4E': id_prefix + '_4A_' + i});
                inputs_4F.push({'input_id_4F': id_prefix + '_4A_' + i});
            }

            /* Define placeholders. */
            var view = {
                collapse_id: id_prefix + '_collapse_button',
                title: title,
                left_table_id: id_prefix + '_left_table',
                right_table_id: id_prefix + '_right_table',
                years: years,
                inputs_4: inputs_4,
                inputs_4A: inputs_4A,
                inputs_4B: inputs_4B,
                inputs_4C: inputs_4C,
                inputs_4D: inputs_4D,
                inputs_4E: inputs_4E,
                inputs_4F: inputs_4F
            };

            /* Load the right template. */
            var template = $(templates).filter('#g1_table').html();

            /* Substitute placeholders. */
            var render = render = Mustache.render(template, view);

            /* Render the HTML. */
            document.getElementById(render_id).innerHTML = render;

            /* Bind show/hide function. */
            $('#' + id_prefix + '_collapse_button').on('click', function() {
                GHGEDITOR.showHideTable(id_prefix + '_left_table', id_prefix + '_right_table', id_prefix + '_collapse_button');
            });

        });

    };

    return {
        CONFIG : CONFIG,
        init : init,
        addPointToChart1:addPointToChart1,
        showHideTable: showHideTable
    };

})();