function Flight(map, svg) {
  this.map = map,
  this.svg = svg, 
  this.curZoom = this.map.getZoom() // 返回地图此时的缩放级别
  this.beginPoint = { // 起点
      lat: 0,
      lng: 0
  }
   this.endPoint = { // 终点
      lat: 0,
      lng: 0
  }
  this.bp_px = null
  this.ep_px = null
  this.mp_px = null
  this.group = null
  this.bp_circle = null // 起点圆形标记
  this.ep_circle = null // 终点圆形标记
  this.mid_circle = null // 中转点圆形标记
  this.radius = 6 * this.curZoom / 3 // 根据缩放级别计算标记的大小
  this.plane = null
  this.pos_plane = { // 飞机位置（像素坐标）
      x: 0,
      y: 0
  }
  this.w_plane = 64 // 飞机宽度
  this.h_plane = 64 // 飞机高度
  this.spos = 0
  this.rot = 0
  this.midPoint = {
      lat: 0,
      lng: 0
  }
  this.road = null
  this.road_points = null
  this.group_road = null
  this.clipPath = null
  this.clipPath_rect = null
  this.planeColor = "white" // 飞机颜色
  this.roadColor = "white"  // 航线颜色
  this.beginColor = "blue"  // 起点颜色
  this.endColor = "red"     // 终点颜色
  this.isCleaning = false
  // 2019-06-24
  this._latlngs = []
  this._durations
  this._autostart = false
  this.loop =false
  this.planeInterval = null
  // 2019-06-25
  this._currentDuration = 0
  this._currentIndex = 0
  this.notStartedState = 0
  this.endedState = 1
  this.pausedState = 2
  this.runState = 3
  this._state = 0
  this._startTime = 0
  this._startTimeStamp = 0  // timestamp given by requestAnimFrame
  this._pauseStartTime = 0
  this._animId = 0
  this._animRequested = false;
  this._currentLine = []
  this._stations = {}
  this.pointArr = []

  /**
   * 飞机初始化
   *
   * @param {*} a 起点经纬度坐标
   * @param {*} b 终点经纬度坐标
   */
  // this.init = function (a, b) {
  // 2019-06-24
  this.init = function (latlngs, durations, options, planeInfo) {
    this._latlngs = latlngs.map(function(e, index) {
      return L.latLng(e);
    });
    this.planeInfo = planeInfo;
    if (durations instanceof Array) {
      this._durations = durations;
    } else {
        this._durations = this._createDurations(this._latlngs, durations);
    }

    this.planeColor = options.planeColor;
    this.roadColor = options.roadColor;
    this.beginColor = options.beginColor;
    this.endColor = options.endColor;
    this._autostart = options.autostart;
    this.loop = options.loop;
    console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
    console.log("_latlngs", this._latlngs);
    console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");

    var polyline = L.polyline(latlngs, {color: this.roadColor,weight:1}).addTo(mymap);
    
    this.beginPoint.lat = this._latlngs[0].lat // 起点经度
    this.beginPoint.lng = this._latlngs[0].lng // 起点纬度
    this.bp_px = this.map.latLngToLayerPoint([this._latlngs[0].lat, this._latlngs[0].lng]) // 把地理坐标转化为像素坐标
    // 把起点像素坐标赋值给飞机像素坐标位置
    this.pos_plane.x = this.bp_px.x
    this.pos_plane.y = this.bp_px.y;
    this.group = this.svg.append("g")

    var self = this
    this._latlngs.map(function (point) {
      var point_px = self.map.latLngToLayerPoint([point.lat, point.lng])
      var point = self.group.append("circle").attr("fill", self.beginColor).attr("cx", point_px.x).attr("cy", point_px.y).attr("r", self.radius);
      self.pointArr.push(point)
    })
    
    this.load_plane()
    if(this._autostart) {
      this.start()
      // 缩放结束重新定位
      this.map.on("zoomend", function () {
        self._latlngs.forEach((item,i) => {
          var point_px = self.map.latLngToLayerPoint([item.lat, item.lng])
          self.pointArr[i].attr("cx", point_px.x).attr("cy", point_px.y)
        });
        if(!self.isStarted()) {
          self.pos_plane = self.map.latLngToLayerPoint([self._latlngs[0].lat, self._latlngs[0].lng]) // 把地理坐标转化为像素坐标
          self.setPlanePosition()
        } else if (self.isEnded()) {
          self.pos_plane = self.map.latLngToLayerPoint([self._latlngs[self._latlngs.length-1].lat, self._latlngs[self._latlngs.length-1].lng]) // 把地理坐标转化为像素坐标
          self.setPlanePosition()
        } else if (self.isPaused()) {
          var latlng = self.map.layerPointToLatLng(self.pos_plane)
          console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
          console.log(self.pos_plane);
          console.log(latlng);
          console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
          var pos_plane1 = self.map.latLngToLayerPoint([latlng.lat, latlng.lng])
          console.log(pos_plane1);
          self.setPlanePosition()
        }
      })
    }
  }
  /**
   * 绘制飞机
   *
   */
  this.load_plane = function () {
      var self = this

      this.plane = this.group.append("g").attr("id", "plane").attr("transform", function () {
        
        var a = "translate(" + self.pos_plane.x + "," + self.pos_plane.y + ")", j = "scale(1)";
        return a + j;
      }).attr("fill", this.planeColor);
      this.plane.append("path").attr("d", this.d_plane)
      this._loadLine(0);
      this.setPlanePosition()
      d3.select("#plane").data(self.planeInfo) // 绑定事件
      .on("mouseover", mouseOver).on("mouseout", mouseOut);
      d3.select("#plane").on("click", function () {
        if(self.isPaused()) {
          self.resume()
        } else {
          self.pause()
        }
      });
  }
  this.setPlanePosition = function () {
    var width = this.plane.node().getBBox().width / 2
    var height = this.plane.node().getBBox().width / 2
    // var width = this.plane.node().getBoundingClientRect()
    // var height = this.plane.node().getBoundingClientRect().height / 2
    // console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
    // console.log("width",width);
    // console.log("height",height);
    // console.log("curZoom ",this.map.getZoom() );
    // console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
    var translateX = this.pos_plane.x - width
    var translateY = this.pos_plane.y - height
    if(this._currentLine.length !==0) {
      var origin = this.map.latLngToLayerPoint([this._currentLine[0].lat, this._currentLine[0].lng])
      var end = this.map.latLngToLayerPoint([this._currentLine[1].lat, this._currentLine[1].lng])
      var x = end.x - origin.x;
      var y = end.y - origin.y;
    }
    // console.log(this._currentLine);
    // console.log('origin',origin);
    // console.log('end',end);
    // if(end.x > origin.x && end.y > origin.y) {
    //   console.log("左下飞右上");
    // } else if(end.x > origin.x && end.y < origin.y) {
    //   console.log("左上飞右下");
    // } else if(end.x < origin.x && end.y > origin.y) {
    //   console.log("右下飞左上");
    // } else if(end.x < origin.x && end.y < origin.y) {
    //   console.log("右上飞左下");
    // }
    
    var angle = Victor(x, y).angleDeg(); // 生成角度

    // var degree= Math.atan2(x,y) / (Math.PI/180)
    // console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
    // console.log("translateX",translateX);
    // console.log("translateY",translateY);
    // console.log("angle",angle);
    // // console.log("degree",degree);
    // // console.log("origin",origin);
    // // console.log("x",x);
    // console.log("y",y);
    // console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
    // var rot = this._currentIndex == 0 ? degree - 45 : degree + 90
    // var rotateScale = Math.abs(angle) / 90;
    // var duijiao = this.plane.node().getBBox().width * Math.sqrt(2)
    // console.log(rotateScale)
    // console.log(duijiao)
    // if(angle > 0) {
    //   if(rotateScale >1) {
    //     translateX = translateX + this.plane.node().getBBox().width
    //     translateY = translateY + this.plane.node().getBBox().width * (rotateScale - 1)
    //   } else {
    //     translateX = translateX + duijiao * (1 - rotateScale)
    //   }
    // } else {
    //   translateY = translateY + this.plane.node().getBBox().width * rotateScale
    //   if(rotateScale >1) {
    //     translateX = translateX + this.plane.node().getBBox().width * (rotateScale - 1)
    //   }
    // }
    
    // if(rotateScale < 1 && angle > 1) {
    //   translateX = translateX - this.plane.node().getBBox().width
    // } else if(rotateScale < 1 && angle < 1) {
    // }
    this.plane.attr("transform", function () {
      var a = `translate(${translateX},${translateY})`, b = `rotate(${angle} ${width} ${height})`, j = "scale(1)";
      return a + b + j;
    })
  }
  this.setPlaneColor = function (a) {
      this.planeColor = a;
      this.plane && this.plane.attr("fill", a)
  }
  this.setRoadColor = function (a) {
      this.roadColor = a;
      this.road && this.road.attr("stroke", a)
  }
  this.setBeginColor = function (a) {
      this.beginColor = a;
      this.bp_circle && this.bp_circle.attr("fill", a)
  }
  this.setEndColor = function (a) {
      this.endColor = a;
      this.ep_circle && this.ep_circle.attr("fill", this.endColor)
  }
  this.isEnd = function () {
      return Math.abs(this.spos - 1) < 1e-4 // 0.0001
  }
  /**
   *清楚起点终点标记和航线
   *
   */
  this.delete = function () {
      this.bp_circle.transition().duration(500).style("opacity", "0.0").attr("r", 0).remove();
      this.road.transition().duration(1e3).style("opacity", "0.0").attr("stroke-width", 0).remove();
      this.ep_circle.transition().duration(1500).style("opacity", "0.0").attr("r", 0).remove();
      this.group.transition().delay(1500).style("opacity", "0.0").remove()
  }
  // 2019-06-25
  this.isRunning =function () {
    return this._state === this.runState;
  }

  this.isEnded = function () {
    return this._state === this.endedState;
  }

  this.isStarted = function () {
    return this._state !== this.notStartedState;
  }

  this.isPaused = function () {
    return this._state === this.pausedState;
  }
  // 开始
  this.start = function () {
    console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
    console.log("开始");
    console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
    if (this.isRunning()) {
        return;
    }

    if (this.isPaused()) {
        this.resume();
    } else {
        this._loadLine(0);
        this._startAnimation();
    }
  }
  // 暂停
  this.pause = function () {
    if (! this.isRunning()) {
        return;
    }
    console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
    console.log("Pause");
    console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
    this._pauseStartTime = Date.now();
    this._state = this.pausedState;
    this._stopAnimation();
    this._updatePosition();
  }
  // 继续
  this.resume = function () {
    if (! this.isPaused()) {
        return;
    }
    // update the current line
    var latlng = this.map.layerPointToLatLng(this.pos_plane)
    console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
    console.log("latlng",latlng);
    console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");

    this._currentLine[0] = latlng;
    this._currentDuration -= (this._pauseStartTime - this._startTime);
    this._startAnimation();
  }
  this._loadLine = function (index) {
    this._currentIndex = index;
    this._currentDuration = this._durations[index];
    this._currentLine = this._latlngs.slice(index, index + 2);
  }
  this._startAnimation = function () {
    this._state = this.runState;
    this._animId = L.Util.requestAnimFrame(function(timestamp) {
        this._startTime = Date.now();
        this._startTimeStamp = timestamp;
        this._animate(timestamp);
    }, this, true);
    this._animRequested = true;
  }

  this._animate = function(timestamp, noRequestAnim) {
    this._animRequested = false;

    // find the next line and compute the new elapsedTime
    var elapsedTime = this._updateLine(timestamp);

    if (this.isEnded()) {
        // no need to animate
        return;
    }

    if (elapsedTime != null) {
        // compute the position
        var p = this._interpolatePosition(this._currentLine[0],
            this._currentLine[1],
            this._currentDuration,
            elapsedTime);
        this.pos_plane = this.map.latLngToLayerPoint([p.lat, p.lng]) // 把地理坐标转化为像素坐标
        this.setPlanePosition()
    }

    if (! noRequestAnim) {
        this._animId = L.Util.requestAnimFrame(this._animate, this, false);
        this._animRequested = true;
    }
  }

  this._interpolatePosition = function(p1, p2, duration, t) {
    var k = t/duration;
    k = (k > 0) ? k : 0;
    k = (k > 1) ? 1 : k;
    return L.latLng(p1.lat + k * (p2.lat - p1.lat),
        p1.lng + k * (p2.lng - p1.lng));
  }

  this._updateLine = function(timestamp) {
    // time elapsed since the last latlng
    var elapsedTime = timestamp - this._startTimeStamp;

    // not enough time to update the line
    if (elapsedTime <= this._currentDuration) {
        return elapsedTime;
    }

    var lineIndex = this._currentIndex;
    var lineDuration = this._currentDuration;
    var stationDuration;

    while (elapsedTime > lineDuration) {
      console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
      console.log("Arrived");
      console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
        // substract time of the current line
        elapsedTime -= lineDuration;
        stationDuration = this._stations[lineIndex + 1];

        // test if there is a station at the end of the line
        if (stationDuration !== undefined) {
            if (elapsedTime < stationDuration) {
                // this.setLatLng(this._latlngs[lineIndex + 1]);
                return null;
            }
            elapsedTime -= stationDuration;
        }

        lineIndex++;

        // test if we have reached the end of the polyline
        if (lineIndex >= this._latlngs.length - 1) {

            if (this.loop) {
                lineIndex = 0;
            } else {
                // place the marker at the end, else it would be at
                // the last position
                // this.setLatLng(this._latlngs[this._latlngs.length - 1]);
                this.stop(elapsedTime);
                return null;
            }
        }
        lineDuration = this._durations[lineIndex];
    }

    this._loadLine(lineIndex);
    this._startTimeStamp = timestamp - elapsedTime;
    this._startTime = Date.now() - elapsedTime;
    return elapsedTime;
  }

  this._createDurations = function (latlngs, duration) {
    var lastIndex = latlngs.length - 1;
    var distances = [];
    var totalDistance = 0;
    var distance = 0;

    // compute array of distances between points
    for (var i = 0; i < lastIndex; i++) {
        distance = latlngs[i + 1].distanceTo(latlngs[i]);
        distances.push(distance);
        totalDistance += distance;
    }

    var ratioDuration = duration / totalDistance;

    var durations = [];
    for (i = 0; i < distances.length; i++) {
        durations.push(distances[i] * ratioDuration);
    }

    return durations;
  }

  this.stop = function (elapsedTime) {
    if (this.isEnded()) {
        return;
    }

    this._stopAnimation();

    if (typeof(elapsedTime) === 'undefined') {
        // user call
        elapsedTime = 0;
        this._updatePosition();
    }

    this._state = this.endedState;
  }

  this._stopAnimation = function () {
    console.log("■■■■■■■■■■■■■■"+this._animRequested+"■■■■■■■■■■■■■■■■■■■■■■");

    console.log("END");

    if (this._animRequested) {
      console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
        L.Util.cancelAnimFrame(this._animId);
        this._animRequested = false;
    }
  }

  this._updatePosition = function() {
    var elapsedTime = Date.now() - this._startTime;
    // 解决暂停的 bug
    // this._animate(this._startTimeStamp + elapsedTime, true);
    this.setPlanePosition()
  }

  // this.d_plane = "M59.79,12.92C62.42,9.4,64,5.75,64,3.15a3.62,3.62,0,0,0-.49-2,1.6,1.6,0,0,0-.29-.37,1.68,1.68,0,0,0-.34-.27,3.56,3.56,0,0,0-2-.51c-2.6,0-6.25,1.58-9.77,4.21-2.84,2.13-5.69,5.12-9.62,9.27L39.34,15.7l-7.62-2.28,0,0a1.71,1.71,0,0,0,0-2.41L30.36,9.61a1.71,1.71,0,0,0-1.21-.5,1.68,1.68,0,0,0-1.21.5l-2.06,2.06-1.09-.33a1.71,1.71,0,0,0-.14-2.25L23.27,7.7a1.71,1.71,0,0,0-1.21-.5,1.67,1.67,0,0,0-1.2.5L19,9.59,11.21,7.27a1.94,1.94,0,0,0-.55-.08,2.05,2.05,0,0,0-1.43.58L6.5,10.5A1.61,1.61,0,0,0,6,11.62,1.56,1.56,0,0,0,6.85,13l16.3,9.11a2.84,2.84,0,0,1,.4.3l4.65,4.65C23.85,31.66,20,36.09,17,40L16.15,41,3.54,39.86H3.32a2.33,2.33,0,0,0-1.56.65L.49,41.76A1.58,1.58,0,0,0,0,42.89a1.55,1.55,0,0,0,.92,1.43l8.87,4.21a2.07,2.07,0,0,1,.34.24l.74.73a5.38,5.38,0,0,0-.35,1.71,2.24,2.24,0,0,0,.62,1.63l0,0h0a2.25,2.25,0,0,0,1.63.61,5.43,5.43,0,0,0,1.69-.35l.75.75a2,2,0,0,1,.23.33l4.2,8.85a1.57,1.57,0,0,0,1.41.93h0a1.58,1.58,0,0,0,1.12-.47l1.3-1.31a2.32,2.32,0,0,0,.62-1.56c0-.07,0-.13,0-.16L23,47.85,24,47c3.86-3,8.3-6.9,12.87-11.24l4.65,4.66a2.49,2.49,0,0,1,.3.4L51,57.13a1.58,1.58,0,0,0,2.54.37l2.74-2.74a2.08,2.08,0,0,0,.56-1.43,2,2,0,0,0-.07-.54L54.41,45l1.89-1.89a1.71,1.71,0,0,0,0-2.41l-1.39-1.38a1.71,1.71,0,0,0-2.25-.14l-.32-1.09,2.06-2.06a1.72,1.72,0,0,0,.5-1.21,1.69,1.69,0,0,0-.5-1.2L53,32.27a1.71,1.71,0,0,0-2.42,0h0L48.3,24.65l2.25-2.14C54.68,18.59,57.67,15.76,59.79,12.92Z"


  this.d_plane = 'M38.1,19.6c0.2-0.2,0.3-0.5,0.3-0.7s-0.1-0.6-0.3-0.7c-1.2-1-2.8-1.6-4.4-1.6l-8.7,0L12.2,0L8.2,0l6.3,16.5	l-5.9,0c-0.5,0-1.1,0.1-1.6,0.4L3.1,11L0,11l3.1,7.9L0,26.7l3.1,0l3.9-5.9c0.5,0.3,1,0.4,1.6,0.4l5.9,0L8.2,37.7h3.9l13-16.5l8.7,0	C35.4,21.2,36.9,20.6,38.1,19.6';
}



function tooltipHtml(d){	/* function to create html content string in tooltip div. */
  return "<h4>"+d.planeName+"</h4><table>"+
    "<tr><td>人数</td><td>"+(d.peopleCount)+"</td></tr>"+
    "<tr><td>飞行时间</td><td>"+(d.flightTime)+"</td></tr>"+
    "</table>";
}

function mouseOver(d){

  
  d3.select("#tooltip").transition().duration(200).style("opacity", .9);
  d3.select("#tooltip").html(tooltipHtml(d))
    .style("left", (d3.event.pageX) + "px")
    .style("top", (d3.event.pageY - 28) + "px");
}

function mouseOut(){
  d3.select("#tooltip").transition().duration(500).style("opacity", 0);
}

