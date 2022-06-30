/**
 * Check if valid polygon
 */
exports.isValidPolygon = function(polygon){
    if (!Array.isArray(polygon)) return false;
    for (let vertices of polygon){
        if (!Array.isArray(vertices)) return false;
        for (let vertex of vertices){
            if (!Array.isArray(vertex)) return false;
            if (vertex.length != 2) return false;
            if (!Number.isFinite(vertex[0])) return false;
            if (!Number.isFinite(vertex[1])) return false;
        }
    }
    return true;
}
const isValidPolygon = exports.isValidPolygon;

/**
 * Get Bounding Box of Polygon
 */
exports.getBoundingBoxOfPolygon = function(polygon){
    //Check if valid polygon
    if (!isValidPolygon(polygon)) return null;
    //Check if empty polygon
    if (!polygon[0]) return null;
    //Return Data
    return {
        x_min: Math.min(...polygon[0].map((vertex) => vertex[0])),
        x_max: Math.max(...polygon[0].map((vertex) => vertex[0])),
        y_min: Math.min(...polygon[0].map((vertex) => vertex[1])),
        y_max: Math.max(...polygon[0].map((vertex) => vertex[1])),
    };
}
const getBoundingBoxOfPolygon = exports.getBoundingBoxOfPolygon;

/**
 * Get Area of Polygon
 * polygon[$i] = {x, y}, where x, y are longitudes, latitudes in degrees respectively
 * Default Unit: Square with side equal to 1 degree longitude on earth
 */
exports.getAreaOfPolygon = function(polygon, in_square_km = false){
    //Check if valid polygon
    if (!isValidPolygon(polygon)) return null;
    //Check if empty polygon
    if (!polygon[0]) return 0;
    //Get total area (first element in array is positive bounds, while else are negative holes)
    let total_area = getAreaInVertices(polygon[0]);
    for (let i = 1; i < polygon.length; i++){
        total_area -= getAreaInVertices(polygon[i]);
    }
    //If square km mode
    if (in_square_km){
        const earth_radius =  (process.env.EARTH_RADIUS_KM || 6400) * 1;
        const one_degree_km = earth_radius * 2 * Math.PI / 360;
        total_area *= (one_degree_km * one_degree_km);
    }
    return total_area;
}
const getAreaOfPolygon = exports.getAreaOfPolygon;

//Get Area of Vertices (i.e. Sub-polygon)
//vertex = [x, y]
function getAreaInVertices(vertices){
    let area = 0;
    //For each vertex on polygon...
    for (let i = 0; i < vertices.length; i++){
        const vertex1 = vertices[i] || {};
        const vertex2 = vertices[i+1] || vertices[0] || {};
        //Apply shoelace formula
        const area_planar = (vertex1[0] * vertex2[1] - vertex1[1] * vertex2[0]) / 2;
        //Make curve-surface adjustment...
        const [y1, y2] = [vertex1[1], vertex2[1]];
        //If y1 = y2 = 0
        let area_adjustment;
        if (y1 == 0 && y2 == 0){
            area_adjustment = 1;
        }
        //If y2 = 0
        else if (y2 == 0){
            area_adjustment = -getTriangleAreaOnCurve(y1, 0) * 2 / y1;
        }
        //Otherwise
        else{
            area_adjustment = (getTriangleAreaOnCurve(0, y1) - getTriangleAreaOnCurve(y2, y1)) * 2 / y2;
        }
        //Add to area
        area += area_planar * Math.abs(area_adjustment);
        console.log( {y1, y2, area_adjustment, area_planar});
    }
    return Math.abs(area);
}

//Get triangle area = Integrate (y-a)/(b-a)*cos(y deg) from a to b.
//a, b are latitudes in degrees
//Result is negative if b < a
function getTriangleAreaOnCurve(a, b, y1 = null, y2 = null, width_y1 = null, width_y2 = null){
    const threshold = 0.00000001;
    //If a = b, directly return 0
    if (a == b) return 0;
    //By default: y1 = a, y2 = b
    if (y1 === null) y1 = a;
    if (y2 === null) y2 = b;
    //If y1 = y2, directly return 0
    if (y1 == y2) return 0;
    //Calculate width for y = y1
    if (width_y1 === null) width_y1 = (y1 - a) / (b - a) * cos_deg(y1);
    //Calculate width for y = y2
    if (width_y2 === null) width_y2 = (y2 - a) / (b - a) * cos_deg(y2);
    //Calculate width for y = ym = (y1+y2)/2
    const ym = (y1 + y2) / 2;
    const width_ym = (ym - a) / (b - a) * cos_deg(ym);
    //Calculate sub-area considering only y1, y2
    const area1 = (width_y1 + width_y2) * (y2 - y1) / 2;
    //Calculate sub-area considering also ym
    const area2 = (width_y1 + width_ym) * (ym - y1) / 2 + (width_y2 + width_ym) * (y2 - ym) / 2;
    //Compare two calculation results. If difference too large, split it again.
    if (Math.abs(area2 - area1) <= threshold) return area2;
    else{
        return getTriangleAreaOnCurve(a, b, y1, ym, width_y1, width_ym)
             + getTriangleAreaOnCurve(a, b, ym, y2, width_ym, width_y2);
    }
}

function cos_deg(deg){
    if (deg % 360 == 0) return +1;
    if (deg % 360 == 180 || deg % 360 == -180) return -1;
    if (deg % 180 == 90 || deg % 180 == -90) return 0;
    return Math.cos(deg * Math.PI / 180);
}