var DEBUG_MODE = false;
/**
 * M is a list of modules
 * @type {Object}
 */

var Modules = {
  Mediator: YOVALUE.Mediator,
  Subscriber: YOVALUE.Subscriber,
  Publisher: YOVALUE.Publisher,

  GraphModelFactory: YOVALUE.GraphModelTreeFactory,
  GraphElementsContent: YOVALUE.GraphElementsContent,
  GraphModelsPubSub: YOVALUE.GraphModelsPubSub,

  GraphHistory: YOVALUE.GraphHistory,

  kinetic:Kinetic,
  CanvasDrawer: YOVALUE.CanvasDrawer,
  CanvasDrawerFactory: YOVALUE.CanvasDrawerFactory,

  GraphViewNodeFactory: YOVALUE.GraphViewNodeFactory,
  GraphViewNodeLabelFactory: YOVALUE.GraphViewNodeLabelFactory,
  GraphViewEdgeFactory: YOVALUE.GraphViewEdgeFactory,
  GraphViewFactory: YOVALUE.GraphViewFactory,
  GraphViewsPubSub: YOVALUE.GraphViewsPubSub,

  HistoryController: YOVALUE.HistoryController,
  AddRemoveElementController: YOVALUE.AddRemoveElementController,
  ModelChangeController: YOVALUE.ModelChangeController,
  MappingChangeController: YOVALUE.MappingChangeController,
  SelectElementController: YOVALUE.SelectElementController,
  ShowEditorController: YOVALUE.ShowEditorController,
  GraphControllerPubSub: YOVALUE.GraphControllerPubSub,
  GraphControllerModules: Array,

  Repository: YOVALUE.Repository,

  KeyManager: YOVALUE.KeyManager,
  ServerStatus: YOVALUE.ServerStatus,

  GraphLayoutNamesConfig: YOVALUE.GraphLayoutNamesConfig,
  GraphSkinNamesConfig: YOVALUE.GraphSkinNamesConfig,

  GraphMenu: YOVALUE.GraphMenu,
  SelectGraphLayoutModel: YOVALUE.SelectGraphLayoutModel,
  SelectGraphSkinModel: YOVALUE.SelectGraphSkinModel,

  GraphNodeMappingsPubSub: YOVALUE.GraphNodeMappingsPubSub,
  GraphNodeLabelMappingsPubSub: YOVALUE.GraphNodeLabelMappingsPubSub,

  GraphDecoration: YOVALUE.GraphDecorationByType,
  GraphDecorationsPubSub: YOVALUE.GraphDecorationsPubSub,

  ViewManager: YOVALUE.ViewManager,
  UIElements: YOVALUE.UIElements,
  GraphElementEditor: YOVALUE.GraphElementEditor,

  jQuery: jQuery,
  Ajax: YOVALUE.Ajax,
  Promise: YOVALUE.Promise,

  imageLoader: YOVALUE.imageLoader
};

/**
 * Dependency injection array - provides arguments for constructor of every module that is instantiated at the very beginning
 * Modules that are not instantiated are not represented in DI:  kinetic, jQuery
 * @type {Object}
 */
var DI = {
  /**
   * Mediator is initialized with the order of subscribers execution for some events
   * For other events the order of modules notification is not important
   */
  Promise: ['jQuery'],
  Mediator: [],
  Publisher:['Mediator', 'Promise'],
  Subscriber:['Mediator'],

  GraphModelFactory: [],
  GraphElementsContent: ['Subscriber', 'Publisher'],
  GraphModelsPubSub: ['Subscriber', 'Publisher', 'GraphModelFactory'],

  GraphHistory: ['Subscriber', 'Publisher'],

  ViewManager: ['jQuery', {
    horizontalMenu: {id:'horizontalMenu',padding:[0,0]},
    leftGraphElementEditor: {id:'leftGraphElementEditorContainer',padding:[0,0]},
    rightGraphElementEditor: {id:'rightGraphElementEditorContainer',padding:[0,0]},
    graphViews: {id:'graphViews',padding:[15,0]},
    serverStatus: {id:'serverStatus'}
  }],
  UIElements: ['jQuery'],

  KeyManager: ['Publisher'],
  ServerStatus: ['Subscriber', 'Publisher', 'ViewManager', 'jQuery'],

  GraphViewNodeFactory:[],
  GraphViewEdgeFactory:[],
  GraphViewNodeLabelFactory:[],
  CanvasDrawerFactory:['kinetic', 'jQuery'],
  GraphViewFactory:['GraphViewNodeFactory', 'GraphViewEdgeFactory', 'GraphViewNodeLabelFactory'],
  GraphViewsPubSub:['Subscriber', 'Publisher', 'GraphViewFactory', 'ViewManager', 'CanvasDrawerFactory'],

  AddRemoveElementController:['Publisher'],
  HistoryController:['Publisher'],
  ModelChangeController:['Publisher','ViewManager'],
  MappingChangeController:['Publisher'],
  SelectElementController:['Publisher'],
  ShowEditorController:['Publisher'],
  GraphControllerModules:[
    'HistoryController',
    'ModelChangeController',
    'AddRemoveElementController',
    'SelectElementController',
    'ShowEditorController',
    'MappingChangeController',
  ],
  GraphControllerPubSub:['Subscriber', 'Publisher', 'GraphControllerModules'],

  Ajax: ['jQuery'],
  imageLoader: ['Promise'],
  Repository: ['Subscriber', 'Publisher', 'Ajax', 'imageLoader'],

  GraphMenu: ['Subscriber', 'Publisher', 'ViewManager', 'UIElements', 'jQuery'],

  SelectGraphLayoutModel: ['Subscriber', 'Publisher',{
    basicLayout: {
      node:{
        constructor: YOVALUE.GraphNodeMappingForceDirected,
        attr: {}
      },
      nodeLabel:{
        constructor: YOVALUE.GraphNodeLabelMappingHorizontal,
        attr: {}
      }
    }
  }],

  SelectGraphSkinModel: ['Subscriber', 'Publisher', {
    'GraphViewNode':YOVALUE.GraphViewNode,
    'GraphViewNodeImage':YOVALUE.GraphViewNodeImage,
    'GraphViewEdge':YOVALUE.GraphViewEdge,
    'GraphViewNodeLabel':YOVALUE.GraphViewNodeLabel
  }],

  GraphNodeMappingsPubSub: ['Subscriber'],
  GraphNodeLabelMappingsPubSub: ['Subscriber'],

  GraphDecoration: [],
  GraphDecorationsPubSub: ['Subscriber', 'GraphDecoration'],

  GraphElementEditor: ['Subscriber', 'Publisher', 'ViewManager', 'jQuery']
};

// Creating and wiring modules according to DI array
YOVALUE.wireModules(Modules, DI);


var p = Modules['Publisher'];
//init models
var e = p.createEvent('load_graph_models');
p.when(e).then(function(){
  // and then show them
  p.publish('show_graphs');
});
// Starting...
p.publishEvent(e);