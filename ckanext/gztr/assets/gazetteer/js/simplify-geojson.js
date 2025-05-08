const MAX_SIZE_FOR_SIMP = 30 * 1000 // 30 KB

function simplifyGeojson(str) {
    if (str.length < MAX_SIZE_FOR_SIMP) {
        return str;
    }
    const origGeojson = JSON.parse(str);
    const firstTopo = topojson.topology({ simp: origGeojson })
    const merged = topojson.merge(firstTopo, firstTopo.objects.simp.geometries);
    const seccondTopo = topojson.topology({ simp: merged })
    const presimplified = topojson.presimplify(seccondTopo);
    const quantile = topojson.quantile(presimplified, MAX_SIZE_FOR_SIMP / str.length);
    const simplified = topojson.simplify(presimplified, quantile);
    const outGeojson = topojson.feature(simplified, 'simp');
    return JSON.stringify(outGeojson)
}