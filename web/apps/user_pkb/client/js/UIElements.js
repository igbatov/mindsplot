/**
 * This module render common UI elements - select box, modal window, text box, etc
 * @param jQuery
 * @constructor
 */
YOVALUE.UIElements = function(jQuery){
  this.jQuery = jQuery;
  this.uniqueId = 0;
};

YOVALUE.UIElements.prototype = {
  /**
   * Returns DOM element that can be used to select items
   * @param {String} name - name of select box
   * @param {Object<string, string>} items - in form {'value'=>'label', ...}
   * @param {String} defaultValue - selected item name
   * @param {function(string,string)=} onSelectCallback - callback will receive select name and item name on selection
   * @returns {HTMLElement}
   */
  createSelectBox: function(name, items, defaultValue, onSelectCallback){
    var uniqId = this.generateId(),
        selectedItem = YOVALUE.createElement('span',{class:'selected',value:'none'},'none');

    if(defaultValue) YOVALUE.updateElement(selectedItem, {value:defaultValue}, items[defaultValue]);

    var selectBox = YOVALUE.createElement('div',{class:'ui_select',id:uniqId,value:'none'},'');

    // create list of items
    var lis = Object.keys(items).map(function(key){
      return YOVALUE.createElement('li',{value:key},(items[key].length > 25 ? items[key].substr(0, 25)+'...' : items[key]))
    });

    var ul = YOVALUE.createElement('ul',{},'');
    lis.forEach(function(li){
      ul.appendChild(li);
    });

    selectBox.appendChild(selectedItem);
    selectBox.appendChild(ul);

    document.body.addEventListener('click', function(evt){
      // toggle show/hide of menu
      if(evt.target == selectedItem){
        if(YOVALUE.getDisplay(ul) == 'none'){
          YOVALUE.setDisplay(ul,'block');
        }else{
          YOVALUE.setDisplay(ul,'none');
        }
      }
      // click on item - select new graph
      else if(lis.indexOf(evt.target) != -1 ){
        var value = evt.target.getAttribute('value');
        YOVALUE.updateElement(selectedItem, {value:value}, evt.target.innerText);
        if(typeof(onSelectCallback) != 'undefined') onSelectCallback(name, value);
        YOVALUE.setDisplay(ul,'none');
      }else{
        YOVALUE.setDisplay(ul,'none');
      }
    });

    return selectBox;
  },

  /**
   * Creates form fields and buttons
   * @param fields
   * @param callback - called when any button from fields is pressed
   * @returns {HTMLElement}
   */
  createForm: function(fields, callback){
    var name,
      uniqId = this.generateId(),
      form = YOVALUE.createElement('div',{id:uniqId, class:'ui_form'},'');

    for(name in fields){
      if(fields[name]['type'] == 'text') form.appendChild(YOVALUE.createElement('input',{type:'text', name:name,value:fields[name]['value'],placeholder:fields[name]['label']},'',fields[name]['callback']));
      if(fields[name]['type'] == 'date') form.appendChild(YOVALUE.createElement('input',{type:'date', name:name,value:fields[name]['value']},'',fields[name]['callback']));
      if(fields[name]['type'] == 'select') form.appendChild(this.createSelectBox(name, fields[name]['options'],fields[name]['value'],fields[name]['callback']));
      if(fields[name]['type'] == 'button'){
        form.appendChild(this.createButton(name,fields[name]['value'],function(evt){
          var data = {};
          // gather data from form nodes
          [].forEach.call(form.childNodes, function(child) {
            // if not textNode and has attr name
            if(child.nodeType != Node.TEXT_NODE && child.hasAttribute('name')) {
              // if element is button then set data[element] = true if this button was pushed, false otherwise
              if (child.tagName == 'BUTTON') data[child.getAttribute('name')] = child == evt.target;
              // for other elements set its value
              else data[child.getAttribute('name')] = child.value;
            }
          });
          callback(data);
        }));
      }
      if(fields[name]['type'] == 'hidden') form.appendChild(YOVALUE.createElement('input',{type:'hidden',name:name,value:fields[name]['value']},''));
      if(fields[name]['type'] == 'title') form.appendChild(YOVALUE.createElement('h1',{},fields[name]['value']));
    }

    return form;
  },

  /**
   * Create modal window
   * @param fields as array {name:{attr}, ...} - for example {
   *                                         'title':{'type':'input', 'label':'Write Title:'},
   *                                         'textType':{'type':'select', 'label':'Choose Text Type:'},
   *                                         'addButton':{'type':'button', 'label':'Add'},
   *                                         ...
   *                                       }
   * @param callback - callback will get form values as array 'name'=>'value'
   */
  createModal: function(){
    var uniqId = this.generateId(),
      modalWindow = YOVALUE.createElement('div',{id:uniqId, class:'ui_modal'},'');
    document.body.appendChild(modalWindow);

    var closeButton = YOVALUE.createElement('div',{class:'close_button'},'X');
    modalWindow.appendChild(closeButton);
    closeButton.addEventListener('click', function(evt){
      modalWindow.parentNode.removeChild(modalWindow);
    });

    YOVALUE.setDisplay(modalWindow, 'none');

    return modalWindow;
  },

  setModalContent: function(modalWindow, content){
    YOVALUE.setDisplay(modalWindow, 'block');
    YOVALUE.setDisplay(modalWindow, 'none');
    YOVALUE.setDisplay(modalWindow, 'block');
    // remove all except close button
    [].forEach.call(modalWindow.childNodes, function(child) {
      if(child.getAttribute('class') != 'close_button') modalWindow.removeChild(child);
    });

    modalWindow.appendChild(content);

  },

  /**
   * Ask user to confirm his action
   * @param text - "Are you sure ...?"
   * @param callback - callback will get 'yes' or 'no'
   */
  showConfirm: function(text, callback){
    var m = this.createModal();
    this.setModalContent(
      m,
      this.createForm(
        {title:{type:'title', value:text}, yes:{type:'button',value:'Yes'}, no:{type:'button', value:'No'}},
        function(v){
          if(v['yes']) v = 'yes';
          else v = 'no';
          m.parentNode.removeChild(m);
          callback(v);
        }
      )
    );
  },

  /**
   * Create button
   * @param {String} name - i.e. "yes"
   * @param {String} label - i.e "I agree!"
   * @param {function(object)=} callback - callback arg is event
   */
  createButton: function(name, label, callback){
    var uniqId = this.generateId();
    var el = YOVALUE.createElement('button',{id:uniqId, name:name, class:'ui_button'},label);
    if(typeof(callback) != 'undefined'){
      el.addEventListener('click', function(evt){
        callback(evt);
      });
    }
    return el;
  },

  /**
   * Shows list of items with action buttons next to each
   * @param {Object<string, string>} items - in a form {id:label, ...}
   * @param {Object<string, string>} actions - action that can be made to item, in a form {name:callback, ...}
   */
  showModalList: function(items, actions){
    this.setModalContent(this.createModal(),this.createList(items, actions));
  },

  /**
   * Creates list of items with action buttons next to each
   * @param {Object<string, string>} items - in a form {id:label, ...}
   * @param {Object<string, string>} actions - action that can be made to item, in a form {name:callback, ...}
   */
  createList: function(items, actions){
    var uniqId = this.generateId();
    var ul = YOVALUE.createElement('ul', {id:uniqId, class:'ui_list'});
    for(var id in items){
      var li = YOVALUE.createElement('li',{});
      if(typeof(items[id]) == 'string'){
        li.appendChild(document.createTextNode(items[id]));
      }else{
        li.appendChild(items[id]);
      }
      for(var name in actions){
        var button = this.createButton(name, name);
        (function(button, callback, id,li){
          button.addEventListener('click', function(evt){
            callback(id, li);
          });
        })(button, actions[name], id, li);
        li.appendChild(button);
      }
      ul.appendChild(li);
    }
    return ul;
  },

  /**
   * Method to generate unique id for UI element
   * @private
   */
  generateId: function(){
    this.uniqueId++;
    return 'UIElement-'+this.uniqueId;
  }
};