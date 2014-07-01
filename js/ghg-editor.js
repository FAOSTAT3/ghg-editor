var GHGEDITOR = (function() {

    var CONFIG = {
        data: null
    };

    function init() {

        /* Initiate tables. */
        createTable('country_new_data', 'Country New Data', 1990, 2015, 'country_new_data', addDataToCharts);
        createTable('emissions_db_nc', 'Emissions Database - National Communication', 1990, 2015, 'emissions_db_nc');
        createTable('emissions_db_faostat', 'Emissions Database - FAOSTAT', 1990, 2015, 'emissions_db_faostat');
        createTable('cnd_fs_difference', '% Difference (CountryNewData - FAOSTAT) / FAOSTAT', 1990, 2015, 'cnd_fs_difference');
        createTable('normalised_cnd_fs_difference', 'Normalised % difference (CountryNewData - FAOSTAT) / FAOSTAT ', 1990, 2015, 'normalised_cnd_fs_difference');
        createTable('cnd_nc_difference', '% Difference (CountryNewData - NC) / NC', 1990, 2015, 'cnd_nc_difference');
        createTable('normalised_cnd_nc_difference', 'Normalised % Difference (CountryNewData - NC) / NC', 1990, 2015, 'normalised_cnd_nc_difference');

        /* Initiate Chosen. */
        $('.selector').chosen({
            disable_search_threshold: 10,
            allow_single_deselect: true
        });

        $.ajax({

            type: 'GET',
            url: 'http://localhost:8080/wds/rest/procedures/countries/faostat/GT/E',
            dataType: 'json',

            success: function (response) {

                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);

                var s = '<option selected>Please Select a Country...</option>';
                for (var i = 0 ; i < json.length ; i++)
                    s += '<option value="' + json[i][0] + '">' + json[i][1] + '</option>';
                document.getElementById('country_selector').innerHTML = s;
                $('#country_selector').trigger('chosen:updated');

            },

            error: function (err, b, c) {

            }

        });

        /* Create charts and load tables on country selection change. */
        $('#country_selector').on('change', function() {

            /* Get selected country. */
            var country = $('#country_selector').find(":selected").val();

            /* Create charts. */
            createCharts(country);

            /* Populate tables. */
            populateTable_EmissionsDatabaseFAOSTAT();

        });

    };

    function createCharts(country) {

        /* Chart 1 Definition. */
        var series_1 = [
            {
                name: 'Agricultural Total (FAOSTAT)',
                domain: 'GT',
                country: country,
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
                country: country,
                item: '5058',
                element: '7231'
            },
            {
                name: 'Manure Management (FAOSTAT)',
                domain: 'GT',
                country: country,
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
                country: country,
                item: '5060',
                element: '7231'
            },
            {
                name: 'Agricultural Soils (FAOSTAT)',
                domain: 'GT',
                country: country,
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
                country: country,
                item: '5067',
                element: '7231'
            },
            {
                name: 'Burning of Crop Residues (FAOSTAT)',
                domain: 'GT',
                country: country,
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
        $('#' + chart_id).highcharts(p);
        var chart = $('#' + chart_id).highcharts();
        for (var i = 0 ; i < series.length ; i++) {
            chart.addSeries({
                name: chart.series[i].name.replace('(FAOSTAT)', '(User Data)')
            });
        }
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
        p.limit = -1;
        p['list1Codes'] = ['\'' + country + '\''];
        p['list3Codes'] = ['\'' + item + '\''];
        p['list2Codes'] = ['\'' + element + '\''];
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
                for (var i = json.length - 1 ; i >= 0 ; i--) {
                    var tmp = [];
                    tmp.push(Date.UTC(parseInt(json[i][10])));
                    tmp.push(parseFloat(json[i][13]));
                    data.push(tmp);
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

    /* Show or hide a section. */
    function showHideCharts() {
        if ($('#charts_container').css('display') == 'none') {
            $('#charts_container').css('display', 'block');
            $('#charts_container').animate({opacity: 1});
            $('#charts_collapse_button').removeClass('fa fa-expand').addClass('fa fa-compress');
        } else {
            $('#charts_container').animate(
                {opacity: 0}, function() {
                    $('#charts_container').css('display', 'none');
                });
            $('#charts_collapse_button').removeClass('fa fa-compress').addClass('fa fa-expand');
        }
    };

    /* Create the tables through Mustache templating. */
    function createTable(render_id, title, start_year, end_year, id_prefix, callback) {

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
                inputs_4B.push({'input_id_4B': id_prefix + '_4B_' + i});
                inputs_4C.push({'input_id_4C': id_prefix + '_4C_' + i});
                inputs_4D.push({'input_id_4D': id_prefix + '_4D_' + i});
                inputs_4E.push({'input_id_4E': id_prefix + '_4E_' + i});
                inputs_4F.push({'input_id_4F': id_prefix + '_4F_' + i});
            }

            /* Define placeholders. */
            var view = {
                section_name: id_prefix,
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

            /* Bind callback (if any) */
            if (callback != null)
                callback();

        });

    };

    function addDataToCharts() {
        addDataToSingleChart(['country_new_data_4_'], [1], 'chart_1');
        addDataToSingleChart(['country_new_data_4A_', 'country_new_data_4B_'], [2, 3], 'chart_2');
        addDataToSingleChart(['country_new_data_4C_', 'country_new_data_4D_'], [2, 3], 'chart_3');
        addDataToSingleChart(['country_new_data_4E_', 'country_new_data_4F_'], [2, 3], 'chart_4');
    };

    function addDataToSingleChart(input_prefixes, series_indices, chart_id) {

        /* Iterate over all the needed rows. */
        console.log(input_prefixes);
        console.log(series_indices);
        console.log(chart_id);
        console.log(input_prefixes.length);
        for (var z = 0 ; z < input_prefixes.length ; z++) {

            /* Store series index. */
            $('input[id^=' + input_prefixes[z] + ']').data({series_idx: series_indices[z]});

            $('input[id^=' + input_prefixes[z] + ']').keyup(function () {

                /* Add points to the chart. */
                var inputs = $('input[id^=' + this.id.substring(0, this.id.lastIndexOf('_')) + ']');
                console.log(inputs.length);
                var data = [];
                var chart = $('#' + chart_id).highcharts();
                for (var i = 0; i < inputs.length; i++) {
                    var year = Date.UTC(parseInt(inputs[i].id.substring(1 + inputs[i].id.lastIndexOf('_'))));
                    var value = parseFloat($(inputs[i]).val());
                    if (!isNaN(value) && value >= 0) {
                        var tmp = [year, value];
                        data.push(tmp);
                    } else {
                        var tmp = [year, null];
                        data.push(tmp);
                    }
                }

                /* Add points to the chart. */
                try {
                    chart.series[$.data(this, 'series_idx')].update({data: data});
                    if (chart_id == 'chart_1')
                        console.log(data);
                } catch (e) {
                    alert('Please Select a Country');
                }

                /* Update Tables. */
                var value = parseFloat($(this).val());
                if (!isNaN(value)) {
                    var year = this.id.substring(1 + this.id.lastIndexOf('_'));
                    var crf = this.id.substring('country_new_data_'.length, this.id.lastIndexOf('_'));
                    var faostat = parseFloat($('#emissions_db_faostat_' + crf + '_' + year).val());
                    var diff = ((value - faostat) / faostat).toFixed(2);
                    var color = (diff >= 0) ? 'green' : 'red';
                    $('#cnd_fs_difference_' + crf + '_' + year).val(diff + '%');
                    $('#cnd_fs_difference_' + crf + '_' + year).css('color', color);
                    var tot = parseFloat($('#emissions_db_faostat_4_' + year).val());
                    var norm = ((value - faostat) / tot).toFixed(2);
                    color = (norm >= 0) ? 'green' : 'red';
                    $('#normalised_cnd_fs_difference_' + crf + '_' + year).val(norm + '%');
                    $('#normalised_cnd_fs_difference_' + crf + '_' + year).css('color', color);
                }

            });
        }
    };

    function populateTable_EmissionsDatabaseFAOSTAT() {
        var country = $('#country_selector').find(":selected").val();
        var p = {};
        p.datasource = 'faostat';
        p.domainCode = 'GT';
        p.lang = 'E';
        p.nullValues = true;
        p.thousand = '.';
        p.decimal = ',';
        p.decPlaces = 2;
        p.limit = -1;
        p['list1Codes'] = ['\'' + country + '\''];
        p['list2Codes'] = ['\'7231\''];
        p['list3Codes'] = ['\'5058\'', '\'5059\'', '\'5060\'', '\'5066\'', '\'5067\'', '\'1709\'', '\'1711\''];
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
                for (var i = 1 ; i < json.length ; i++) {
                    var item = json[i][8];
                    var y = json[i][10];
                    var v = json[i][13];
                    var crf = null;
                    switch (item) {
                        case '1711': crf = '4';  break;
                        case '5058': crf = '4A'; break;
                        case '5059': crf = '4B'; break;
                        case '5060': crf = '4C'; break;
                        case '1709': crf = '4D'; break;
                        case '5067': crf = '4E'; break;
                        case '5066': crf = '4F'; break;
                    }
                    $('#emissions_db_faostat_' + crf + '_' + y).val(parseFloat(v));
                }
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
        showHideTable: showHideTable,
        showHideCharts: showHideCharts
    };

})();