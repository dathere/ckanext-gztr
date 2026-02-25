function addStatewideSearchHandler() {
    const statewideSwitch = document.getElementById("statewide-search-switch");
    const statewideLabel = document.getElementById("statewide-search-label");
    if (!statewideSwitch || !statewideLabel) return;

    statewideSwitch.addEventListener("change", (e) => {

        const checked = e.target.checked;
        var statewide = document.getElementById("statewide");
        if (checked) {
            if (statewide) {
                statewide.value = 'yes';
                document.getElementById("dataset-search-form").submit();
            }
        } else {
            if (statewide) {
                statewide.value = 'no';
                document.getElementById("dataset-search-form").submit();
            }
        }
    });
}

addStatewideSearchHandler();