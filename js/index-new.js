  var planeInterval;
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
    position: "topleft",
    zoomInTitle: "放大",
    zoomOutTitle: "缩小"
  }).addTo(mymap)
  L.control.scale({
    metric: !0,
    imperial: !1
  }).addTo(mymap);
  var flightArr = []; // 存放飞机的数组
  // function FlightState() { // 更新飞机的状态
  //   for (var a = flightArr.length - 1; a >= 0; a--) {
  //     flightArr[a].isEnd() ? clearInterval(planeInterval) : ''
  //     flightArr[a].update()
  //     flightArr[a].render()
  //     // flightArr[a].isEnd() ? flightArr[a].isCleaning || (flightArr[a].isCleaning = !0, flightArr[a].delete(), flightArr.splice(a, 1)) : (flightArr[a].update(), flightArr[a].render())
  //   }
  // }
  // 用d3读取地图geojson数据
  // d3.json("data/world_map.json")
  console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
  console.log("mymap",mymap);
  console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
  d3.json("all.json")
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
        })
      }).bindPopup(function (layer) {
        return layer.feature.properties.NAME;
      }).addTo(mymap);
      var svg = d3.select("#mapDiv").select("svg");
      
      var latlngs = [
        [30.655822, 104.081534],
        [39.92, 116.46]
      ];
      var options = {
        planeColor: '#FFCCCC',
        roadColor: '#85FFFF',
        beginColor: '#62DFDF',
        endColor: '#62DFDF'
      }
      var planeInfo = [{
        planeName: '马航M370',
        peopleCount: '200',
        flightTime: '3h'
      }]
      var plane =  new Flight(mymap, svg)
      plane.init(latlngs, options, planeInfo);


      // var drawnItems = new L.FeatureGroup().addTo(mymap),
      var editActions = [
        LeafletToolbar.EditAction.Popup.Edit,
        LeafletToolbar.EditAction.Popup.Delete,
        // LeafletToolbar.ToolbarAction.extendOptions({
          // toolbarIcon: {
          //   className: 'leaflet-color-picker',
          //   html: '<span class="fa fa-eyedropper"></span>'
          // },
          // subToolbar: new LeafletToolbar({
          //   actions: [
          //     L.ColorPicker.extendOptions({
          //       color: '#db1d0f'
          //     }),
          //     L.ColorPicker.extendOptions({
          //       color: '#025100'
          //     }),
          //     L.ColorPicker.extendOptions({
          //       color: '#ffff00'
          //     }),
          //     L.ColorPicker.extendOptions({
          //       color: '#0000ff'
          //     })
          //   ]
          // })
        // })
      ];
      // new LeafletToolbar.DrawToolbar({
      //   position: 'topleft',
      // }).addTo(mymap);


      const drawnItems = new L.FeatureGroup();
      mymap.addLayer(drawnItems);

      const drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
          polyline: {
            metric: true,
          },
          polygon: {
            allowIntersection: true,
            showArea: true,
            showLength: true,
            metric: true,

            drawError: {
              color: '#ff0000',
              timeout: 1000,
            },
            shapeOptions: {
              // color: '#ff0000',
            },
          },
          circle: {
            shapeOptions: {
              color: '#ff0000',
            },
          },
          marker: true,
          circlemarker: false
        },
        // edit: {
        //   featureGroup: drawnItems,
        //   remove: true,
        //   buffer: {
        //     replacePolylines: false,
        //     separateBuffer: false,
        //   },
        // },
      });
      mymap.addControl(drawControl);

      mymap.on('draw:created', function (evt) {
        console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
        console.log("evt",evt);
        console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
        var type = evt.layerType,
          layer = evt.layer;

        drawnItems.addLayer(layer);

        layer.on('click', function (event) {
          new LeafletToolbar.EditToolbar.Popup(event.latlng, {
            actions: editActions
          }).addTo(mymap, layer);
        });
      });
      L.control.mousePosition().addTo(mymap);
      // mymap.on("zoomend", FlightState)

      // flightArr.push(new Flight(mymap, svg));

      // // var plane1 = new Flight(mymap, svg);

      // planeInterval = setInterval(function () {
      //   FlightState()
      // }, 100)            
      // var latlngs = [
      //   [30.655822, 104.081534],
      //   // [31.2, 121.4],
      //   [39.92, 116.46]
      // ];
      // var polyline = L.polyline(latlngs, {color: '#fff',weight:1}).addTo(mymap);
      // var polyline = L.polyline(latlngs, {color: '#FF0000',weight:1,dashArray: '10 10'}).addTo(mymap);
    })

  // L.marker([30.6268660000, 104.1528940000]).addTo(mymap).bindTooltip("my tooltip text").openTooltip();
  // L.marker([31.2, 121.4]).addTo(mymap).bindPopup("<b>上海</b>").openPopup();
  // L.marker([39.92, 116.46]).addTo(mymap).bindPopup("<b>北京</b>").openPopup();
  $('.new-btn').click(function () {
    // $('.modal').show()
  })
  $('.new-btn').click(function () {
    $('.modal').show()
  })
  // d3.json("data/geojson/china/china.json")
  //   .then((data) => {
  //     L.geoJSON(data, {
  //       style: {
  //         color: "#586a77",
  //         opacity: 1,
  //         weight: 1.5,
  //         fillColor: "#323c48",
  //         fillOpacity: .8
  //       },
  //       onEachFeature: ((feature, layer) => {
  //         layer.on({
  //           mouseover: ((e) => {
  //             var layer = e.target;
  //             layer.setStyle(hoverStyle)
  //           }),
  //           mouseout: ((e) => {
  //             var layer = e.target;
  //             layer.setStyle(style)
  //           }),
  //           // click: ((e) => {})
  //         })
  //       })
  //     }).bindPopup(function (layer) {
  //       return layer.feature.properties.name;
  //     }).addTo(mymap);
  //   })

