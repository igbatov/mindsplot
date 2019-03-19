<!doctype html>
<html>
  <head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <link rel="stylesheet" href="<?php echo $this->getAppDir('css'); ?>/main.css">
  <link href="/favicon.ico?3" rel="icon">
  </head>
  <body>
  <div id="container">
    <div id="horizontalMenu"></div>
    <div id="graphViews">
      <div id="leftGraphElementEditorContainer" class="graphElementEditorContainer"></div>
      <div id="rightGraphElementEditorContainer" class="graphElementEditorContainer"></div>
      <div id="frontalLoader">
        <?php  include($this->getAppDir('template', false).'/_frontalLoader.php'); ?>
      </div>
    </div>
    <div id="statusString"></div>
  </div>

  <!-- General js libs -->
  <script src="<?php echo $this->getDefaultDir('js'); ?>md5.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>Chart.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>jserrorlog.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>jquery.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>stacktrace-0.4.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>xor4096.min.js"></script>
  <script src='<?php echo $this->getDefaultDir('js'); ?>decimal.min.js'></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>Helpers.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>I18n.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>Ajax.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>UIElements.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>Mediator/iListener.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>Mediator/Event.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>Mediator/Mediator.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>Mediator/Publisher.js"></script>
  <script src="<?php echo $this->getDefaultDir('js'); ?>Mediator/Subscriber.js"></script>

  <!-- GRASP source -->
  <?php foreach($this->getJsIncludeList() as $js_include) : ?>
      <script src="<?php echo $this->getAppDir('js')."/".$js_include; ?>"></script>
  <?php endforeach ?>
  <script src="<?php echo $this->getAppDir('js'); ?>/init.js"></script>
  <script src="<?php echo $this->getAppDir('js'); ?>/main.js"></script>

  <!-- mouseflow session replay -->
  <script type="text/javascript">
    window._mfq = window._mfq || [];
    (function() {
      var mf = document.createElement("script");
      mf.type = "text/javascript"; mf.async = true;
      mf.src = "//cdn.mouseflow.com/projects/8f374802-70db-4c74-8593-3d0b319da01d.js";
      document.getElementsByTagName("head")[0].appendChild(mf);
    })();
  </script>

  <!-- yandex webvisor -->
  <!-- Yandex.Metrika counter -->
  <script type="text/javascript" >
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    ym(52877368, "init", {
      clickmap:false,
      trackLinks:false,
      accurateTrackBounce:false,
      webvisor:true
    });
  </script>
  <noscript><div><img src="https://mc.yandex.ru/watch/52877368" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
  <!-- /Yandex.Metrika counter -->
  </body>
</html>
