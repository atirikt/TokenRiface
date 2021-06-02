console.log("The App is loaded");

App = {
  init:function(){
    console.log("App initialized");
  }
}

$(function() {
  $(window).on('load', function(){
    App.init();
  })
});