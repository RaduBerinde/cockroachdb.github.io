var treeData = {
  name: "render",
  attrs: [ "a, b, n, sq" ],
  children: [
    {
      name: "filter",
      attrs: [ "(b % 2) != (sq %2)" ],
      children: [
        {
          name: "hash-join",
          attrs: [ "full outer", "column6 = sq", "lots", "of", "rows", "here", "for", "reals" ],
          children: [
            {
             name: "render",
              attrs: ["a+b, a, b"],
              children: [ {
                name: "scan",
                attrs: ["pairs@primary"]
              } ]
            },
            {
              name: "scan",
              attrs: ["square@primary this is a super wide thingy"]
            }
          ]
        }
      ]
    }
  ]
};

var setSizes = function(n) {
  numLines = 1
  numCols = n.name.length
  if (n.attrs) {
    numLines += n.attrs.length
    for (var i = 0; i < n.attrs.length; i++) {
      if (numCols < n.attrs[i].length) {
        numCols = n.attrs[i].length
      }
    }
  }
  n.size = [numLines * 12 + 30, numCols * 6 + 15];
  if (n.children) {
    n.children.forEach(item => setSizes(item))
  }
}
setSizes(treeData)

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

svg.append("rect")
  .attr("class", "background")
  .attr("width", "100%")
  .attr("height", "100%")
  .call(d3.zoom().on("zoom", zoom));

var svgGroup = svg.append("g")
    .attr("transform", "translate("
          + hMargin + "," + vMargin + ")");

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

// Collapse after the second level
//root.children.forEach(collapse);

update(root);

// Collapse the node and all its children
function collapse(d) {
  if(d.children) {
    d._children = d.children
    d._children.forEach(collapse)
    d.children = null
  }
}

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
 
    //node.width = node.xSize;
    //node.height = node.ySize;
  })

  // Compute the new tree layout.
  var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  //nodes.forEach(function(d){ d.y = d.depth * 180});

  // ****************** Nodes section ***************************

  // Update the nodes...
  var i = 0
  var node = svgGroup.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) {
      //return "translate(" + source.x0 + "," + source.y0 + ")";
      return "translate(" + (source.x0 + (source.width - d.width)/2) + "," + source.y0 + ")";
    });

  // Add Circle for the nodes
  nodeEnter.append("circle")
    .attr("class", "node")
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
  // Show the node area (for debugging).
  //nodeEnter.append("rect")
  //  .attr("width", d => d.width)
  //  .attr("height", d => d.height)
  //  .style("fill-opacity", 0.1)
  //  .style("stroke", "red");

  // Add labels for the nodes
  //nodeEnter.append("text")
  //    .attr("dy", ".35em")
  //    .attr("x", function(d) {
  //        return d.children || d._children ? -13 : 13;
  //    })
  //    .attr("text-anchor", function(d) {
  //        return d.children || d._children ? "end" : "start";
  //    })
  //    .text(function(d) { return d.data.name; });
  var sel = nodeEnter.selectAll("text")
    .data(function (d) {
      // Create a data element for each line of text.
      var a = new Array(1 + d.data.attrs.length);
      a[0] = { node: d, text: d.data.name }
      for (var i = 1; i <= d.data.attrs.length; i++) {
        a[i] = { node: d, text: d.data.attrs[i-1] }
      }
      return a
    })
    .enter();

  sel.append("text")
    .attr("x", function(d) { return d.node.width/2 })
    .attr("dy", function(d, i) { return (i + 2.35) +  "em" })
    .attr("text-anchor", "middle")
    .style("fill-opacity", 1e-6)
    .style("font-size", 1)
    .text(function(d) { return d.text; });

  // UPDATE

  // Transition to the proper position for the node
  var nodeUpdate = nodeEnter.merge(node).transition()
    .duration(duration)
    .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
     });

  // Update the node attributes and style
  nodeUpdate.select("circle")
    .attr("r", 5)
    .style("fill", function(d) {
        return d._children ? "lightsteelblue" : "#fff";
    });
  // On exit reduce the opacity of text labels
  nodeUpdate.selectAll("text")
    .style("fill-opacity", 1)
    .style("font-size", 12);


  // Remove any exiting nodes
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
          return "translate(" + (source.x + (source.width - d.width)/2) + "," + source.y + ")";
      })
      .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select("circle")
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
