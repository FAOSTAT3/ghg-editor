var GHGEDITOR = (function() {

    var CONFIG = {
        data            :   null,
        base_url        :   'http://fenixapps.fao.org/repository',
        url_templates   :   'ghg-editor/html/templates.html',
        url_procedures  :   'http://faostat3.fao.org/wds/rest/procedures/countries/faostat/GT/S',
        url_data        :   'http://faostat3.fao.org/wds/rest/table/json',
        url_editor      :   'http://localhost:8080/ghg-editor/',
        url_i18n        :   'http://fenixapps.fao.org/repository/ghg-editor/I18N/'
    };

    function init() {

        /* Load i18n for the editor outside the Gateway. */
        $.i18n.properties({
            name: 'I18N',
            path: GHGEDITOR.CONFIG.url_i18n,
            mode: 'both',
            language: 'es'
        });

        /* Initiate tables. */
        createTable('country_new_data', true, 'Nuevos Datos del Pais', 1990, 2012, 'country_new_data', addDataToCharts);
        createTable('emissions_db_nc', false, 'Base de datos de Emisiones - NC', 1990, 2012, 'emissions_db_nc');
        createTable('emissions_db_faostat', false, 'Base de datos de Emisiones - FAOSTAT ', 1990, 2012, 'emissions_db_faostat');
        createTable('cnd_fs_difference', false, '% Diferencia (FAOSTAT)', 1990, 2012, 'cnd_fs_difference');
        createTable('normalised_cnd_fs_difference', false, 'Diferencia normalizada % (FAOSTAT)', 1990, 2012, 'normalised_cnd_fs_difference');
        createTable('cnd_nc_difference', false, '% Diferencia (NC)', 1990, 2012, 'cnd_nc_difference');
        createTable('normalised_cnd_nc_difference', false, 'Diferencia normalizada % (NC)', 1990, 2012, 'normalised_cnd_nc_difference');

        /* Initiate Chosen. */
        $('.selector').chosen({
            disable_search_threshold: 10,
            allow_single_deselect: true
        });

        $.ajax({

            type        :   'GET',
            dataType    :   'json',
            url         :   GHGEDITOR.CONFIG.url_procedures,

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
            var country_code = $('#country_selector').find(":selected").val();
            createChartsAndPopulateTable(country_code, false, true);
        });

        /* Load configuration files. */
        document.getElementById('files').addEventListener('change', handlefilescatter, false);

        /* Translate ther UI. */
        translate();

    };

    function translate() {
        var ids = ['_ghg_country_profile_label', '_select_a_country_label', '_ghg_editor_label', '_ghg_editor_button', '_charts_label'];
        for (var i = 0 ; i < ids.length ; i++) {
            try {
                document.getElementById(ids[i]).innerHTML = $.i18n.prop(ids[i]);
            } catch (e) {


            }
        }
    }

    function init_country_profile(config) {

        GHGEDITOR.CONFIG = $.extend(true, CONFIG, config);

        /* Initiate tables. */
        createTable('emissions_db_nc', false, $.i18n.prop('_emissions_database_national_communication'), 1990, 2012, 'emissions_db_nc');
        createTable('emissions_db_faostat', false, $.i18n.prop('_emissions_database_faostat'), 1990, 2012, 'emissions_db_faostat');
        createTable('cnd_fs_difference', false, $.i18n.prop('_difference_faostat'), 1990, 2012, 'cnd_fs_difference');
        createTable('normalised_cnd_fs_difference', false, $.i18n.prop('_normalised_difference_faostat'), 1990, 2012, 'normalised_cnd_fs_difference');

        /* Initiate Chosen. */
        $('.selector').chosen({
            disable_search_threshold: 10,
            allow_single_deselect: true
        });

        $.ajax({

            type        :   'GET',
            dataType    :    'json',
            url         :    GHGEDITOR.CONFIG.url_procedures,

            success: function (response) {

                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);

                var s = '<option selected>' + $.i18n.prop('_please_select') + '</option>';
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
            var country_code = $('#country_selector').find(":selected").val();
            createChartsAndPopulateTable(country_code, true, false);
        });

        /* Load configuration files. */
        try {
            document.getElementById('files').addEventListener('change', handlefilescatter, false);
        } catch (e) {

        }

        /* Bind GHG Editor button. */
        $('#ghg_editor_button').bind('click', function() {
            window.open(GHGEDITOR.CONFIG.url_editor, '_blank');
        });

        /* Translate ther UI. */
        translate();

    };

    function createChartsAndPopulateTable(country_code, update_tables, add_user_data) {
        createCharts(country_code, add_user_data);
//        populateTable_EmissionsDatabaseFAOSTAT(country_code);
        if (update_tables) {
            populate_tables(country_code, updateTables);
        } else {
            populate_tables(country_code);
        }
    }

    function updateTables() {
        setTimeout(function() {
            $('#emissions_db_faostat_right_table tr > th > div').each(function() {
                var k = $(this).attr('id');
                try {
                    var year = k.substring(1 + k.lastIndexOf('_'));
                    var crf_code = k.substring('emissions_db_faostat_'.length, k.lastIndexOf('_'));
                    var faostat = parseFloat(document.getElementById('emissions_db_faostat_' + crf_code + '_' + year).innerHTML);
                    var nc = parseFloat(document.getElementById('emissions_db_nc_' + crf_code + '_' + year).innerHTML);
                    if (!isNaN(faostat) && !isNaN(nc)) {
                        var perc_diff = ((nc - faostat) / faostat * 100).toFixed(2);
                        var perc_diff_col = (perc_diff >= 0) ? 'green' : 'red';
                        document.getElementById('cnd_fs_difference_' + crf_code + '_' + year).innerHTML = perc_diff + '%';
                        $('#cnd_fs_difference_' + crf_code + '_' + year).css('color', perc_diff_col);
                        var tot = parseFloat(document.getElementById('emissions_db_faostat_4_' + year).innerHTML);
                        var norm_diff = ((nc - faostat) / tot * 100).toFixed(2);
                        var norm_diff_col = (norm_diff >= 0) ? 'green' : 'red';
                        document.getElementById('normalised_cnd_fs_difference_' + crf_code + '_' + year).innerHTML = norm_diff + '%';
                        $('#normalised_cnd_fs_difference_' + crf_code + '_' + year).css('color', norm_diff_col);
                    }
                } catch (e) {

                }
            });
        }, 1000);
    }

    function createCharts(country, add_user_data) {

        /* Chart 1 Definition. */
        var series_1 = [
            {
                name: $.i18n.prop('_agriculture_total') + ' (FAOSTAT)',
                domain: 'GT',
                country: country,
                item: '1711',
                element: '7231',
                datasource: 'faostat'
            },
            {
                name: $.i18n.prop('_agriculture_total') + ' (NC)',
                domain: 'GT',
                country: country,
                item: '4',
                element: null,
                datasource: 'nc'
            }
        ];
        createChart('chart_1', '<b>' + $.i18n.prop('_agriculture_total') + '</b>', series_1, add_user_data);

        /* Chart 2 Definition. */
        var series_2 = [
            {
                name: $.i18n.prop('_enteric_fermentation') + ' (FAOSTAT)',
                domain: 'GT',
                country: country,
                item: '5058',
                element: '7231',
                datasource: 'faostat'
            },
            {
                name: $.i18n.prop('_enteric_fermentation') + ' (NC)',
                domain: 'GT',
                country: country,
                item: '4.A',
                element: null,
                datasource: 'nc'
            },
            {
                name: $.i18n.prop('_manure_management') + ' (FAOSTAT)',
                domain: 'GT',
                country: country,
                item: '5059',
                element: '7231',
                datasource: 'faostat'
            },
            {
                name: $.i18n.prop('_manure_management') + ' (NC)',
                domain: 'GT',
                country: country,
                item: '4.B',
                element: null,
                datasource: 'nc'
            }
        ];
        createChart('chart_2', '<b>' + $.i18n.prop('_enteric_fermentation') + ' y ' + $.i18n.prop('_manure_management') + '</b>', series_2, add_user_data);

        /* Chart 3 Definition. */
        var series_3 = [
            {
                name: $.i18n.prop('_rice_cultivation') + ' (FAOSTAT)',
                domain: 'GT',
                country: country,
                item: '5060',
                element: '7231',
                datasource: 'faostat'
            },
            {
                name: $.i18n.prop('_rice_cultivation') + ' (NC)',
                domain: 'GT',
                country: country,
                item: '4.C',
                element: null,
                datasource: 'nc'
            }
        ];
        createChart('chart_3', '<b>' + $.i18n.prop('_rice_cultivation') + '</b>', series_3, add_user_data);

        /* Chart 4 Definition. */
        var series_4 = [
            {
                name: $.i18n.prop('_agricultural_soils') + ' (FAOSTAT)',
                domain: 'GT',
                country: country,
                item: '1709',
                element: '7231',
                datasource: 'faostat'
            },
            {
                name: $.i18n.prop('_agricultural_soils')  + ' (NC)',
                domain: 'GT',
                country: country,
                item: '4.D',
                element: null,
                datasource: 'nc'
            }
        ];
        createChart('chart_4', '<b>' + $.i18n.prop('_agricultural_soils') + '</b>', series_4, add_user_data);

        /* Chart 5 Definition. */
        var series_5 = [
            {
                name: $.i18n.prop('_prescribed_burning_of_savannas')  + ' (FAOSTAT)',
                domain: 'GT',
                country: country,
                item: '5067',
                element: '7231',
                datasource: 'faostat'
            },
            {
                name: $.i18n.prop('_prescribed_burning_of_savannas')  + ' (NC)',
                domain: 'GT',
                country: country,
                item: '4.E',
                element: null,
                datasource: 'nc'
            },
            {
                name: $.i18n.prop('_field_burning_of_agricultural_residues')  + ' (FAOSTAT)',
                domain: 'GT',
                country: country,
                item: '5066',
                element: '7231',
                datasource: 'faostat'
            },
            {
                name: $.i18n.prop('_field_burning_of_agricultural_residues')  + ' (NC)',
                domain: 'GT',
                country: country,
                item: '4.F',
                element: null,
                datasource: 'nc'
            }
        ];
        createChart('chart_5', '<b>' + $.i18n.prop('_prescribed_burning_of_savannas') + ' y ' + $.i18n.prop('_field_burning_of_agricultural_residues') + '</b>', series_5, add_user_data);

    };

    /* Charts template. */
    function createChart(chart_id, title, series, add_user_data) {
        var p = {
            chart: {
                height: 400,
                spacingBottom: 50,
                zoomType: 'xy',
                events: {
                    load: function() {
                        for (var i = 0 ; i < series.length ; i++) {
                            var chart_series = this.series[i];
                            plotSeries(chart_series, series[i].datasource, series[i].domain, series[i].country, series[i].item, series[i].element);
                        }
                    }
                }
            },
            colors: ['#1f678a', '#1f678a', '#92a8b7', '#92a8b7', '#800432', '#439966'],
            credits: {
              enabled: false
            },
            title: {
                text: title,
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
                    text: 'CO<sub>2</sub>Eq (Gg)'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }],
                labels: {
                    format: '{value}'
                }
            },
            tooltip: {
                valueSuffix: ' Gg',
                year: '%Y',
                crosshairs: [true, true],
                formatter: function() {
                    return '<b>' + this.series.name + '</b><br>' + (new Date(this.x)).getFullYear() + ': ' + this.y + ' Gg'
                }
            },
            legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom',
                borderWidth: 0,
                width: 580,
                itemWidth: 290,
                itemStyle: {
                    width: 260
                },
                floating: true,
                y : 45
            },
            plotOptions: {
                series: {
                    marker: {
                        symbol: 'circle'
                    }
                }
            }
        };
        p.series = [];
        for (var i = 0 ; i < series.length ; i++) {
            p.series[i] = {};
            p.series[i].name = series[i].name;
        }
        $('#' + chart_id).highcharts(p);

        var chart = $('#' + chart_id).highcharts();

        if (add_user_data) {
            var chart = $('#' + chart_id).highcharts();
            var number_of_series = series.length;
            var user_series = number_of_series / 2;
            for (var i = 0; i < user_series; i++) {
                if (chart.series[i].name.indexOf('FAOSTAT') > -1) {
                    chart.addSeries({
                        name: chart.series[i].name.replace('(FAOSTAT)', '(User Data)'),
                        marker: {
                            enabled: true
                        },
                        type: 'scatter'
                    });
                } else {
                    chart.addSeries({
                        name: chart.series[i].name.replace('(NC)', '(User Data)'),
                        marker: {
                            enabled: true
                        },
                        type: 'scatter'
                    });
                }
            }
        }

        for (var i = 0; i < series.length; i++) {
            if (chart.series[i].name.indexOf('NC') > -1) {
                chart.series[i].update({
                    marker: {
                        enabled: true
                    },
                    type: 'scatter'
                });
            } else if (chart.series[i].name.indexOf('FAOSTAT') > -1) {
                chart.series[i].update({
                    marker: {
                        enabled: false
                    },
                    type: 'line'
                });
            } else if (chart.series[i].name.indexOf('User Data') > -1) {
                chart.series[i].update({
                    marker: {
                        enabled: true
                    },
                    type: 'scatter'
                });
            }
        }

    };

    /* Query DB and prepare the payload for the charts. */
    function plotSeries(series, datasource, domain_code, country, item, element) {
        var sql = {};
        switch (datasource) {
            case 'faostat':
                sql['query'] = "SELECT A.AreaNameS, E.ElementListNameS, I.ItemNameS, I.ItemCode, D.Year, D.value " +
                               "FROM Data AS D, Area AS A, Element AS E, Item I " +
                               "WHERE D.DomainCode = '" + domain_code + "' AND D.AreaCode = '" + country + "' " +
                               "AND D.ElementListCode = '" + element + "' " +
                               "AND D.ItemCode IN ('" + item + "') " +
                               "AND D.Year IN (1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, " +
                                              "2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, " +
                                              "2010, 2011, 2012) " +
                               "AND D.AreaCode = A.AreaCode " +
                               "AND D.ElementListCode = E.ElementListCode " +
                               "AND D.ItemCode = I.ItemCode " +
                               "GROUP BY A.AreaNameS, E.ElementListNameS, I.ItemNameS, I.ItemCode, D.Year, D.value " +
                               "ORDER BY D.Year DESC ";
                break;
            case 'nc':
                    sql['query'] = "SELECT year, GUNFValue FROM UNFCCC_Comparison WHERE areacode = " + country + " AND code = '" + item + "' " +
                                   "AND year IN (1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, " +
                                                "2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, " +
                                                "2010, 2011, 2012) " +
                                   "ORDER BY year DESC ";
                break;
        }
        var data = {};
        data.datasource = 'faostat',
        data.thousandSeparator = ',';
        data.decimalSeparator = '.';
        data.decimalNumbers = 2;
        data.json = JSON.stringify(sql);
        data.cssFilename = '';
        data.nowrap = false;
        data.valuesIndex = 0;
        $.ajax({
            type    :   'POST',
            url     :   GHGEDITOR.CONFIG.url_data,
            data    :   data,
            success: function (response) {
                prepare_chart_data(series, response, datasource);
            },
            error: function (e, b, c) {

            }
        });
    };

    function prepare_chart_data(series, db_data, datasource) {
        var json = db_data;
        if (typeof json == 'string')
            json = $.parseJSON(db_data);
        var data = [];
        switch (datasource) {
            case 'faostat':
                for (var i = json.length - 1 ; i >= 0 ; i--) {
                    var tmp = [];
                    tmp.push(Date.UTC(parseInt(json[i][4])));
                    tmp.push(parseFloat(json[i][5]));
                    data.push(tmp);
                }
                break;
            case 'nc':
                for (var i = json.length - 1 ; i >= 0 ; i--) {
                    var tmp = [];
                    if (json[i].length > 1) {
                        tmp.push(Date.UTC(parseInt(json[i][0]), 0, 1));
                        tmp.push(parseFloat(json[i][1]));
                    } else {
                        tmp.push(Date.UTC(parseInt(json[i][0]), 0, 1));
                        tmp.push(null);
                    }
                    data.push(tmp);
                }
                break;
        }
        series.setData(data);
    }

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
    function createTable(render_id, is_editable, title, start_year, end_year, id_prefix, callback) {

        /* Load template. */
        $.get(GHGEDITOR.CONFIG.base_url + '/' + GHGEDITOR.CONFIG.url_templates, function (templates) {

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
                spinning_id: id_prefix + '_spinning',
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
                inputs_4F: inputs_4F,
                _code: $.i18n.prop('_code'),
                _category: $.i18n.prop('_category'),
                _agriculture: $.i18n.prop('_agriculture'),
                _enteric_fermentation: $.i18n.prop('_enteric_fermentation'),
                _manure_management: $.i18n.prop('_manure_management'),
                _rice_cultivation: $.i18n.prop('_rice_cultivation'),
                _agricultural_soils: $.i18n.prop('_agricultural_soils'),
                _prescribed_burning_of_savannas: $.i18n.prop('_prescribed_burning_of_savannas'),
                _field_burning_of_agricultural_residues: $.i18n.prop('_field_burning_of_agricultural_residues')
            };

            /* Load the right template. */
            var template = null;
            if (is_editable)
                template = $(templates).filter('#g1_table_editable').html();
            else
                template = $(templates).filter('#g1_table').html();

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
        addDataToSingleChart(['country_new_data_4_'], [2], 'chart_1');
        addDataToSingleChart(['country_new_data_4A_', 'country_new_data_4B_'], [4, 5], 'chart_2');
        addDataToSingleChart(['country_new_data_4C_'], [2], 'chart_3');
        addDataToSingleChart(['country_new_data_4D_'], [2], 'chart_4');
        addDataToSingleChart(['country_new_data_4E_', 'country_new_data_4F_'], [4, 5], 'chart_5');
    };

    function addDataToSingleChart(input_prefixes, series_indices, chart_id) {

        /* Iterate over all the needed rows. */
        for (var z = 0 ; z < input_prefixes.length ; z++) {

            /* Store series index. */
            $('input[id^=' + input_prefixes[z] + ']').data({series_idx: series_indices[z]});

            $('input[id^=' + input_prefixes[z] + ']').keyup(function () {

                /* Add points to the chart. */
                var inputs = $('input[id^=' + this.id.substring(0, this.id.lastIndexOf('_')) + ']');
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
                } catch (e) {
                    alert('Please select a country.')
                }

                /* Update Tables. */
                var value = parseFloat($(this).val());
                if (!isNaN(value)) {

                    var year = this.id.substring(1 + this.id.lastIndexOf('_'));
                    var crf = this.id.substring('country_new_data_'.length, this.id.lastIndexOf('_'));
                    var faostat = parseFloat(document.getElementById('emissions_db_faostat_' + crf + '_' + year).innerHTML);
                    var nc = parseFloat(document.getElementById('emissions_db_nc_' + crf + '_' + year).innerHTML);
                    var tot = parseFloat(document.getElementById('emissions_db_faostat_4_' + year).innerHTML);

                    var diff = (100 * (value - faostat) / faostat).toFixed(2);
                    var color = (diff >= 0) ? 'green' : 'red';
                    document.getElementById('cnd_fs_difference_' + crf + '_' + year).innerHTML = isNaN(diff) ? '' : diff + '%';
                    $('#cnd_fs_difference_' + crf + '_' + year).css('color', color);

                    var norm = (100 * (value - faostat) / tot).toFixed(2);
                    color = (norm >= 0) ? 'green' : 'red';
                    document.getElementById('normalised_cnd_fs_difference_' + crf + '_' + year).innerHTML = norm + '%';
                    $('#normalised_cnd_fs_difference_' + crf + '_' + year).css('color', color);

                    diff = (100 * (value - nc) / nc).toFixed(2);
                    color = (diff >= 0) ? 'green' : 'red';
                    document.getElementById('cnd_nc_difference_' + crf + '_' + year).innerHTML = diff + '%';
                    $('#cnd_nc_difference_' + crf + '_' + year).css('color', color);

                    tot = parseFloat(document.getElementById('emissions_db_faostat_4_' + year).innerHTML);
                    norm = (100 * (value - nc) / tot).toFixed(2);
                    color = (norm >= 0) ? 'green' : 'red';
                    document.getElementById('normalised_cnd_nc_difference_' + crf + '_' + year).innerHTML = norm + '%';
                    $('#normalised_cnd_nc_difference_' + crf + '_' + year).css('color', color);

                }

            });
        }
    };

    function populateTable_EmissionsDatabaseNC(country_code, callback) {
        var sql = {
            'query' : 'select code, year, gunfvalue from UNFCCC_Comparison where areacode = ' + country_code
        };
        var data = {};
        data.datasource = 'faostat',
        data.thousandSeparator = ',';
        data.decimalSeparator = '.';
        data.decimalNumbers = 2;
        data.json = JSON.stringify(sql);
        data.cssFilename = '';
        data.nowrap = false;
        data.valuesIndex = 0;
        $.ajax({
            type    :   'POST',
            url     :   GHGEDITOR.CONFIG.url_data,
            data    :   data,
            success : function(response) {
                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);
                for (var i = 0 ; i < json.length ; i++) {
                    var id = 'emissions_db_nc_' + json[i][0].replace('.', '') + '_' + json[i][1];
                    try {
                        document.getElementById(id).innerHTML = (json[i].length > 2) ? json[i][2] : '';
                    } catch (e) {

                    }
                }
                if (callback != null)
                    callback();
            },
            error : function(err, b, c) { }
        });
    }

    function populate_tables(country_code, callback) {

        var sql = {
            'query' : "SELECT A.AreaNameS, E.ElementListNameS, I.ItemNameS, I.ItemCode, D.Year, D.value " +
                "FROM Data AS D, Area AS A, Element AS E, Item I " +
                "WHERE D.DomainCode = 'GT' AND D.AreaCode = '" + country_code + "' " +
                "AND D.ElementListCode = '7231' " +
                "AND D.ItemCode IN ('5058', '5059', '5060', '5066', '5067', '1709', '1711') " +
                "AND D.Year IN (1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, " +
                "2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, " +
                "2010, 2011, 2012) " +
                "AND D.AreaCode = A.AreaCode " +
                "AND D.ElementListCode = E.ElementListCode " +
                "AND D.ItemCode = I.ItemCode " +
                "GROUP BY A.AreaNameS, E.ElementListNameS, I.ItemNameS, I.ItemCode, D.Year, D.value"
        }
        var data = {};
        data.datasource = 'faostat',
            data.thousandSeparator = ',';
        data.decimalSeparator = '.';
        data.decimalNumbers = 2;
        data.json = JSON.stringify(sql);
        data.cssFilename = '';
        data.nowrap = false;
        data.valuesIndex = 0;

        $.ajax({

            type    :   'POST',
            url     :   GHGEDITOR.CONFIG.url_data,
            data    :   data,

            success : function(response) {
                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);
                for (var i = 0 ; i < json.length ; i++) {
                    var item = json[i][3];
                    var y = json[i][4];
                    var v = json[i][5];
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
                    document.getElementById('emissions_db_faostat_' + crf + '_' + y).innerHTML = v;
                }

                var sql = {
                    'query' : 'select code, year, gunfvalue from UNFCCC_Comparison where areacode = ' + country_code
                };
                var data = {};
                data.datasource = 'faostat',
                data.thousandSeparator = ',';
                data.decimalSeparator = '.';
                data.decimalNumbers = 2;
                data.json = JSON.stringify(sql);
                data.cssFilename = '';
                data.nowrap = false;
                data.valuesIndex = 0;

                $.ajax({

                    type    :   'POST',
                    url     :   GHGEDITOR.CONFIG.url_data,
                    data    :   data,

                    success : function(response) {
                        var json = response;
                        if (typeof json == 'string')
                            json = $.parseJSON(response);
                        for (var i = 0 ; i < json.length ; i++) {
                            var id = 'emissions_db_nc_' + json[i][0].replace('.', '') + '_' + json[i][1];
                            try {
                                document.getElementById(id).innerHTML = (json[i].length > 2) ? json[i][2] : '';
                            } catch (e) {

                            }
                        }
                        if (callback != null)
                            callback();
                    },

                    error : function(err, b, c) {

                    }

                });

            },

            error: function (e, b, c) {
                console.log(e);
                console.log(b);
                console.log(c);
            }

        });

    }

    function populateTable_EmissionsDatabaseFAOSTAT(country_code) {
        var sql = {
            'query' : "SELECT A.AreaNameS, E.ElementListNameS, I.ItemNameS, I.ItemCode, D.Year, D.value " +
                      "FROM Data AS D, Area AS A, Element AS E, Item I " +
                      "WHERE D.DomainCode = 'GT' AND D.AreaCode = '" + country_code + "' " +
                      "AND D.ElementListCode = '7231' " +
                      "AND D.ItemCode IN ('5058', '5059', '5060', '5066', '5067', '1709', '1711') " +
                      "AND D.Year IN (1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, " +
                                     "2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, " +
                                     "2010, 2011, 2012) " +
                      "AND D.AreaCode = A.AreaCode " +
                      "AND D.ElementListCode = E.ElementListCode " +
                      "AND D.ItemCode = I.ItemCode " +
                      "GROUP BY A.AreaNameS, E.ElementListNameS, I.ItemNameS, I.ItemCode, D.Year, D.value"
        }
        var data = {};
        data.datasource = 'faostat',
        data.thousandSeparator = ',';
        data.decimalSeparator = '.';
        data.decimalNumbers = 2;
        data.json = JSON.stringify(sql);
        data.cssFilename = '';
        data.nowrap = false;
        data.valuesIndex = 0;
        $.ajax({
            type    :   'POST',
            url     :   GHGEDITOR.CONFIG.url_data,
            data    :   data,
            success : function(response) {
                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);
                for (var i = 0 ; i < json.length ; i++) {
                    var item = json[i][3];
                    var y = json[i][4];
                    var v = json[i][5];
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
                    document.getElementById('emissions_db_faostat_' + crf + '_' + y).innerHTML = v;
                }
            },
            error: function (e, b, c) {
                console.log(e);
                console.log(b);
                console.log(c);
            }
        });
    }

    function exportData() {
        var data = {};
        var inputs = $('input[id^=country_new_data_]');
        for (var i = 0 ; i < inputs.length ; i++)
            data[inputs[i].id] = $(inputs[i]).val();
        data.country_code = $('#country_selector').find(":selected").val();
        var a = document.createElement('a');
        a.href = 'data:application/json,' + JSON.stringify(data);
        a.target = '_blank';
        a.download = $('#country_selector').find(":selected").val() + '_country_data.json';
        document.body.appendChild(a);
        a.click();
    }

    function handlefilescatter(e) {
        var files = e.target.files;
        for (var i = 0, f; f = files[i]; i++) {
            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    var json = $.parseJSON(e.target.result);
                    for (var key in json) {
                        var value = parseFloat(json[key]);
                        if (!isNaN(value) && value >= 0)
                            $('#' + key).val(value);
                    }
                    createChartsAndPopulateTable(json.country_code);
                };
            })(f);
            reader.readAsText(f);
        }
    }



    return {
        CONFIG                  :   CONFIG,
        init                    :   init,
        showHideTable           :   showHideTable,
        showHideCharts          :   showHideCharts,
        exportData              :   exportData,
        handlefilescatter       :   handlefilescatter,
        init_country_profile    :   init_country_profile
    };

})();