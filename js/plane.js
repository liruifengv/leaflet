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

  /**
   * 飞机初始化
   *
   * @param {*} a 起点经纬度坐标
   * @param {*} b 终点经纬度坐标
   */
  // this.init = function (a, b) {
  // 2019-06-24
  this.init = function (latlngs, durations, options) {
    this._latlngs = latlngs.map(function(e, index) {
      return L.latLng(e);
    });

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
      self.group.append("circle").attr("fill", self.beginColor).attr("cx", point_px.x).attr("cy", point_px.y).attr("r", self.radius);
    })
    
    this.load_plane()
    if(this._autostart) {
      this.start()
      this.map.on("zoomend", function () {
        // self._latlngs.map(function (point) {
        //   var point_px = self.map.latLngToLayerPoint([point.lat, point.lng])
        //   self.group.append("circle").attr("fill", self.beginColor).attr("cx", point_px.x).attr("cy", point_px.y).attr("r", self.radius);
        // })
        if(!self.isStarted) {
          var plane_px = self.map.latLngToLayerPoint([self._latlngs[0].lat, self._latlngs[0].lng]) // 把地理坐标转化为像素坐标
          self.pos_plane = plane_px
          self.plane.attr("transform", function () {
              var a = "translate(" + plane_px.x + "," + plane_px.y + ")", j = "scale(0.4)";
              return a + j;
          })
        } else if (self.isEnded) {
          var plane_px = self.map.latLngToLayerPoint([self._latlngs[self._latlngs.length-1].lat, self._latlngs[self._latlngs.length-1].lng]) // 把地理坐标转化为像素坐标
          self.pos_plane = plane_px
          self.plane.attr("transform", function () {
              var a = "translate(" + plane_px.x + "," + plane_px.y + ")", j = "scale(0.4)";
              return a + j;
          })
        }
      })
    }
  }
  /**
   * 获取航线飞行的区域
   *
   * @param {*} bp_px // 起点的像素坐标
   * @param {*} mp_px // 中转点的像素坐标
   * @param {*} pos_plane // 飞机位置的像素坐标
   * @returns [矩形横坐标，矩形纵坐标，矩形宽度，矩形高度]
   */
  this.getClipRect = function (bp_px, mp_px, pos_plane) {
      var minX, minY, maxX, maxY, h, i;
      minX = Math.min(bp_px.x, pos_plane.x); // 起点横坐标和飞机横坐标求最小值
      minY = Math.min(bp_px.y, pos_plane.y); // 起点纵坐标和飞机纵坐标求最小值
      maxX = Math.max(bp_px.x, pos_plane.x);  // 起点横坐标和飞机横坐标求最大值
      maxY = Math.max(bp_px.y, pos_plane.y);  // 起点纵坐标和飞机纵坐标求最大值
      // 终点横坐标 - 起点横坐标的绝对值 是否大于等于  终点纵坐标 - 起点纵坐标的绝对值
      Math.abs(this.ep_px.x - this.bp_px.x) >= Math.abs(this.ep_px.y - this.bp_px.y) 
      ? (h = 0, i = 800) : (h = 800, i = 0);
      return [minX - h, minY - i, maxX - minX + 2 * h, maxY - minY + 2 * i]
  }
  /**
   * 绘制飞机
   *
   */
  this.load_plane = function () {
      var self = this
      this.plane = this.group.append("g").attr("id", "plane").attr("transform", function () {
        
        var a = "translate(" + self.pos_plane.x + "," + self.pos_plane.y + ")", j = "scale(0.4)";
        return a + j;
      }).attr("fill", this.planeColor), this.plane.append("path").attr("d", this.d_plane)
      d3.select("#plane").data(planeData) // 绑定事件
      .on("mouseover", mouseOver).on("mouseout", mouseOut);
      d3.select("#plane").on("click", function () {
        if(self.isPaused()) {
          self.resume()
        } else {
          self.pause()
        }
      });
  }
  /**
   *
   * 渲染
   */
  this.render = function () {
      var a = this.getClipRect(this.bp_px, this.mp_px, this.pos_plane);
      this.clipPath_rect.attr("x", a[0]).attr("y", a[1]).attr("width", a[2]).attr("height", a[3]);
      // 航线数组
      this.road_points = [
        [this.bp_px.x, this.bp_px.y],
        [this.ep_px.x, this.ep_px.y]
      ]
      this.road.datum(this.road_points).attr("d", d3.line().curve(d3.curveBundle.beta(.5)));


      var b = this.w_plane, 
        c = this.h_plane, 
        d = this.pos_plane.x, 
        e = this.pos_plane.y, 
        f = this.rot, 
        g = this.spos, 
        h = d3.scaleLinear().domain([0, .9, 1]).range([.3, .5, 0]);
        this.plane.attr("transform", function () {
          // var a = "translate(" + d + "," + e + ")", i = "rotate(" + f + ")", j = "scale(" + h(g) + ")", k = "translate(" + b / -2 + "," + c / -2 + ")";
          var a = "translate(" + d + "," + e + ")", i = "rotate(" + f + ")", j = "scale(0.4)", k = "translate(" + b / -2 + "," + c / -2 + ")";
          return a + i + j + k
      })
  }
  /**
   * 更新飞机状态
   *
   */
  this.update = function () {
      this.curZoom = this.map.getZoom();
      this.radius = 6 * this.curZoom / 3;
      this.bp_px = this.map.latLngToLayerPoint([this.beginPoint.lat, this.beginPoint.lng]);
      this.ep_px = this.map.latLngToLayerPoint([this.endPoint.lat, this.endPoint.lng]);
      this.mp_px = this.map.latLngToLayerPoint([this.midPoint.lat, this.midPoint.lng]);

      this.road_points = [
        [this.bp_px.x, this.bp_px.y],
        // [this.mp_px.x, this.mp_px.y],
        [this.ep_px.x, this.ep_px.y]
      ]
      this.road.datum(this.road_points).attr("d", d3.line().curve(d3.curveBundle.beta(.5)));

      this.spos = this.spos <= 1 ? this.spos + .01 : this.spos;
      var a = this.road.node().getTotalLength(), 
          b = this.road.node().getPointAtLength(this.spos * a);

      this.pos_plane.x = b.x; // 更新飞机位置
      this.pos_plane.y = b.y;

      var c = this.spos <= 1 ? this.spos + .01 : this.spos, 
          d = this.road.node().getPointAtLength(c * a), 
          e = Victor(d.x - this.pos_plane.x, d.y - this.pos_plane.y).angleDeg();
      this.rot = this.isEnd() ? 0 : e + 45
      if(this.isEnd()) {
        this._currentIndex ++;
        clearInterval(planeInterval)
        console.log("_currentIndex",this._currentIndex);
      }
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
      // this.bp_circle.transition().duration(500).style("opacity", "0.0").attr("r", 0).remove();
      // this.road.transition().duration(1e3).style("opacity", "0.0").attr("stroke-width", 0).remove();
      // this.ep_circle.transition().duration(1500).style("opacity", "0.0").attr("r", 0).remove();
      // this.group.transition().delay(1500).style("opacity", "0.0").remove()
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
            var plane_px = this.map.latLngToLayerPoint([p.lat, p.lng]) // 把地理坐标转化为像素坐标
            this.pos_plane = plane_px
        // console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
        // console.log("_currentDuration",this._currentDuration);
        // console.log("_currentLine",this._currentLine[1]);
        // console.log("p",p);
        // console.log("plane_px",plane_px);
        // console.log("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■");
        this.plane.attr("transform", function () {
          // var a = "translate(" + d + "," + e + ")", i = "rotate(" + f + ")", j = "scale(" + h(g) + ")", k = "translate(" + b / -2 + "," + c / -2 + ")";
          var a = "translate(" + plane_px.x + "," + plane_px.y + ")", j = "scale(0.4)";
          return a + j;
      })
        // this.setLatLng(p);
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
    this._animate(this._startTimeStamp + elapsedTime, true);
  }

  this.d_plane = "M59.79,12.92C62.42,9.4,64,5.75,64,3.15a3.62,3.62,0,0,0-.49-2,1.6,1.6,0,0,0-.29-.37,1.68,1.68,0,0,0-.34-.27,3.56,3.56,0,0,0-2-.51c-2.6,0-6.25,1.58-9.77,4.21-2.84,2.13-5.69,5.12-9.62,9.27L39.34,15.7l-7.62-2.28,0,0a1.71,1.71,0,0,0,0-2.41L30.36,9.61a1.71,1.71,0,0,0-1.21-.5,1.68,1.68,0,0,0-1.21.5l-2.06,2.06-1.09-.33a1.71,1.71,0,0,0-.14-2.25L23.27,7.7a1.71,1.71,0,0,0-1.21-.5,1.67,1.67,0,0,0-1.2.5L19,9.59,11.21,7.27a1.94,1.94,0,0,0-.55-.08,2.05,2.05,0,0,0-1.43.58L6.5,10.5A1.61,1.61,0,0,0,6,11.62,1.56,1.56,0,0,0,6.85,13l16.3,9.11a2.84,2.84,0,0,1,.4.3l4.65,4.65C23.85,31.66,20,36.09,17,40L16.15,41,3.54,39.86H3.32a2.33,2.33,0,0,0-1.56.65L.49,41.76A1.58,1.58,0,0,0,0,42.89a1.55,1.55,0,0,0,.92,1.43l8.87,4.21a2.07,2.07,0,0,1,.34.24l.74.73a5.38,5.38,0,0,0-.35,1.71,2.24,2.24,0,0,0,.62,1.63l0,0h0a2.25,2.25,0,0,0,1.63.61,5.43,5.43,0,0,0,1.69-.35l.75.75a2,2,0,0,1,.23.33l4.2,8.85a1.57,1.57,0,0,0,1.41.93h0a1.58,1.58,0,0,0,1.12-.47l1.3-1.31a2.32,2.32,0,0,0,.62-1.56c0-.07,0-.13,0-.16L23,47.85,24,47c3.86-3,8.3-6.9,12.87-11.24l4.65,4.66a2.49,2.49,0,0,1,.3.4L51,57.13a1.58,1.58,0,0,0,2.54.37l2.74-2.74a2.08,2.08,0,0,0,.56-1.43,2,2,0,0,0-.07-.54L54.41,45l1.89-1.89a1.71,1.71,0,0,0,0-2.41l-1.39-1.38a1.71,1.71,0,0,0-2.25-.14l-.32-1.09,2.06-2.06a1.72,1.72,0,0,0,.5-1.21,1.69,1.69,0,0,0-.5-1.2L53,32.27a1.71,1.71,0,0,0-2.42,0h0L48.3,24.65l2.25-2.14C54.68,18.59,57.67,15.76,59.79,12.92Z"
}


function tooltipHtml(d){	/* function to create html content string in tooltip div. */
return "<h4>"+d.name+"</h4><table>"+
  "<tr><td>id</td><td>"+(d.id)+"</td></tr>"+
  "<tr><td>count</td><td>"+(d.count)+"</td></tr>"+
  "<tr><td>xinghao</td><td>"+(d.xinghao)+"</td></tr>"+
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

var planeData = [
{
  id: 1,
  name: '波音747',
  xinghao: 3124,
  count: 65466
}
]