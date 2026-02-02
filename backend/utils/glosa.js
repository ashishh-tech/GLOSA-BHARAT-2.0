/**
 * GLOSA Logic Utility
 * Speed = Distance / Time
 */

function calculateAdvisory(distanceInMeters, secondsToChange, currentStatus) {
    const minSpeed = 5; // m/s (~18 km/h)
    const maxSpeed = 16; // m/s (~60 km/h)
    const targetBuffer = 2; // seconds buffer to pass during green

    let recommendedSpeed = 0;
    let message = "";

    if (currentStatus === "GREEN") {
        // Can we make it before it turns red?
        const speedNeeded = distanceInMeters / (secondsToChange - targetBuffer);

        if (speedNeeded <= maxSpeed) {
            recommendedSpeed = Math.max(speedNeeded, minSpeed);
            message = "Maintain speed to clear signal.";
        } else {
            // Can't make it, slow down for next green
            message = "Slow down. Signal turning Red soon.";
            recommendedSpeed = minSpeed;
        }
    } else if (currentStatus === "RED") {
        // Arrive just as it turns green
        const speedNeeded = distanceInMeters / (secondsToChange + targetBuffer);

        if (speedNeeded <= maxSpeed && speedNeeded >= minSpeed) {
            recommendedSpeed = speedNeeded;
            message = "Optimal speed to arrive at Green.";
        } else if (speedNeeded < minSpeed) {
            recommendedSpeed = minSpeed;
            message = "Slow approach. Arrive after signal turns Green.";
        } else {
            recommendedSpeed = 0;
            message = "Stop and wait for Green.";
        }
    } else { // AMBER
        recommendedSpeed = minSpeed;
        message = "Prepare to stop.";
    }

    return {
        speedKmh: Math.round(recommendedSpeed * 3.6),
        message: message
    };
}

// Simple Haversine for distance if needed (though dashboard sends dist for now)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}

module.exports = { calculateAdvisory, getDistance };
