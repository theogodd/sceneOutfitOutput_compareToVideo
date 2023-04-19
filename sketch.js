

let video_input1,
  video_input2,
  video_input,
  StillImages = [],
  still_input1,
  still_input2,
  still_input,
  poseNet,
  pose,
  poses = [],
  stillCoordsJSON,
  currentPose = {},
  minimumStill,
  minimumVal,
  threshold,
  drawKeypoints_toggle = false;

function preload() {
  // video_scene1outfit1 = createVideo("assets/scene1outfit1.mp4", loadVideo);
  // video_scene1outfit1.hide();
  video_scene1outfit2 = createVideo("assets/scene1outfit2.mp4");
  video_scene1outfit2.hide();
  video_scene1outfit2_short = createVideo("assets/scene1outfit2_short.mp4");
  video_scene1outfit2_short.hide();
  // video_scene2outfit1 = createVideo("assets/scene2outfit1.mp4", loadVideo);
  // video_scene2outfit1.hide();
  video_scene2outfit2 = createVideo("assets/scene2outfit2.mp4");
  video_scene2outfit2.hide();
}

function setup() {
  createCanvas(1024, 600);

  still_input = 'scene1outfit1';
  // load in the right JSON file with the information about all of the stills
  stillCoordsJSON = loadJSON(`assets/${still_input}.json`);
  // preload the stills before the video
  loadStills();

  // // choose video
  // video_input1 = video_scene1outfit2_short;
  // video_input2 = video_scene2outfit2;
  video_input = video_scene1outfit2_short;
  video_input.size(width, height);
  videoIsPlaying = false;

  video_input.elt.addEventListener("loadeddata", (event) => {
    console.log('added video_input.loadeddata');
    linkPoseNet();
  });
  videoIsPlaying = false;

  frameRate(24);
  threshold = 5000;
}

function draw() {
  if (videoIsPlaying) {
    image(video_input, 0, 0);

    // // logic to alternate between the two video inputs / JSON inputs
    // if(video_input.duration() == video_input.time()){
    //   if(video_input == video_input1){
    //     video_input = video_input2;
    //     still_input = still_input2;
    //     console.log("switched video/still input");
    //   }
    //   else if(video_input == video_input2){
    //     video_input = video_input1;
    //     still_input = still_input1;
    //     console.log("switched video/still input");
    //   }
    // }

    console.log('poses.length: ' + poses.length);
    if (poses.length > 0) {

      // to see what is being produced from poseNet against the video
      console.log(poses);
      console.log(video_input.time() + ' - current time');
      console.log(video_input.duration() + ' - duration');
      // console.log(video_input.elt.loadeddata() + ' - onloadeddata' );

      findPositions();
      displayMinimumStill();
    }
    if(video_input.time() == video_input.duration()){
      poseNet.removeListener('pose', detectedPose)
        setTimeout(linkPoseNet(), 10);
    }
  }
  drawData();
}

function linkPoseNet() {
  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video_input, poseNetLoaded);
  // .on() is an event listener
  poseNet.on('pose', detectedPose);
}

function poseNetLoaded() {
  console.log("PoseNet iz Loaded!");
}

function loadStills() {
  // change depending on input folder
  // scene2outfit1 = 3448, scene1outfit1 = 2449
  var amountOfStills = 2449;
  for (i = 1; i < amountOfStills; i++) {
    // imgName give the images in StillImages a name to be referenced
    var imgName = `${still_input}_${('0000' + i).slice(-4)}`;
    // load in the correct still with reference to leading zeros
    // still input one because its the same as still_input but needs to be different from the string that you defined before
    var still = createImg(`assets/${still_input}/${still_input}-${('0000' + i).slice(-4)}.jpg`);
    // push to array 
    StillImages.push(still);
    StillImages[imgName] = still;
    still.hide();
  }
  console.log(still_input, "- stills loaded in");
}

// control the playing of the video
function keyPressed() {
  // p for PAUSE / PLAY
  if (key == 'p') {
    if (videoIsPlaying) {
      videoIsPlaying = false;
      video_input.pause();
    }
    else {
      videoIsPlaying = true;
      // call link PoseNet here so that it is relinked on the loop and the code can run over and over
      video_input.loop();
    }
  }

  // adjust threshold
  if (keyCode == LEFT_ARROW) {
    threshold -= 100;
  }
  if (keyCode == RIGHT_ARROW) {
    threshold += 100;
  }

  // fullscreen mode f
  if (key == 'f') {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}

function detectedPose(results) {
  // we store the pose in the poses global variable
  poses = results;
}

function drawData() {

  push();
  translate(20, height - 150);

  stroke(200, 200, 200);
  strokeWeight(1);
  noFill();

  beginShape();
  vertex(0, 10);
  vertex(0, 0)
  vertex(10, 0);
  endShape();
  beginShape();
  vertex(160, 120);
  vertex(160, 130)
  vertex(150, 130);
  endShape();

  noStroke();
  fill(200, 200, 200);

  text(("video_input:" + video_input), 5, 15);
  text(("JSON_file:" + still_input), 5, 25);

  noStroke();
  fill(200, 200, 200);
  text(("threshold:" + threshold), 5, 65);

  text((minimumStill + ":"), 5, 115);
  if (poses.length > 0) {
    if (minimumVal < threshold) {
      fill(0, 200, 0);
    }
    else {
      fill(255, 127, 0);
    }
    text((minimumVal), 5, 125);
  }
  pop();
}

// find positions creates an object and array to store current frame positions and the distances of each still. then calles the function to fill currentFramePositions[], and calls the functions to calc the distances of each still. finally, findLowestDistance() is called and the lowest distance is printed to the console with they key and the value.
function findPositions() {
  let currentFramePositions = [];
  let eachFrameDistance = {};
  // call the get current frame positions function
  getCurrentFramePositions(currentFramePositions);
  getFrameJSONDistances(currentFramePositions, eachFrameDistance);
  // print out all the distances of the stills from the current pose
  console.log("Each Frame Distance:", eachFrameDistance);
  // call function to find the closest image to the current still
  findLowestDistance(eachFrameDistance);
}

function getCurrentFramePositions(array) {
  for (let i = 0; i < poses[0].pose.keypoints.length; i++) {
    array.push(
      [poses[0].pose.keypoints[i].position.x,
      poses[0].pose.keypoints[i].position.y]);
  }
}

function getFrameJSONDistances(cFP, eFD) {

  // for into stills obj, assigning to key
  for (const key in stillCoordsJSON) {
    let sum = 0;
    // iterating over positions of each still
    for (let i = 0; i < 17 - 1; i++) {
      // finding the sum of each set of distances from each still image - that's what sum is doing
      // daniel's more accurate method using powers to cal dist
      sum += (cFP[i][0] - stillCoordsJSON[key][i * 2]) ** 2 + (cFP[i][1] - stillCoordsJSON[key][i * 2 + 1]) ** 2;
    }
    //Push unnamed sum into out larger object with the key to corresponding to the frame
    eFD[key] = sum;
  }
}

function findLowestDistance(eFD) {

  // https://stackoverflow.com/questions/11142884/fast-way-to-get-the-min-max-values-among-properties-of-object
  // calculate the minimum distance - allows for option to add threshold 
  let objVal = Object.values(eFD);
  let objKey = Object.keys(eFD);
  // now global variable
  minimumVal = Math.min(...objVal);
  console.log(`Minimum Value: ${minimumVal}`);

  // find the corresponding key
  // ignoring case of empty list for conciseness
  minimumStill = objKey[0];
  // (changed i=1 to i=0 watch out)
  for (var i = 0; i < objKey.length; i++) {

    var currentStill = objKey[i];
    if (eFD[currentStill] < eFD[minimumStill]) {

      minimumStill = currentStill;
    }
  }
  console.log(`Minimum Still: ${minimumStill}`);
}

function displayMinimumStill() {
  // cant just draw an image from folder, no need to preload them in and ref them here
  // add threshold - only draw if the still is similar enough
  if (minimumVal < threshold) {
    image(StillImages[minimumStill], 0, 0, width, height);
  }
}