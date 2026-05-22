/**
 * geo-utils.js
 * Shared geospatial utilities for all Iceland trip pipeline scripts.
 * Import with: const { haversine, slug, toDec, CF, RADIUS_KM } = require('../../scripts/utils/geo-utils');
 */

/** Canonical public URL base — always use this, never a raw *.cloudfront.net domain */
const CF = 'https://jerome-dixon.io';

/** Default photo matching radius in km (3 miles) */
const RADIUS_KM = 3 * 1.60934;

/**
 * Haversine distance between two lat/lon points, returns km.
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Convert DMS string + ref (N/S/E/W) to decimal degrees.
 */
function toDec(dms, ref) {
  if (!dms) return null;
  const r = (ref || '').trim().toUpperCase();
  const neg = r === 'S' || r === 'W' || r === 'SOUTH' || r === 'WEST';
  if (/^-?\d+(\.\d+)?$/.test(dms.trim())) {
    let n = parseFloat(dms);
    if (neg) n = -Math.abs(n);
    return n;
  }
  const m = dms.match(/(\d+)\s*deg\s*(\d+)'\s*([\d.]+)/);
  if (!m) return null;
  let v = parseFloat(m[1]) + parseFloat(m[2]) / 60 + parseFloat(m[3]) / 3600;
  if (neg) v = -v;
  return v;
}

/**
 * Convert a stop name to an S3-safe slug.
 * Icelandic special chars (ð, ó, á, í, ú, þ, æ, ö, etc.) become '-'.
 */
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Build a canonical S3/CloudFront photo URL for a file at a given stop.
 */
function photoUrl(stopName, filename) {
  return `${CF}/iceland_trip/photos/${slug(stopName)}/${filename}`;
}

module.exports = { CF, RADIUS_KM, haversine, toDec, slug, photoUrl };
