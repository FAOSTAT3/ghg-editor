var GHGEDITOR = (function() {

    var CONFIG = {

    };

    function init() {
        $('.selector').chosen({
            disable_search_threshold: 10,
            allow_single_deselect: true
        });
        $('input[type="number"]').keyup(function() {
            if (isNaN(parseFloat($('#' + this.id).val())) || v < 0)
                console.log('unvalid selection @ ' + this.id);
        });
    };

    function queryDB() {
        var p = {};
        p.datasource = 'faostat';
        p.domainCode = 'GT';
        p.lang = 'E';
        p.nullValues = true;
        p.thousand = ',';
        p.decimal = '.';
        p.decPlaces = 2;
        p.limit = 100;
        p['list1Codes'] = ['\'48\''];
        p['list2Codes'] = ['\'5058\''];
        p['list3Codes'] = ['\'7231\''];
        p['list4Codes'] = ['\'1990\'', '\'1991\'', '\'1992\'', '\'1993\'', '\'1994\'', '\'1995\'', '\'1996\'', '\'1997\'', '\'1998\'', '\'1999\''];
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
                console.log(json);
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
        queryDB : queryDB
    };

})();