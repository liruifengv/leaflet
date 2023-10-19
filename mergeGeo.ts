const path = require('path')
const fs = require('fs')
let all = {
  "type": "FeatureCollection",
  "features": []
}
let world
let china

// fs.readFile('./data/geojson/world.json','utf8', (err, data) => {
//   if (err) throw err;
//   world = JSON.parse(data).features.filter(function (feature) {
//     return feature.properties.NAME !== 'China' && feature.properties.NAME !== 'Antarctica' && feature.properties.NAME !== 'Taiwan'&& feature.properties.NAME !== 'Macao' && feature.properties.NAME !== 'Hong Kong'
//   })
// });


// fs.readFile('./data/geojson/china/china.json','utf8', (err, data) => {
//   if (err) throw err;
//   china = JSON.parse(data).features
//   china.map(function (item) {
//     item.properties.NAME = item.properties.name
//     delete item.properties.name
//   })
//   // console.log(china)
// });

world = JSON.parse(fs.readFileSync('./data/geojson/world.json','utf8')).features.filter(function (feature) {
    return feature.properties.NAME !== 'China' && feature.properties.NAME !== 'Antarctica' && feature.properties.NAME !== 'Taiwan'&& feature.properties.NAME !== 'Macao' && feature.properties.NAME !== 'Hong Kong'
  })

  china = JSON.parse(fs.readFileSync('./data/geojson/china/china.json','utf8')).features
china.map(function (item) {
  item.properties.NAME = item.properties.name
  delete item.properties.name
})
  all.features = [...china,...world]

  const alldata = new Uint8Array(Buffer.from(JSON.stringify(all)));
  fs.writeFile('all.json', alldata, (err) => {
    if (err) throw err;
    console.log('文件已被保存');
  });


