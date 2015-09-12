/**
 * This controller reacts on 'graph_model_changed', 'graph_element_content_changed' events
 * It then collects all necessary data from other modules and combine it to make one 'draw_graph_view' event fire
 * @param publisher
 * @param viewManager
 * @constructor
 */
YOVALUE.ModelChangeController = function(publisher, viewManager){
  this.publisher = publisher;
  this.viewManager = viewManager;
};

YOVALUE.ModelChangeController.prototype = {
  execute: function(event, selectedElement){
    var that = this;
    var eventName = event.getName();

    if(eventName == 'show_graphs' || eventName == 'graph_position_changed'){
      this.publisher.publish('hide_all_graphs');
      var graphModels;
      var e = this.publisher.createEvent("get_graph_models");
      this.publisher.when(e).then(function(models){
        graphModels = models;
        var i, graphIds = [];
        for(i in graphModels) graphIds.push(graphModels[i].getGraphId());
        return that.publisher.publish('get_selected_positions', graphIds);

      }).then(function(positions){
        for(var i in graphModels){
          if(positions[graphModels[i].getGraphId()] != 'not to be shown'){
            selectedElement.graphId = graphModels[i].getGraphId();
            that.showGraph(graphModels[i]);
          }
        }
      });
      this.publisher.publishEvent(e);

    }else if(eventName == 'graph_model_changed'){
      var graphModel = event.getData()['graphModel'];
      selectedElement.graphId = graphModel.getGraphId();
      this.showGraph(graphModel);

    }else if(eventName == 'graph_element_content_changed'){
      if(event.getData()['type'] == 'updateNodeText' ||         // nothing to redraw if node content text was changed
          event.getData()['type'] ==  'addEdge' ||              // no need to redraw - it will be done by 'graph_model_changed' event
          event.getData()['type'] == 'addNode')                 // no need to redraw - it will be done by 'graph_model_changed' event
          return true;

    //  var timer = null, timeout = 1;
      if(event.getData()['type'] ==  'updateNodeAttribute' && event.getData()['nodeAttribute']['name'] == 'label') timeout = 5000;

      var graphId = event.getData()['graphId'];
      e = this.publisher.createEvent("get_graph_models", [graphId]);
      this.publisher.when(e).then(function(graphModels){
        that.showGraph(graphModels[graphId]);
      });

//      clearTimeout(timer);
 //     timer = setTimeout(function(){
        that.publisher.publishEvent(e);
   //   }, timeout);

    }
  },

  /**
   *
   * @param graphModel
   */
  showGraph: function(graphModel){
    // Choose left or right side of canvas for this GraphView
    var that = this, e = this.publisher.createEvent("get_selected_positions", [graphModel.getGraphId()]);
    this.publisher.when(e).then(function(graphPositions){
      var graphArea = that.viewManager.getViewContainer(graphPositions[graphModel.getGraphId()]);

      if (!graphModel.getIsEditable()) {
        that._drawGraphView(graphModel, graphArea);
      } else {
        // We want to fit in graphArea 2 graphs:
        // - original graphModel
        // - nnGraph (new nodes graph) - graph that user can use as a source of the new nodes for original graph

        // Cut some space for nnGraph area
        var newNodesGraphHeight = 0.07 * graphArea.height,
            nnGraphArea = {
              centerX: graphArea.centerX,
              centerY: newNodesGraphHeight / 2,
              width: graphArea.width,
              height: newNodesGraphHeight
            };
        that._drawNodesPanel(graphModel, nnGraphArea);

        // Calculate area for original graph
        graphArea.height = graphArea.height - nnGraphArea.height;
        graphArea.centerY = graphArea.centerY + nnGraphArea.height;
        // Create data nnGraph view
        that._drawGraphView(graphModel, graphArea);
      }
    });
    this.publisher.publishEvent(e);
  },

  /**
   * Get data to init graphView for the graphModel
   * @param graphModel
   * @param graphArea
   * @returns {{graphId: *, graphModel: {nodes: *, edges: *}, graphArea: *, nodeMapping: *, nodeLabelMapping: *, decoration: *, skin: *}}
   * @private
   */
  _drawGraphView: function(graphModel, graphArea){
    var i, that = this, skin, layout, graphNodeAttributes, graphEdgeAttributes, nodeMapping,
      nodeMappingHint, decoration, graphNodes = graphModel.getNodes(),
      nodeLabels = {}, nodeLabelAreaList, nodeId, nodeContentIds=[], edgeContentIds=[];

    var graphId = graphModel.getGraphId();
    var e1 = this.publisher.createEvent("get_selected_skin", graphId);
    var e2 = this.publisher.createEvent("get_selected_layout", graphId);
    for(i in graphModel.getNodes()) nodeContentIds.push(graphModel.getNodes()[i].nodeContentId);
    for(i in graphModel.getEdges()) edgeContentIds.push(graphModel.getEdges()[i].edgeContentId);
    var e3 = this.publisher.createEvent("get_elements_attributes", {nodes:nodeContentIds, edges:edgeContentIds});
    this.publisher.when(e1, e2, e3).then(function(s, l, c){
      skin = s;
      layout = l;
      graphNodeAttributes = c['nodes'];
      graphEdgeAttributes = c['edges'];

      // Decorate nodes and edges with size and color
      decoration = that.publisher.publishResponseEvent(that.publisher.createEvent("get_graph_decoration", {
            graphModel:graphModel,
            graphNodeAttributes:graphNodeAttributes,
            graphEdgeAttributes:graphEdgeAttributes,
            scale:Math.min(graphArea.width, graphArea.height),
            skin:skin
        }
      ));

      // Create node label layout for GraphView
      for(nodeId in graphNodes){
        nodeLabels[graphNodes[nodeId].id] = {id: graphNodes[nodeId].id, label: graphNodeAttributes[graphNodes[nodeId].nodeContentId].label, size: decoration.nodeLabels[nodeId].size};
      }

      nodeLabelAreaList = that.publisher.publishResponseEvent(that.publisher.createEvent("get_graph_view_label_area", {nodeLabels:nodeLabels, skin:skin}));
      nodeMappingHint = that.publisher.publishResponseEvent(that.publisher.createEvent("graph_history_get_node_mapping", {graphId:graphModel.getGraphId()}));

      // Create node layout for GraphView
      nodeMapping = that.publisher.publishResponseEvent(that.publisher.createEvent("get_node_mapping", {graphId:graphModel.getGraphId(), model:graphModel, hint:nodeMappingHint, layout:layout, nodeLabelAreaList:nodeLabelAreaList, area:graphArea}));
      // If node mapping module actually changed nodeMappingHint, then save it in repository
      // so that the next time we will not make node mapping module working again
      if(!YOVALUE.deepCompare(nodeMapping, nodeMappingHint)) that.publisher.publish("node_mapping_changed", {graphId: graphId, node_mapping: nodeMapping});

      // Create from graphNode and graphNodeAttributes nodes that GraphView is waiting from us - see implementation of YOVALUE.iGraphViewModel
      var nodes = {};
      var graphNode;
      for(i in graphNodes){
        graphNode = graphNodes[i];
        nodes[graphNode.id] = {
          id: graphNode.id,
          type: graphNodeAttributes[graphNode.nodeContentId].type,
          label: graphNodeAttributes[graphNode.nodeContentId].label,
          reliability: graphNodeAttributes[graphNode.nodeContentId].reliability,
          importance: graphNodeAttributes[graphNode.nodeContentId].importance,
          icon: graphNodeAttributes[graphNode.nodeContentId].icon,
          nodeContentId: graphNode.nodeContentId
        };
      }

      // Create from graphEdge and graphEdgeAttributes nodes that GraphView is waiting from us - see implementation of YOVALUE.iGraphViewModel
      var edges = {};
      var graphEdges = graphModel.getEdges();
      var graphEdge;

      for(i in graphEdges){
        graphEdge = graphEdges[i];
        edges[graphEdge.id] = {
          id: graphEdge.id,
          source: graphEdge.source,
          target: graphEdge.target,
          isSkeleton: graphEdge.isSkeleton,
          type: graphEdgeAttributes[graphEdge.edgeContentId].type,
          edgeContentId: graphEdge.edgeContentId
        };
      }

      // Remove root and its edges from graph
      /*
      var rootEdges = graphModel.getEdgesToChildIds(graphModel.getRootNode().id);
      for(var i in rootEdges){
        delete edges[rootEdges[i]];
      }
      delete nodes[graphModel.getRootNode().id];
*/
      var graphViewSettings = {
        graphId: graphId,
        graphModel: {nodes: nodes, edges: edges},
        graphArea: graphArea,
        nodeMapping: nodeMapping,
        nodeLabelMapping: nodeMapping,
        decoration: decoration,
        skin: skin
      };

      that.publisher.publish("draw_graph_view", graphViewSettings);
    });

    this.publisher.publishEvent(e1, e2, e3);
  },

  // get data to init mini-graphView that draws just node types of the graphModel
  _drawNodesPanel: function(graphModel, graphArea){
    var that = this,
      i,
      nnGraphViewSettings = {},
      nodeTypes = graphModel.getNodeTypes(),
      nodes = {},
      graphId = graphModel.getGraphId();

    // get height of new nodes graph
   // nnGraphViewSettings.eventsToListen = ['dragendnode'];
    nnGraphViewSettings.graphArea = graphArea;
    nnGraphViewSettings.graphId = 'newNodes:' + graphId;

    // create node for each nodeType
    for(i in nodeTypes){
      nodes[i] =
      {
        id:i,
        nodeContentId:i,
        label:nodeTypes[i],
        type:nodeTypes[i],
        reliability: 99,
        importance: 50
      };
    }

    nnGraphViewSettings.graphModel = {edges: {}, nodes: nodes};
    // create color scheme
    var decorationGraphModel = {
      getNodes: function(){ return nodes; },
      getEdges: function(){ return {}; },
      getNodeTypes: function(){ return nodeTypes; },
      getEdgeTypes: function(){ return graphModel.getEdgeTypes(); }
    };

    var scale = Math.min(nnGraphViewSettings.graphArea.width, nnGraphViewSettings.graphArea.height);
    // we want extra size for the panel nodes
    var size = scale/6;
    // create node mapping
    var x, l = nnGraphViewSettings.graphArea.width/nodeTypes.length, nodeMapping = {};
    for(i in nodeTypes){
      x = i*l+2*size;
      nodeMapping[i] = {id: i, x: x,  y: nnGraphViewSettings.graphArea.height/2};
    }
    nnGraphViewSettings.nodeMapping = {
      area: {centerX: nnGraphViewSettings.graphArea.width/2, centerY: nnGraphViewSettings.graphArea.height/2, width: nnGraphViewSettings.graphArea.width, height: nnGraphViewSettings.graphArea.height},
      mapping: nodeMapping
    };
    // node label mapping
    nnGraphViewSettings.nodeLabelMapping = nnGraphViewSettings.nodeMapping;

    // skin
    var e = this.publisher.createEvent("get_selected_skin", graphId);
    this.publisher.when(e).then(function(s){
      nnGraphViewSettings.skin = s;

      nnGraphViewSettings.decoration = that.publisher.publishResponseEvent(that.publisher.createEvent("get_graph_decoration", {
        graphModel: decorationGraphModel,
        graphNodeAttributes:nodes,
        graphEdgeAttributes:{},
        scale:scale,
        skin:nnGraphViewSettings.skin
      }));

      for(i in nnGraphViewSettings.decoration.nodes){
        nnGraphViewSettings.decoration.nodes[i].size = size;
        nnGraphViewSettings.decoration.nodeLabels[i].size = 2*size;
      }

      that.publisher.publish("draw_graph_view", nnGraphViewSettings);
    });

    this.publisher.publishEvent(e);
  }

};
