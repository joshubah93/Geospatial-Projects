//*imported variables*
//var sent2: ImageCollection "Sentinel-2 MSI: MultiSpectral Instrument, Level-1C"
//var bang: Polygon, 4 vertices
//var Pars: B8, B3 and B4 from 613.7746461629122 to 5123.360426300856

//bang is a polygon that covers our Bangledesh area

Map.centerObject(bang);


var images = sent2.filterBounds(bang)
              .filterDate('2017-06-01','2017-10-30');
//define the study area (bang) and timeframe - monsoon season (june-oct) in Bangledesh was selected 


print(images.size());
//this shows how much data we are working with 

//Map.addLayer(images);
    //we can generate and import the pars variable and work with it in later lines
    
//within the UI, the generated Pars have a visual image

// Clouds masking of S2 images
function cloudMask(im) {
  // Opaque and cirrus cloud masks cause bits 10 and 11 in QA60 to be set,
  // so values less than 1024 are cloud-free
  var mask = ee.Image(0).where(im.select('QA60').gte(1024), 1).not();
  return im.updateMask(mask);
}


//apply cloudmask to entire image
    //creat new image with function mapped over entire original image
var images2 = images.map(cloudMask);

Map.addLayer(images2, Pars, 'images2');

// calculate ndwi from sentinel (Normalized Difference Water Index); 
//The NDWI results from the following equation: Index = (NIR - MIR)/(NIR + MIR) using Sentinel-2 Band 8 (NIR) and Band 12 (MIR). 
//The NDWI is a vegetation index sensitive to the water content of vegetation and is complementary to the NDVI.
// High NDWI values show a high water content of the vegetation. (Gao, B.C., Remote Sensing of the Environment, p.257(1996))
function s2ndwi(img){
  var ndwi = img.normalizedDifference(['B8', 'B12']).rename('NDWI');
  return img.addBands(ndwi);
}
// map ndwi on all images
var ndwi = images2.map(s2ndwi);

print(ndwi); // check whether NDWI was created

// select maximum NDWI
var S2ndwi = ndwi.select('NDWI').max();
print(s2ndwi);

// set the threshold
var THRESHOLD = 0.8;
// select pixels greater than threshold
var S2ndwi2 = S2ndwi.gt(THRESHOLD);

// set visualization
var ndwi_viz = {bands:'NDWI', min:0.8, max:1, palette:'000000,0000FF'};
// add the map as a layer

var result = S2ndwi2.updateMask(S2ndwi).clip(bang) // you should have first created result image and then export it

Map.addLayer(result, ndwi_viz , 'result_ndwi');

Export.image.toDrive({
  image: result,
 description: "NDWI_B3B8_Thresh_0.8",
 region: bang,
 scale: 20,
 crs: "EPSG:4326",
  maxPixels:400000000
})

