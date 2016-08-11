<?php
class GRainQuerier {
  private $rscript_path;

  public function __construct($rscript_path){
    $this->rscript_path = $rscript_path;
  }
  /**
   * Create R script for gRain and execute it
   * @param $graph
   * @param $probabilities
   * @return script text
   * Example for graph e2 --> h1 --> e1
   * $graph = {
   *   nodes:{'e1':['1','2'], 'e2':['1','2'], 'h1':['1','2']}, // every node contains array of its alternatives
   *   edges:[['h1','e1'],['e2','h1']]
   * };
   * $probabilities = {
   *  e1: {
   *    soft:{1:1, 2:0}, // soft evidence for e1 and ^e1
   *    '{"h1":"1"}':{1:0.01, 2:0.99}, // sum must be equal to 1
   *    '{"h1":"2"}':{1:0.99, 2:0.01}  // sum must be equal to 1
   *  },
   *  e2: {
   *    soft:{1:1, 2:0} // soft evidence for e2 and ^e2
   *  },
   *  h1: {
   *    // prior probability of proposition alternative is always 1/<number of alternatives>
   *    '{"e2":"1"}':{1:0.9999, 2:0.0001}, // sum must be equal to 1
   *    '{"e2":"2"}':{1:0.99, 2:0.01}  // sum must be equal to 1
   *   }
   * }
   *
   * Example of the R script
   *
   */
  public function createScriptText($graph, $probabilities){
    $text = "library(gRain)"."\n";

    $all_children = array();
    foreach($graph['edges'] as $edge) $all_children[] = $edge[1];
    foreach($graph['nodes'] as $node_id => $node_alternative_ids){
      // for all nodes without parents set equal prior probabilities to alternatives
      if(!in_array($node_id, $all_children)){
        $alternative_probabilities = array();
        foreach($node_alternative_ids as $node_alternative_id) $alternative_probabilities[$node_alternative_id] = 1/(count($node_alternative_ids));
        $text .= "node_".$node_id." <- cptable(~node_".$node_id.",values=c(".implode(", ",$alternative_probabilities)."),levels=c('".implode("', '",$node_alternative_ids)."'))"."\n";
      }
      // for all nodes with parents set its conditional probabilities
      else{
        // take parents of $node_id
        foreach(array_keys($probabilities[$node_id]) as $key){
          if($key != 'soft'){
            $node_parent_ids = array_keys(json_decode($key, true));
            break;
          }
        }

        // - create symbolic names for nodes
        $args = $this->getOrderedCptableArgs(
            $node_parent_ids,
            $graph['nodes'],
            $probabilities[$node_id],
            $node_alternative_ids
        );

        $text .= "node_".$node_id." <- cptable("
            ."~node_".$node_id."|".implode(":",$args['grain_node_names'])
            .",values=c(".implode(", ",$args['values']).")"
            .",levels=c('".implode("', '",$args['levels'])."'))"
            ."\n";
      }
    }

    $text .= "plist <- compileCPT(list(node_".implode(",node_",array_keys($graph['nodes']))."))"."\n";
    $text .= "net <- grain(plist)"."\n";

    // for all nodes with soft evidences - set soft evidences cptable
    foreach($probabilities as $node_id => $probability){
      if(isset($probability['soft'])){
        $evidence = array();
        // sort soft probabilities in accordance with previous definitions
        foreach($graph['nodes'][$node_id] as $node_alternative_id) $evidence[] = $probability['soft'][$node_alternative_id];
        $text .= "net <- setEvidence(net, evidence=list(node_".$node_id."=c(".implode(",",$evidence).")))"."\n";
      }
    }

    // query for all nodes without soft evidences
    $proposition_names = array();
    foreach($graph['nodes'] as $node_id=>$node_alternative_ids){
      if(!isset($probabilities[$node_id]) || !isset($probabilities[$node_id]['soft'])) $proposition_names[] = 'node_'.$node_id;
    }

    $text .= "querygrain(net, nodes=c('".implode("','",$proposition_names)."'), type='marginal')"."\n";
    return $text;
  }

  public function queryGrain($graph, $probabilities){
    $text = $this->createScriptText($graph, $probabilities);
    $output = array();
    exec($this->rscript_path.' ', $output);
  }

  /**
   * Fill in conditional probabilities (=values) for gRain
   * If ch1 (with alternatives 1,2) has parents p1 (alternatives 1,2) and p2 (alternatives 1,2)
   * then conditional probabilities in gRain are set in the in order
   * values=(
   *   P(ch1=1|p1=1,p2=1),P(ch1=2|p1=1,p2=1),
   *   P(ch1=1|p1=2,p2=1),P(ch1=2|p2=2,p2=1),
   *   P(ch1=1|p1=1,p2=2),P(ch1=2|p2=1,p2=2),
   *   P(ch1=1|p1=2,p2=2),P(ch1=2|p2=2,p2=2)
   * )
   * Returns arguments for gRain cptable function in format
   * array(
   *  'grain_node_names'=>$grain_node_names,
   *  'values'=>$grain_node_names,
   *  'levels'=>$node_alternative_ids
   * );
   * @param $node_parent_ids
   * @param $nodes
   * @param $node_probabilities
   * @param $node_alternative_ids
   * @return array
   */
  public function getOrderedCptableArgs($node_parent_ids,$nodes,$node_probabilities,$node_alternative_ids){
    $grain_node_names = array();
    $conditional_probability_keys = array("{");

    foreach($node_parent_ids as $node_parent_id){
      // create name
      $grain_node_names[] = 'node_'.$node_parent_id;

      // create $node_probabilities keys in the order that is correct for gRain cptable
      $tmp = array();
      foreach($nodes[$node_parent_id] as $node_alternative_id){
        // double existing $conditional_probability_keys
        foreach($conditional_probability_keys as $key){
          array_push($tmp, ($key == "{" ? $key : $key.',').'"'.$node_parent_id.'":"'.$node_alternative_id.'"');
        }
      }
      $conditional_probability_keys = $tmp;
    }
    foreach($conditional_probability_keys as $k=>$v) $conditional_probability_keys[$k] .= "}";

    $values = array();
    foreach($conditional_probability_keys as $key){
      foreach($node_alternative_ids as $node_alternative_id){
        array_push($values, $node_probabilities[$key][$node_alternative_id]);
      }
    }

    return array(
      'grain_node_names'=>$grain_node_names,
      'values'=>$values,
      'levels'=>$node_alternative_ids
    );
  }
}