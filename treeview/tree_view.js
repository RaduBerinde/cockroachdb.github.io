var treeData = {
  title: "render",
  verbose: [
    ["a, b, n, sq"]
  ],
  children: [
    {
      title: "filter",
      verbose: [ 
        [ "(b % 2) != (sq %2)" ]
      ],
      children: [
        {
          title: "hash-join",
          verbose: [ 
            [ "full outer", "column6 = sq", ],
            [ "full outer", "column6 = sq more info", "lots", "of", "rows", "here", ],
            [ "full outer", "column6 = sq even more info", "lots", "of", "rows", "here", "even", "more", "stuff" ]
          ],
          children: [
            {
             title: "render",
              verbose: [
                ["a+b, a, b"]
              ],
              children: [ {
                title: "scan",
                verbose: [
                  [ "pairs@primary"]
                ]
              } ]
            },
            {
              title: "scan",
              verbose: [
                [ "square@primary" ],
                [ "square@primary", "long-winded stuff here, many words" ]
              ]
            }
          ]
        }
      ]
    }
  ]
};

// setLines sets n.lines to the set of visible lines of text (according to
// n.verbosity).
function setLines(n) {
  var v = n.verbosity

  if (n.verbose == null) {
    v = 0
  } else if (v > n.verbose.length) {
    v = n.verbose.length
  }
  n.lines = [ n.title ]
  if (v > 0) {
    n.lines = n.lines.concat(n.verbose[v-1])
  }
  console.log("set lines to: ", n.lines)
}

function setSize(n) {
  var numLines = n.lines.length 
  var numCols = 0
  for (var i = 0; i < numLines; i++) {
    if (numCols < n.lines[i].length) {
      numCols = n.lines[i].length
    }
  }
  n.size = [numLines * 12 + 30, numCols * 6 + 15];
}


function initTree(n) {
  n.verbosity = 0
  setLines(n)
  setSize(n)
  if (n.children) {
    n.children.forEach(item => initTree(item))
  }
}
initTree(treeData)

// Set the dimensions and margins of the diagram
var width = window.innerWidth,
    height = window.innerHeight;

var hMargin = 30,
    vMargin = 25;

if (width > 2 * hMargin) {
  width = width - 2 * hMargin;
}
if (height > 2 * vMargin) {
  height = height - 2 * vMargin;
}

// append the svg object to the body of the page
// appends a "group" element to "svg"
// moves the "group" element to the top left margin
var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .call(d3.zoom().on("zoom", zoom))
  .on("dblclick.zoom", null);

svg.append("rect")
  .attr("class", "background")
  .attr("width", "100%")
  .attr("height", "100%")

var svgGroup = svg.append("g")
  .attr("transform", "translate(" + hMargin + "," + vMargin + ")");

function zoom() {
  const currentTransform = d3.event.transform.translate(hMargin, vMargin);
  //const currentTransform = d3.event.transform;
  svgGroup.attr("transform", currentTransform);
}


const duration = 400;

// Assigns parent, children, height, depth
const flextree = d3.flextree;
const layout = flextree();
var root = layout.hierarchy(treeData)
root.x0 = height / 2;
root.y0 = 0;

update(root);

function update(source) {
  // Assigns the x and y position for the nodes
  var treeData = layout(root);
  // The flextree layout creates a vertical layout, with the root centered above
  // (0,0). We want a horizontal layout centered around the middle of the panel,
  // so we make the transformation.
  root.each(function(node) {
    var x = node.x,
        y = node.y;

    node.x = y;
    node.y = x + height/2;
    // Cannot modify xSize, ySize.
    node.width = node.ySize;
    node.height = node.xSize;
  })

  // Compute the new tree layout. We set them up in reverse so the parent nodes
  // are on top (useful for mouse events when we collapse a subtree).
  var nodes = treeData.descendants().reverse(),
      links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  //nodes.forEach(function(d){ d.y = d.depth * 180});

  // ****************** Nodes section ***************************

  // Update the nodes...
  var i = 0
  var node = svgGroup.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++i); });

  const plusMinusOpacityNormal = .6;
  const plusMinusOpacityHover = 1;
  const plusMinusOpacityDisabled = .1;

  function setMinusOpacity(gMinus, d) {
    if (d.data.verbosity > 0) {
      gMinus.attr("opacity", plusMinusOpacityNormal);
    } else {
      gMinus.attr("opacity", plusMinusOpacityDisabled);
    }
  }

  function setPlusOpacity(gPlus, d) {
    if (d.data.verbosity < d.data.verbose.length) {
      gPlus.attr("opacity", plusMinusOpacityNormal);
    } else {
      gPlus.attr("opacity", plusMinusOpacityDisabled);
    }
  }

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) {
      //return "translate(" + source.x0 + "," + source.y0 + ")";
      return "translate(" + (source.x0 + (source.width - d.width)/2) + "," + source.y0 + ")";
    })
    .on("mouseenter", function (d, i) {
      var g = d3.select(this)
      var gMinus = g.append("g").attr("id", "minusgroup")
        .attr("transform", "translate(" + d.width + "," + d.height + ")");

      var cx = - 18;
      var cy = - 6;

      gMinus.append("circle")
        .attr("id", "minus")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 5)
      gMinus.append("rect")
        .attr("fill", "white")
        .attr("x", cx-4)
        .attr("y", cy-1)
        .attr("width", 8)
        .attr("height", 2);

      gMinus.on("mouseenter", function () {
        if (d.data.verbosity > 0) {
          d3.select(this).attr("opacity", plusMinusOpacityHover);
        }
      })
      gMinus.on("mouseleave", function () {
        if (d.data.verbosity > 0) {
          d3.select(this).attr("opacity", plusMinusOpacityNormal);
        }
      });

      gMinus.on("click", function () {
        if (d.data.verbosity > 0) {
          d.data.verbosity = d.data.verbosity - 1
          setLines(d.data)
          setSize(d.data)
          update(d)
        }
      });

      setMinusOpacity(gMinus, d);

      var gPlus = g.append("g").attr("id", "plusgroup")
        .attr("transform", "translate(" + d.width + "," + d.height + ")");

      cx = cx + 11
      gPlus.append("circle")
        .attr("id", "plus")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 5)
      gPlus.append("rect")
        .attr("fill", "white")
        .attr("x", cx-4)
        .attr("y", cy-1)
        .attr("width", 8)
        .attr("height", 2);
      gPlus.append("rect")
        .attr("fill", "white")
        .attr("x", cx-1)
        .attr("y", cy-4)
        .attr("width", 2)
        .attr("height", 8);

      gPlus.on("mouseenter", function () {
        if (d.data.verbosity < d.data.verbose.length) {
          d3.select(this).attr("opacity", plusMinusOpacityHover);
        }
      })
      gPlus.on("mouseleave", function () {
        if (d.data.verbosity < d.data.verbose.length) {
          d3.select(this).attr("opacity", plusMinusOpacityNormal);
        }
      });
      gPlus.on("click", function () {
        if (d.data.verbosity < d.data.verbose.length) {
          d.data.verbosity = d.data.verbosity + 1
          setLines(d.data)
          setSize(d.data)
          update(d)
        }
      });

      setPlusOpacity(gPlus, d);
    })
    .on("mouseleave", function () {
      d3.select("#minusgroup").remove()
      d3.select("#plusgroup").remove()
    });

  // Show the node area (for debugging).
  nodeEnter.append("rect")
    .attr("id", "noderect")
    .attr("width", d => d.width)
    .attr("height", d => d.height)
    .style("fill-opacity", 0)
    //.style("stroke", "red")

  // Add Circle for the nodes
  nodeEnter.append("circle")
    .attr("id", "nodecircle")
    .attr("cx", d => d.width/2)
    .attr("cy", 10)
    .attr("r", 1e-6)
    .style("fill", function(d) {
      return d._children ? "lightsteelblue" : "#fff";
    })
    .on("click", click)
    .attr("cursor", function (d) {
          return d.children || d._children ? "pointer" : "";
    });



  // UPDATE

  // Transition to the proper position for the node
  var meh = nodeEnter.merge(node)
  var nodeUpdate = meh.transition()
    .duration(duration)
    .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
     });

  // Add labels for the nodes
  //nodeEnter.append("text")
  //    .attr("dy", ".35em")
  //    .attr("x", function(d) {
  //        return d.children || d._children ? -13 : 13;
  //    })
  //    .attr("text-anchor", function(d) {
  //        return d.children || d._children ? "end" : "start";
  //    })
  //    .text(function(d) { return d.data.title; });
  var sel = meh.selectAll("text")
    .data(function (d) {
      // Create a data element for each line of text.  We need to store the node
      // so we are able to access it inside the selection.
      return d.data.lines.map(function(x) {
        return { node: d, text: x };
      });
    });

  sel.enter().append("text")
    .attr("id", "words")
    .attr("text-anchor", "middle")
    .style("fill-opacity", 1e-6)
    .style("font-size", 1)
    .on("wheel.zoom", null)
     // Allow text selection.
    .on("mousedown", function() { d3.event.stopPropagation(); })
  .merge(sel)
    .text(function(d) { return d.text; })
    .attr("dy", function(d, i) { return (i + 2.35) +  "em" });
  
  sel.exit().remove();


  // Update the node attributes and style
  nodeUpdate.select("#nodecircle")
    .attr("cx", d => d.width/2)
    .attr("cy", 10)
    .attr("r", 5)
    .style("fill", function(d) {
        return d._children ? "lightsteelblue" : "#fff";
    });

  nodeUpdate.select("#noderect")
    .attr("width", d => d.width)
    .attr("height", d => d.height);

  nodeUpdate.selectAll("#words")
    .attr("x", function(d) { return d.node.width/2 })
    .style("fill-opacity", 1)
    .style("font-size", 12);

  nodeUpdate.select("#minusgroup")
    .attr("transform", function() {
      return "translate(" + source.width + "," + source.height + ")"
    })
    .call(setMinusOpacity, source);

  nodeUpdate.select("#plusgroup")
    .attr("transform", function() {
      return "translate(" + source.width + "," + source.height + ")"
    })
    .call(setPlusOpacity, source);


  // Remove any exiting nodes
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
          return "translate(" + (source.x + (source.width - d.width)/2) + "," + source.y + ")";
      })
      .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select("#nodecircle")
    .attr("r", 1e-6)
    .style("opacity", 1e-6)

  // On exit reduce the opacity of text labels
  nodeExit.selectAll("text")
    .style("fill-opacity", 1e-6)
    .style("font-size", 1);

  // ****************** links section ***************************

  // Update the links...
  var link = svgGroup.selectAll("path.link")
      .data(links, function(d) { return d.id; });

  // Enter any new links at the parent's previous position.
  var linkEnter = link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d){
        return collapsedDiagonal(source)
      });

  // UPDATE
  var linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate.transition()
      .duration(duration)
      .attr("d", function(d){ return diagonal(d, d.parent) });

  // Remove any exiting links
  var linkExit = link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        return collapsedDiagonal(source)
      })
      .remove();

  // Store the old positions for transition.
  nodes.forEach(function(d){
    d.x0 = d.x;
    d.y0 = d.y;
  });

  function path(x0, y0, x1, y1) {
    return `M ${x0} ${y0}
            C ${(x0 + x1) / 2} ${y0},
              ${(x0 + x1) / 2} ${y1},
              ${x1} ${y1}`
  }

  // Creates a curved (diagonal) path from parent to the child nodes
  function diagonal(s, d) {
    return path(s.x + s.width/2, s.y+10, d.x+d.width/2, d.y+10)
  }

  function collapsedDiagonal(s) {
    return path(s.x0 + s.width/2, s.y0+10, s.x0+s.width/2, s.y0+10)
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }
}
