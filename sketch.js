

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
  videoIsPlaying,
  dataIsDrawing,
  threshold;

function preload() {

  still_input1 = 'scene2outfit2';
  still_input2 = 'scene1outfit2';
  still_input = still_input1;
  // load in the right JSON file with the information about all of the stills
  stillCoordsJSON = loadJSON(`assets/${still_input}.json`);
  // preload the stills before the video
  loadStills();

  // video_scene1outfit1 = createVideo("assets/scene1outfit1.mp4");
  // video_scene1outfit1.hide();
  // video_scene1outfit2 = createVideo("assets/scene1outfit2.mp4");
  // video_scene1outfit2.hide();
  // video_scene1outfit2_short = createVideo("assets/scene1outfit2_short.mp4");
  // video_scene1outfit2_short.hide();
  video_scene2outfit1 = createVideo("assets/scene2outfit1.mp4");
  video_scene2outfit1.hide();
  // video_scene2outfit2 = createVideo("assets/scene2outfit2.mp4");
  // video_scene2outfit2.hide();
}

function setup() {

  createCanvas(1024, 600);

  // choose videos
  // video_input1 = video_scene1outfit1;
  video_input2 = video_scene2outfit1;
  video_input = video_input2;
  video_input.size(width, height);
  // remove the sound - inportant if playing the Gerry/V stuff from the computer
  video_input.volume(0);
  // normal but cool to know
  video_input.speed(1);
  video_input.elt.addEventListener("loadeddata", (event) => {
    console.log('added video_input.loadeddata');
    linkPoseNet();
  });

  videoIsPlaying = true;
  dataIsDrawing = false;
  frameRate(24);
  threshold = 5000;
}

function draw() {

  if (videoIsPlaying) {
    image(video_input, 0, 0);

    // console.log('poses.length: ' + poses.length);
    if (poses.length > 0) {
      pose = poses[0].pose;

      // to see what is being produced from poseNet against the video
      // console.log(poses);
      // console.log('current time:' + video_input.time() + '/' + video_input.duration());

      findPositions();
      displayMinimumStill();
    }

    // // solution to the 'loadeddata' event error - works (mostly) with timeout
    // console.log(video_input.time());
    if (video_input.time() >= video_input.duration() - 0.1) {
      poseNet.removeListener('pose', detectedPose);
      console.log('removedListener:', poseNet);
      // reduce amount of errors
      video_input.stop();
      image(video_input, 0, 0);
      // relink poseNet and play video once this is done
      setTimeout(linkPoseNet, 100);
    }
  }

  if (dataIsDrawing) {
    drawData();
  }
}

function addPosenetListener() {
  poseNet.addListener('pose', detectedPose);
}

function linkPoseNet() {
  console.log("Linking posenet");
  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video_input, poseNetLoaded);
  // .on() is an event listener
  poseNet.on('pose', detectedPose);
}

function poseNetLoaded() {
  console.log("PoseNet iz Loaded!");
  console.log(poseNet);
  video_input.play();
}

function loadStills() {

  // change depending on input folder
  var amountOfStills = 0;
  if (still_input == 'scene1outfit1') {
    amountOfStills = 2449;
  }
  else if (still_input == 'scene1outfit2') {
    amountOfStills = 2222;
  }
  else if (still_input == 'scene2outfit1') {
    amountOfStills = 3448;
  }
  else if (still_input == 'scene2outfit2') {
    amountOfStills = 3067;
  }

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

  if (key == 'd') {
    if (dataIsDrawing) {
      dataIsDrawing = false; 
    }
    else {
      dataIsDrawing = true;
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
  translate(20, height - 200);

  stroke(255);
  strokeWeight(2);
  noFill();

  beginShape();
  vertex(0, 10);
  vertex(0, 0)
  vertex(10, 0);
  endShape();
  beginShape();
  vertex(150, 170);
  vertex(150, 180)
  vertex(140, 180);
  endShape();

  noStroke();
  fill(255);
  textSize(12);

  let video_input_name = 'waiting for input...';
  if (video_input == video_input1) {
    video_input_name = 'scene1outfit1';
  }
  else {
    video_input_name = 'scene1outfit2';
  }

  text(("video_input: " + video_input_name), 5, 15);
  text(("JSON_file:   " + still_input), 5, 25);
  text(("threshold:"    + threshold), 5, 155);
  text((minimumStill    + ".jpg:"), 5, 165);

  if (poses.length > 0) {
    if (minimumVal < threshold) {
      fill(0, 200, 0);
    }
    else {
      fill(255, 127, 0);
    }

    text((minimumVal), 5, 175);
    pop();

    // draw its keypoints
    if (minimumVal < threshold) {
      fill(0, 200, 0);
    }
    for (let keypoint of pose.keypoints) {
      let x = map(keypoint.position.x, 0, width, - 140, 190);
      let y = map(keypoint.position.y, 0, height, height - 220, height - 50);
      fill(255);
      beginShape();
      vertex(x, y - 3);
      vertex(x + 2, y);
      vertex(x, y + 3);
      vertex(x - 2, y);
      endShape(CLOSE);
    }

    for (let i = 0; i < poses.length; i++) {
      let skeleton = poses[i].skeleton;
      // For every skeleton, loop through all body connections
      for (let j = 0; j < skeleton.length; j++) {
        let partA = skeleton[j][0];
        let partB = skeleton[j][1];
        let xa = map(partA.position.x, 0, width, - 140, 190);
        let xb = map(partB.position.x, 0, width, - 140, 190);
        let ya = map(partA.position.y, 0, height, height - 220, height - 50);
        let yb = map(partB.position.y, 0, height, height - 220, height - 50);
        strokeWeight(1);
        stroke(255);
        line(xa, ya, xb, yb);
      }
    }
  }
}

// find positions creates an object and array to store current frame positions and the distances of each still. then calles the function to fill currentFramePositions[], and calls the functions to calc the distances of each still. finally, findLowestDistance() is called and the lowest distance is printed to the console with they key and the value.
function findPositions() {

  let currentFramePositions = [];
  let eachFrameDistance = {};
  // call the get current frame positions function
  getCurrentFramePositions(currentFramePositions);
  getFrameJSONDistances(currentFramePositions, eachFrameDistance);
  // print out all the distances of the stills from the current pose
  // console.log("Each Frame Distance:", eachFrameDistance);
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

function getFrameJSONDistances(cFP, eFD){

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
  // console.log(`Minimum Value: ${minimumVal}`);

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
  // console.log(`Minimum Still: ${minimumStill}`);
}

function displayMinimumStill() {
  // cant just draw an image from folder, no need to preload them in and ref them here
  // add threshold - only draw if the still is similar enough
  if (minimumVal < threshold) {
    image(StillImages[minimumStill], 0, 0, width, height);
  }
}