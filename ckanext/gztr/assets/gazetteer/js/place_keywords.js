ckan.module('place_keywords', function (jQuery) {
    return {
        initialize: function () {
            jQuery.proxyAll(this, /_on/);
            this.sandbox.subscribe('update-place-keywords', this._onFilterChange);
        },
        teardown: function () {
            // We must always unsubscribe on teardown to prevent memory leaks.
            this.sandbox.unsubscribe('update-place-keywords', this._onFilterChange);
        },
        _onFilterChange: function (filterList) {
            const keywordsInput = document.getElementById("field-place_keywords");
            keywordsInput.value = filterList.map((f) => f[1]).toString();
        }
    };
});
