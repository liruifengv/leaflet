  var style = {
    color: "#586a77",
    opacity: 1,
    weight: 1.5,
    fillColor: "#323c48",
    fillOpacity: .8
  }
  var hoverStyle = {
    color: "#687c89",
    opacity: 1,
    fillColor: "#1d242f",
    fillOpacity: 1
  }
  var mymap = L.map("mapDiv", {
    center: [33.027088, 109.467773],
    zoom: 4,
    zoomControl: false,
    attributionControl: false,
    minZoom: 1,
    maxZoom: 18
  })
  L.control.zoom({
    position: "bottomright",
    zoomInTitle: "放大",
    zoomOutTitle: "缩小"
  }).addTo(mymap)
  L.control.scale({
    metric: !0,
    imperial: !1
  }).addTo(mymap);

  var flightArr = []; // 存放飞机的数组
  function FlightState() { // 更新飞机的状态
    for (var a = flightArr.length - 1; a >= 0; a--) {
      flightArr[a].update()
      flightArr[a].render()
      // flightArr[a].isEnd() ? flightArr[a].isCleaning || (flightArr[a].isCleaning = !0, flightArr[a].delete(), flightArr.splice(a, 1)) : (flightArr[a].update(), flightArr[a].render())
    }
  }
  // 用d3读取地图geojson数据
  // d3.json("data/world_map.json")
  d3.json("data/geojson/world.json")
    .then((data) => {
      // var topoData = topojson.feature(data, data.objects.countries); // 转化为topojson格式
      // console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
      console.log("data", data);
      // console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
      L.geoJSON(data, {
        style: style,
        onEachFeature: ((feature, layer) => {
          layer.on({
            mouseover: ((e) => {
              var layer = e.target;
              layer.setStyle(hoverStyle)
            }),
            mouseout: ((e) => {
              var layer = e.target;
              layer.setStyle(style)
            }),
            click: ((e) => {

            })
          })
        }),
        filter: ((feature) => {
          return feature.properties.NAME !== 'China' && feature.properties.NAME !== 'Antarctica' && feature.properties.NAME !== 'Taiwan'
        })
      }).bindPopup(function (layer) {
        return layer.feature.properties.NAME;
      }).addTo(mymap);
      var svg = d3.select("#mapDiv").select("svg");
      
      mymap.on("zoomend", FlightState)

      flightArr.push(new Flight(mymap, svg));

      // var plane1 = new Flight(mymap, svg);
      // console.log(plane1)
      flightArr[flightArr.length - 1].setPlaneColor('#FF0000')
      flightArr[flightArr.length - 1].setRoadColor('#42b983')
      flightArr[flightArr.length - 1].setBeginColor('#108ee9')
      flightArr[flightArr.length - 1].setEndColor('#108ee9')
      flightArr[flightArr.length - 1].init({
        lat: 31.2,
        lng: 121.4
      }, {
        lat: 39.92,
        lng: 116.46
      })
      setInterval(function () {
        FlightState()
      }, 100)
            
    })
  // L.marker([30.6268660000, 104.1528940000]).addTo(mymap).bindTooltip("my tooltip text").openTooltip();
  // L.marker([31.2, 121.4]).addTo(mymap).bindPopup("<b>上海</b>").openPopup();
  // L.marker([39.92, 116.46]).addTo(mymap).bindPopup("<b>北京</b>").openPopup();
  d3.json("data/geojson/china/china.json")
    .then((data) => {
      L.geoJSON(data, {
        style: {
          color: "#586a77",
          opacity: 1,
          weight: 1.5,
          fillColor: "#323c48",
          fillOpacity: .8
        },
        onEachFeature: ((feature, layer) => {
          layer.on({
            mouseover: ((e) => {
              var layer = e.target;
              layer.setStyle(hoverStyle)
            }),
            mouseout: ((e) => {
              var layer = e.target;
              layer.setStyle(style)
            }),
            click: ((e) => {})
          })
        })
      }).bindPopup(function (layer) {
        return layer.feature.properties.name;
      }).addTo(mymap);
    })

