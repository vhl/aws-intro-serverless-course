"use strict";

function fetchRecentImages() {
  var request = new XMLHttpRequest();
  request.onreadystatechange = () => {
    if(request.readyState == XMLHttpRequest.DONE) {
      if(request.status == 200) {
        renderImages(JSON.parse(request.responseText));
      } else {
        console.log("failed to fetch recent images");
      }
    }
  };
  request.open("GET", BASE_API_URL + "/images");
  request.send();
}

function renderImages(images) {
  var root = document.getElementById("recent-images");
  images.forEach((image) => {
    var div = document.createElement("div");
    var caption = document.createElement("p");
    var img = document.createElement("img");
    var img_url = 'http://' + BUCKET_NAME + '.s3.amazonaws.com/' + image.s3Object;
    caption.appendChild(document.createTextNode(image.caption));
    img.setAttribute("src", img_url);
    div.appendChild(img);
    div.appendChild(caption);
    root.appendChild(div);
  });
}

function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(fetchRecentImages);
