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

function postReaction(reaction, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = () => {
    if(request.readyState == XMLHttpRequest.DONE) {
      if(request.status == 200) {
        callback && callback();
      } else {
        console.log("failed to post reaction");
      }
    }
  };
  request.open("POST", BASE_API_URL + "/react");
  request.setRequestHeader("Content-Type", "application/json");
  request.send(JSON.stringify(reaction));
}

function postComment(s3Object, name, text, callback) {
  postReaction({
    name: name,
    s3Object: s3Object,
    text: text,
    type: 'comment'
  }, callback);
}

function postLike(s3Object, callback) {
  postReaction({
    s3Object: s3Object,
    type: 'like'
  });
}

// jQuery? React? Never heard of 'em.
function renderComments(comments, container) {
  comments.forEach(comment => {
    var commentDiv = document.createElement("div");
    var nameDiv = document.createElement("div");
    var name = document.createElement("strong");
    var text = document.createElement("p");
    // Render name
    name.appendChild(document.createTextNode(comment.name));
    nameDiv.appendChild(name);
    // Render comment text
    text.appendChild(document.createTextNode(comment.text));
    // Put it all together
    commentDiv.appendChild(nameDiv);
    commentDiv.appendChild(text);
    container.appendChild(commentDiv);
  });
}

function renderAddCommentForm(image, container) {
  var form = document.createElement("form");
  var header = document.createElement("h3");
  var nameParagraph = document.createElement("p");
  var nameLabel = document.createElement("label");
  var nameInput = document.createElement("input");
  var commentParagraph = document.createElement("p");
  var commentLabel = document.createElement("label");
  var commentInput = document.createElement("textarea");
  var submitButton = document.createElement("button");
  header.appendChild(document.createTextNode("leave a comment:"));
  // Name form field
  nameLabel.setAttribute("for", "name");
  nameLabel.appendChild(document.createTextNode("name"));
  nameInput.setAttribute("type", "text");
  nameInput.setAttribute("name", "name");
  nameInput.setAttribute("required", "");
  nameParagraph.appendChild(nameLabel);
  nameParagraph.appendChild(nameInput);
  // Comment form field
  commentLabel.setAttribute("for", "comment");
  commentLabel.appendChild(document.createTextNode("comment"));
  commentInput.setAttribute("name", "comment");
  commentInput.setAttribute("cols", "80");
  commentInput.setAttribute("rows", "3");
  commentInput.setAttribute("required", "");
  commentParagraph.appendChild(commentLabel);
  commentParagraph.appendChild(commentInput);
  // Fancy pants click handler for posting new comments
  submitButton.addEventListener("click", event => {
    if(nameInput.value != "" && commentInput.value != "") {
      postComment(image.s3Object,
                  nameInput.value,
                  commentInput.value,
                  () => {
                    alert("Comment posted!");
                    // Reset form
                    nameInput.value = "";
                    commentInput.value = "";
                  });
    }
    // Don't allow the form to reload the page.
    event.preventDefault();
  });
  submitButton.appendChild(document.createTextNode("comment!"));
  form.appendChild(header);
  form.appendChild(nameParagraph);
  form.appendChild(commentParagraph);
  form.appendChild(submitButton);
  container.appendChild(form);
}

function renderImages(images) {
  var root = document.getElementById("recent-images");
  images.forEach(image => {
    var container = document.createElement("div");
    var caption = document.createElement("div");
    var captionQuote = document.createElement("q");
    var img = document.createElement("img");
    var imgUrl = 'http://' + BUCKET_NAME + '.s3.amazonaws.com/' + image.s3Object;
    var likes = document.createElement("p");
    var likeLink = document.createElement("a");
    var commentContainer = document.createElement("div");
    var commentHeader = document.createElement("h3");
    var liked = false;
    // Render caption
    captionQuote.appendChild(document.createTextNode(image.caption));
    caption.appendChild(captionQuote);
    // Render likes
    likeLink.setAttribute("href", "");
    likeLink.appendChild(document.createTextNode("I like this!"));
    likeLink.addEventListener("click", event => {
      if(!liked) {
        liked = true;
        likeLink.removeAttribute("href");
        likeLink.removeChild(likeLink.firstChild);
        likeLink.appendChild(document.createTextNode("liked!"));
        postLike(image.s3Object);
        event.preventDefault();
      }
    });
    likes.appendChild(document.createTextNode(image.likes + " likes — "));
    likes.appendChild(likeLink);
    // Render image
    img.setAttribute("src", imgUrl);
    img.setAttribute("alt", image.caption);
    img.setAttribute("class", "user-image");
    // Render comments
    commentHeader.appendChild(document.createTextNode("comments:"));
    commentContainer.appendChild(commentHeader);
    if(image.comments.length == 0) {
      commentContainer.appendChild(document.createTextNode("no comments"));
    } else {
      renderComments(image.comments, commentContainer);
    }
    renderAddCommentForm(image, commentContainer);
    // Put it all together
    container.appendChild(img);
    container.appendChild(caption);
    container.appendChild(likes);
    container.appendChild(commentContainer);
    root.appendChild(container);
    // Only the best UI elements for this application.
    root.appendChild(document.createElement("hr"));
  });
}

function onReady(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

onReady(fetchRecentImages);
