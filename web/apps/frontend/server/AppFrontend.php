<?php
class AppFrontend extends App{
  public function showView(){
    $vars = $this->getRoute();
    $action = $vars[0];

    // process action defined by url
    switch($action){
      case 'share_track':
        $urlArr=parse_url($_SERVER['REQUEST_URI']);
        parse_str($urlArr['query'], $output);
        $this->log(var_export($output, true));
        $from = $this->db->escape($output['from']);
        $type = $this->db->escape($output['type']);
        $graph_id = $this->db->escape($output['graph_id']);
        $q = "INSERT INTO share_track SET `from` = '".$from."', `type` = '".$type."', `graph_id` = '".$graph_id."'";
        $this->db->execute($q);
        break;

      case 'subscribe':
        $urlArr=parse_url($_SERVER['REQUEST_URI']);
        parse_str($urlArr['query'], $output);
        $this->log(var_export($output, true));

        $email = $output['email'];
        $query = "INSERT INTO subscribe_email SET email = '".$this->db->escape($email)."'";
        $this->db->execute($query);
        $msg = 'Email '.$email.' wants to recieve new maps';
        $this->sendMail("info@grasp.how", "igbatov@gmail.com", $msg, $msg);
        break;

      // generates javascript to insert /embed iframe
      case 'embedjs':
        // sanity check
        if(strlen($vars[1])>255 || strlen($vars[2])>255) exit('Too long params');

        $graphIds = $vars[1];
        $uniqId = $vars[2];

        include($this->getAppDir("template", false)."/embedjs.php");
        break;

      case 'show':
      case 'embed':
        // sanity check
        if(strlen($vars[1])>255) exit('Too many graph_ids');

        $graph_ids = json_decode($vars[1],true);
        if(!is_array($graph_ids)) exit('Bad JSON');

        foreach($graph_ids as $graph_id) if(!is_numeric($graph_id)) exit('Bad graph_id '.$graph_id);

        $graph = $this->getGraphsData($graph_ids);
        $url = 'http://www.grasp.how/show/['.$graph_ids[0].']';
        include($this->getAppDir("template", false)."/embed.php");
      break;

      default:
        $graph_ids = array("12", "15");
        $graph = $this->getGraphsData($graph_ids);
        include($this->getAppDir("template", false)."/index.php");
      break;
    }
  }

  /**
   * Select graphs data from db
   * @param $graph_ids
   * @return array
   */
  private function getGraphsData($graph_ids){
    $decoration = array("fact"=>"#00BFFF","research"=>"#87CEFA","theory"=>"#3CB371","hypothesis"=>"#8FBC8F","illustration"=>"#FF69B4","theory_problem"=>"#FF0000", "question"=>"#FFFFE0", "to_read"=>"#FFFF00", "best_known_practice"=>"#FFA500");
    $nodeTypes = array("fact"=>"Факт","research"=>"Исследование","theory"=>"Теория","hypothesis"=>"Гипотеза","illustration"=>"Иллюстрация","theory_problem"=>"Проблема теории", "question"=>"Вопрос", "to_read"=>"Дальнешее чтение", "best_known_practice"=>"Лучшие практики");
    //$graph_ids = array("15");
    $graph = array();

    // get names and node types
    $graph_rows = $this->db->execute("SELECT * FROM graph WHERE id IN ('".implode("','", $graph_ids)."')");
    foreach($graph_rows as $graph_row){
      $graph_settings = json_decode($graph_row['graph'], true);
      $graph[$graph_row['id']] = array("name"=>$graph_settings["name"], "nodeTypes"=>$graph_settings["nodeTypes"]);

      // get nodes and edges
      $local_content_ids = array();
      $rows = $this->db->execute("SELECT * FROM graph_history WHERE graph_id = '".$graph_row['id']."' ORDER BY step DESC LIMIT 1");
      foreach($rows as $row){
        $elements = json_decode($row['elements'], true);
        $mapping = json_decode($row['node_mapping'], true);

        if(!$elements) $this->error("No elements in graph history, graph_id=".$graph_row['id']);
        if(!$mapping) $this->error("No mapping in graph history, graph_id=".$graph_row['id']);

        $graph[$graph_row['id']]["nodes"] = $elements['nodes'];
        $graph[$graph_row['id']]["edges"] = $elements['edges'];
        $graph[$graph_row['id']]["area"] = $mapping["area"];

        foreach($elements['nodes'] as $node){
          $t = explode("-", $node['nodeContentId']);
          $local_content_ids[$t[1]] = $node['id'];
        }
      }

      // get nodes contents
      $graph[$graph_row['id']]["nodeContents"] = array();
      $rows = $this->db->execute("SELECT * FROM node_content WHERE graph_id = '".$graph_row['id']."' AND local_content_id IN ('".implode("','", array_keys($local_content_ids))."')");
      foreach($rows as $row){
        $graph[$graph_row['id']]["nodeContents"][$local_content_ids[$row['local_content_id']]] = array("label"=>$row['label'], "text"=>$row['text'], "type"=>$row['type'], "importance"=>$row['importance'], "reliability"=>$row['reliability']);
      }

      // convert data to the appropriate format
      $base_size = min(min($mapping["area"]["width"], $mapping["area"]["height"])/(2*count($elements['nodes'])), 5);
      $graph[$graph_row['id']]["nodes"] = $this->convertNodes($graph[$graph_row['id']]["nodes"], $mapping["mapping"], $graph[$graph_row['id']]["nodeContents"], $decoration, $base_size);
      $graph[$graph_row['id']]["nodeTypes"] = $this->convertNodeTypes($graph[$graph_row['id']]["nodeTypes"], $nodeTypes, $decoration);

      // remove root node with its edges
      foreach($graph[$graph_row['id']]["nodes"] as $node){
        if($graph[$graph_row['id']]["nodeContents"][$node["id"]]["label"] == "root"){
          unset($graph[$graph_row['id']]["nodeContents"][$node["id"]]);
          unset($graph[$graph_row['id']]["nodes"][$node["id"]]);
          foreach($graph[$graph_row['id']]["edges"] as $edge){
            if($edge["source"] == $node["id"]) unset($graph[$graph_row['id']]["edges"][$edge["id"]]);
          }
        }
      }
    }
    return $graph;
  }

  private function convertNodeTypes($graph_node_types, $base_node_types, $decoration){
    $decorated_node_types = array();
    foreach($graph_node_types as $node_type){
      $decorated_node_types[$node_type] = array("label"=>$base_node_types[$node_type], "color"=>$decoration[$node_type]);
    }
    return $decorated_node_types;
  }

  private function convertNodes($nodes, $mapping, $node_contents, $decoration, $base_size){
    $decorated_nodes = array();
    foreach($nodes as $node){

      if($node_contents[$node["id"]]["importance"] == 0) $importance = 99;
      else $importance = $node_contents[$node["id"]]["importance"];

      if($node_contents[$node["id"]]["reliability"] == 0) $reliability = 99;
      else $reliability = $node_contents[$node["id"]]["reliability"];

      $decorated_nodes[$node["id"]] = array(
        "id"=>$node["id"],
        "x"=>$mapping[$node["id"]]["x"],
        "y"=>$mapping[$node["id"]]["y"],
        "type"=>$node_contents[$node["id"]]["type"],
        "color"=>$decoration[$node_contents[$node["id"]]["type"]],
        "size"=>max(1, 1.8*$base_size*$importance/50),
        "opacity"=>$reliability/99
      );
    }

    return $decorated_nodes;
  }

  public function getAppDir($type="app_root", $isWeb = true){
    switch ($type) {
      case "img":
        return $this->getAppRoot($isWeb)."/client/img";
        break;
      default:
        return parent::getAppDir($type, $isWeb);
    }
  }
}
