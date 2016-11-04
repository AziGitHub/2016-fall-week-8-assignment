console.log('8.3');

var m = {t:100,r:100,b:100,l:100};
var outerWidth = document.getElementById('canvas').clientWidth,
    outerHeight = document.getElementById('canvas').clientHeight;
var w = outerWidth - m.l - m.r,
    h = outerHeight - m.t - m.b;

var plot = d3.select('.canvas')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight)
    .append('g')
    .attr('transform','translate(' + m.l + ',' + m.t + ')');

//d3.set to hold a unique array of airlines
var airlines = d3.set();

//Scale
var scaleX = d3.scaleTime()
    .range([0,w]);
var scaleColor = d3.scaleOrdinal()
    .domain(['B6','UA','SY','VX','AS'])
    .range(['#fd6b5a','#03afeb','orange','#06ce98','blue']);
var scaleY = d3.scaleLinear()
    .domain([0,1000])
    .range([h,0]);

//Axis
var axisX = d3.axisBottom()
    .scale(scaleX)
    .tickSize(-h);
var axisY = d3.axisLeft()
    .scale(scaleY)
    .tickSize(-w);

//Line generator
var lineGenerator = d3.line()
    .x(function(d){return scaleX(d.travelDate)})
    .y(function(d){return scaleY(d.price)})
    .curve(d3.curveStepBefore);


d3.queue()
    .defer(d3.csv, '../data/bos-sfo-flight-fare.csv',parse)
    .await(function(err, data){

        //Mine the data to set the scales
        scaleX.domain( d3.extent(data,function(d){return d.travelDate}) );
        scaleColor.domain(airlines.values());

        //Add buttons
        d3.select('.btn-group')
            .selectAll('.btn')
            .data( airlines.values() )
            .enter()
            .append('a')
            .html(function(d){return d})
            .attr('href','#')
            .attr('class','btn btn-default')
            .style('color','white')
            .style('background',function(d){return scaleColor(d)})
            .style('border-color','white')
            .on('click',function(d){
              //  console.log(d);
                //Hint: how do we filter flights for particular airlines?
var results=data.filter(function(el){if(el.airline ==d){return true;}});
                results.sort(function(a,b){return a.travelDate-b.travelDate})
                //How do we then update the dots?
                //console.log(results.length);
                draw(results);
            });

        //Draw axis
        plot.append('g').attr('class','axis axis-x')
            .attr('transform','translate(0,'+h+')')
            .call(axisX);
        plot.append('g').attr('class','axis axis-y')
            .call(axisY);
        plot.append('path').attr('class','time-series');
        //draw(data);

    });

function draw(rows){
    //IMPORTANT: data transformation
    var flightsByTravelDate = d3.nest().key(function(d){
        return d.travelDate;})
        .entries(rows);

    flightsByTravelDate.forEach(function(day){
       day.averagePrice = d3.mean(day.values, function(d){return d.price});
    });

    //Draw dots
    //UPDATE
  //  var node = plot.selectAll('.node')
  //      .data(rows,function(d){return d.year});

      var node = plot.selectAll('.node')
         .data(rows,function(d){return d.travelDate});


    //ENTER
    var nodeEnter = node.enter()
        .append('circle')
        .attr('class','node');
//UPDATE + ENTER
    nodeEnter
        .attr('cx',function(d){return scaleX(d.travelDate)})
        .attr('cy',function(d){return scaleY(0)})
        .merge(node)
        .attr('r',4)
        .transition()
        .attr('cx',function(d){return scaleX(d.travelDate)})
        .attr('cy',function(d){return scaleY(d.price)})
        .style('fill',function(d){return scaleColor(d.airline)});
    //EXIT
    node.exit().remove();

    //Draw <path>

    plot.select('.time-series')
        .datum(rows)
        .transition()
        .attr('d',function(datum){
            return lineGenerator(datum);
        })
        .style('fill','none')
        .style('stroke-width','2px')
        .style('stroke',function(datum){
            return scaleColor(datum[0].airline);
        });

}

function parse(d){

    if( !airlines.has(d.airline) ){
        airlines.add(d.airline);
    }

    return {
        airline: d.airline,
        price: +d.price,
        travelDate: new Date(d.travelDate),
        duration: +d.duration,
        id: d.id
    }
}