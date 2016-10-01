/**
 * Constructs drawer shape for graph node.
 * Implements IGraphViewNode interface so that GraphView knows how to work with it.
 * @param args - {nodeId, nodeType, graphId, x, y, size, color, opacity, stickers} merged with skin.node.attr definitions
 * @constructor
 */
YOVALUE.GraphViewNode = function(drawer, graphViewElement, args){
  this.stickers = args.stickers; // definition of stickers pictures in a form {'stickerName':<svg picture>, ...}
  this.drawer = drawer;
  this.graphViewElement = graphViewElement;
  this.stickers = {};  // {svgId:svgObject, ...}
  YOVALUE.mixin(graphViewElement, this);

  this.shape = this.drawer.createGroup({
    x: args.x,
    y: args.y,
    draggable: true
  });

  this.circle = this.drawer.createShape('circle', {
    x: 0,
    y: 0,
    radius: args.size,
    fill: args.color,
    stroke: args.color,
    strokeWidth: 1,
    opacity: args.opacity
  });
  this.shape.add(this.circle);

  graphViewElement.setDrawerShape(this.shape);
};

YOVALUE.GraphViewNode.prototype = {
  remove: function(){
    this.graphViewElement.remove();
    delete this;
  },

  getNodeType: function (){
    return this.nodeType;
  },

  setNodeType: function (v){
    this.nodeType = v;
  },

  setSize: function(v){
    if(v != this.circle.getRadius()){
      this.circle.setRadius(v);
    }
  },

  getSize: function(){
    return this.circle.getRadius();
  },

  setColor: function(color){
    if(color != this.circle.getFill()){
      this.circle.setFill(color);
      this.circle.setStroke(color);
    }
  },

  getStickers: function(){
    return this.stickers;
  },

  setStickers: function(v){
    this.stickers = v;
    return true;
  },

  getIcon: function(){
    return null;
  },

  setIcon: function(){
    return true;
  },

  getColor: function(){
    return this.circle.getFill();
  },

  setXY: function(x,y){
    if(x != this.shape.getX()) this.shape.setX(x);
    if(y != this.shape.getY()) this.shape.setY(y);
  },

  getXY: function(){
    return {x:this.shape.getX(),y:this.shape.getY()};
  },

  clone: function (){
    return new YOVALUE.GraphViewNode(
      this.drawer,
      new YOVALUE.GraphViewElement({graphId:this.getGraphId(), elementId:this.getElementId(), elementType:'node'}),
      {
        nodeId: this.getElementId(),
        nodeType: this.getNodeType(),
        graphId: this.getGraphId(),
        x: this.getXY().x,
        y: this.getXY().y,
        size: this.getSize(),
        color: this.getColor(),
        opacity: this.getOpacity()
      }
    );
  }
};