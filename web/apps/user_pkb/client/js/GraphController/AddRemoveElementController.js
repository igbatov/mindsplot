/**
 * This controller reacts on node's drag'n'drop in 'connect' mode.
 * On 'dragendnode' it starts process of model change
 * This started process would be finished somewhere else with 'graph_model_changed' event fire 
 * @param publisher
 * @constructor
 */
GRASP.AddRemoveElementController = function(publisher){
  this.publisher = publisher;
};

GRASP.AddRemoveElementController.prototype = {
  execute: function(event, selectedElement){
    var that = this, eventName = event.getName(), dragMode, acceptedEvents = ['dragendnode', 'delete_pressed', 'element_editor_focusin', 'element_editor_focusout'];

    // reject in the explicit form all events except those in acceptedEvents
    if(acceptedEvents.indexOf(eventName) == -1) return;

    // we work with dragendnode only if the mode of dragging is 'connect'
    if(eventName == 'dragendnode'){
      dragMode = this.publisher.getInstant('get_graph_view_drag_mode', {graphId: event.getData()['fromGraphId']});
      if(dragMode != 'connect') return;
    }

    if(eventName === 'dragendnode'){
      var data = event.getData();

      // if dragged node is from the droppedOnGraphId then add new edge between dragged node and dropped node
      if(data['fromGraphId'] == data['droppedOnGraphId']){
        // if it was dropped on background of graph, do nothing
        if(typeof(data['droppedOnModelElement']) === 'undefined') return;

        // do not add double edge between nodes
        if(data['droppedOnModelElement'].element.id == data['draggedModelElement'].element.id) return;

        this.publisher.publish(["get_graph_models", [data['droppedOnGraphId']]]).then(function(graphModels){
          var graphModel = graphModels[data['droppedOnGraphId']];
          return that.publisher.publish(["request_for_graph_element_content_change", {type: 'addEdge', graphId: data['droppedOnGraphId'], elementType: graphModel.getEdgeDefaultType()}]);

        }).then(function(edgeContent){
            return that.publisher.publish(["request_for_graph_model_change", {graphId: data['droppedOnGraphId'], type: 'addEdge', edgeContentId:edgeContent.edgeContentId, fromNodeId:data['droppedOnModelElement'].element.id, toNodeId:data['draggedModelElement'].element.id}]);
        });

      // else add new node to graph
      }else{
        var graphId = data['droppedOnGraphId'];

        if(typeof(graphId) == 'undefined') GRASP.errorHandler.throwError('no droppedOnGraphId');

        if(that.publisher.getInstant("is_new_node_graph_id", {'graphId':data['fromGraphId']})) {
          data['draggedModelElement'].element.nodeContentId = null;
        }
        this.publisher
          .publish(["get_graph_models", [data['droppedOnGraphId']]],
            ["request_for_graph_element_content_change", {type: 'addNode', graphId: data['droppedOnGraphId'], element: data['draggedModelElement'].element}]
          ).then(function(graphModels, nodeContent){
          var parentNodeId = typeof(data['droppedOnModelElement']) === 'undefined' ? null : data['droppedOnModelElement'].element.id;
          that.publisher.publish(["request_for_graph_model_change", {graphId: graphId, type: 'addNode', parentNodeId: parentNodeId, nodeContentId: nodeContent.nodeContentId}]);
        });
      }

    }else if(eventName === 'element_editor_focusin'){
      this.isElementEditorFocused = true;

    }else if(eventName === 'element_editor_focusout'){
      this.isElementEditorFocused = false;

    }
  }
};