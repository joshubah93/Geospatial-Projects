//Imports 
//var pt: Point (13.36, 52.50)
//var region: Polygon, 4 vertices

Map.centerObject(region);

// Apply cloud mask
function applyQAlandsat (image) {
  var mask = image.select('pixel_qa').bitwiseAnd(32).eq(0)
  .and(image.select('pixel_qa').bitwiseAnd(8).eq(0))
  .and(image.select('pixel_qa').bitwiseAnd(4).eq(0));
  return image.updateMask(mask);
}

// Add an NDVI band
var addVariables = function(image) {
  return image.addBands(image.normalizedDifference(['B5', 'B4']).rename('NDVI')).float();
};


// Get Landsat collection, filter by location and time
var collectionLS8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
  .filterBounds(pt)
  .filterDate('2017-01-01', '2017-12-30');


var cloudMasked = collectionLS8.map(applyQAlandsat);
var ndCollection = cloudMasked.map(addVariables).select("NDVI");


var medianL8 = cloudMasked.median().select("B2", "B3",  "B4" , "B5", "B6", "B7");

var training = medianL8.sample({
  region: region,
  scale: 30,
  numPixels: 100
})

// Instantiate the clusterer and train it
// specify the number of Clusters
var clusterer = ee.Clusterer.wekaKMeans(15).train(training)
var result = medianL8.cluster(clusterer);



Map.addLayer(medianL8, {min: 0, max: 2000, bands: ['B4', 'B3', 'B2']}, 'median');
Map.addLayer(result.clip(region).select("cluster").randomVisualizer(), {}, 'output');
