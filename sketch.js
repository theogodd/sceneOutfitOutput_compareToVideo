

let video_input,
    StillImages = [],
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

function setup(){
  createCanvas(1280, 720);
  // choose the correct input
  still_input = 'scene2outfit1';
  console.log(still_input);
  // load in the right JSON file with the information about all of the stills
  stillCoordsJSON = loadJSON(`assets/JsonAndDat_${still_input}_2.json`);
  // preload the stills before the video
  loadStills();
  videoIsPlaying = false; 
  video_scene1outfit1 = createVideo("assets/scene1outfit1.mp4", loadVideo);
  video_scene1outfit1.hide();
  video_scene1outfit2 = createVideo("assets/scene1outfit2.mp4", loadVideo);
  video_scene1outfit2.hide();
  video_scene2outfit1 = createVideo("assets/scene2outfit1.mp4", loadVideo);
  video_scene2outfit1.hide();
  video_scene2outfit2 = createVideo("assets/scene2outfit2.mp4", loadVideo);
  video_scene2outfit2.hide();

  // choose video
  video_input = video_scene2outfit2;
  video_input.size(width, height);
  frameRate(14);

  threshold = 5000;
}

function draw(){
  if(videoIsPlaying){

    image(video_input, 0, 0);

    console.log(poses.length);
    if(poses.length > 0){
      // to see what is being produced from poseNet against the video
      console.log(poses);

      findPositions();
      displayMinimumStill();

    }

    drawData();
  }
}

function drawData(){

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

  // rect(0, 0, 120, 80);

  noStroke();
  fill(200, 200, 200);

  text(("video_input:" + video_input), 5, 15);
  text(("JSON_file:" + still_input), 5, 25);

  text("(D) keypoints:", 5, 45);
  if(drawKeypoints_toggle){
    fill(0, 200, 0);
  }
  else{
    fill(255, 127, 0);
  }
  text(drawKeypoints_toggle, 85, 45);

  // call the functions to draw the keypoints
  if(drawKeypoints_toggle){
    drawKeypoints();
    drawSkeleton();
  }

  noStroke(); 
  fill(200, 200, 200);
  text(("threshold:" + threshold), 5, 65);

  text((minimumStill + ":"), 5, 115);
  if(poses.length > 0){
    if(minimumVal < threshold){
      fill(0, 200, 0);
    }
    else{
      fill(255, 127, 0);  
    }
    text((minimumVal), 5, 125);
  } 
  pop();
}

function linkPoseNet(stream){
    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video_input, poseNetLoaded);
    // .on() is an event listener
    poseNet.on('pose', detectedPose);
}

function poseNetLoaded(){
  console.log("poseNet iz Loaded!");
}

function loadVideo(){
  linkPoseNet();
  video_input.hide();
  videoIsPlaying = false;
}

function loadStills(){
  // change depending on input folder
  // scene1outfit1 = 2592
  // scene2outfit2 = 3192
  var amountOfStills = 3762;
  for(i = 1; i < amountOfStills; i++){
    // imgName give the images in StillImages a name to be referenced
    var imgName = `${still_input}_${('0000'+i).slice(-4)}`;
    // load in the correct still with reference to leading zeros
    // still input one because its the same as still_input but needs to be different from the string that you defined before
    var still_input1 = createImg(`assets/${still_input}_output3/${still_input}_${('0000'+i).slice(-4)}.jpg`);
    // push to array 
    StillImages.push(still_input1);
    StillImages[imgName] = still_input1;
    still_input1.hide();
  }
  console.log("stills loaded in");
}

// control the playing of the video
function keyPressed(){
  // p for PAUSE / PLAY
  if(key == 'p'){
    if(videoIsPlaying){
      videoIsPlaying = false;
      video_input.pause();
    }
    else{
      videoIsPlaying = true;
      // call link PoseNet here so that it is relinked on the loop and the code can run over and over
      linkPoseNet();
      video_input.loop();
    } 
  }
  if(key == 'd' && drawKeypoints_toggle == false){
    drawKeypoints_toggle = true;
  }
  else if(key == 'd' && drawKeypoints_toggle == true){
    drawKeypoints_toggle = false;
  }

  // k for key
  if( key == 'k'){
    // call find positions to do the calculations for comparison
    findPositions();
    displayMinimumStill();
    // video_input.pause();
    // videoIsPlaying = false;
    // display the images
  }

  // adjust threshold
  if(keyCode == LEFT_ARROW){
    threshold -= 50;
  }
  if(keyCode == RIGHT_ARROW){
    threshold += 50;
  }

  // fullscreen mode f
  if( key == 'f'){
    let fs = fullscreen();
    fullscreen(!fs);
  }
}

function detectedPose(results){
  // we store the pose in the poses global variable
  poses = results;
}

// function to draw ellipses over the detected keypoints
function drawKeypoints(){
  // Loop through all the poses detected
  for (let this_pose of poses){
    let pose = this_pose.pose;
    
    for (let keypoint of pose.keypoints){
      // if we are confident of keypoint we draw it
        fill(150, 150, 150);
        strokeWeight(1);
        stroke(255, 0, 0);
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
    }
  }
}

// function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let this_pose of poses) {
    let skeleton = this_pose.skeleton;
    
    for (let parts of skeleton) {

      let partA = parts[0];
      let partB = parts[1];
      stroke(255, 0, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}

// find positions creates an object and array to store current frame positions and the distances of each still. then calles the function to fill currentFramePositions[], and calls the functions to calc the distances of each still. finally, findLowestDistance() is called and the lowest distance is printed to the console with they key and the value.
function findPositions(){
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

function getCurrentFramePositions(array){
  for(let i = 0; i < poses[0].pose.keypoints.length; i++){

    array.push(
      [poses[0].pose.keypoints[i].position.x, 
       poses[0].pose.keypoints[i].position.y]);
    }
}

function getFrameJSONDistances(cFP, eFD){

  // for into stills obj, assigning to key
  for(const key in stillCoordsJSON){ 
    let sum = 0;
    // iterating over positions of each still
    for(let i = 0; i < 17 -1; i++){ 
      // finding the sum of each set of distances from each still image - that's what sum is doing
      // daniel's more accurate method using powers to cal dist
      sum += (cFP[i][0] - stillCoordsJSON[key][i*2])**2 + (cFP[i][1] - stillCoordsJSON[key][i*2+1])**2; 
    }
    //Push unnamed sum into out larger object with the key to corresponding to the frame
    eFD[key] = sum; 
  }
}

function findLowestDistance(eFD){

  // https://stackoverflow.com/questions/11142884/fast-way-to-get-the-min-max-values-among-properties-of-object
  // calculate the minimum distance - allows for option to add threshold 
  let objVal = Object.values(eFD);
  let objKey = Object.keys(eFD);
  // now global variable
  minimumVal = Math.min(...objVal);
  console.log( `Minimum Value: ${minimumVal}`);

  // find the corresponding key
  // ignoring case of empty list for conciseness
  minimumStill = objKey[0];
  // (changed i=1 to i=0 watch out)
  for (var i = 0; i < objKey.length; i++){

      var currentStill = objKey[i];
      if (eFD[currentStill] < eFD[minimumStill]){
       
        minimumStill = currentStill;
      }
  }
  console.log(`Minimum Still: ${minimumStill}`);
}

function displayMinimumStill(){
  // cant just draw an image from folder need to preload them in and ref them here
  // add threshold
  if(minimumVal < threshold){
    image(StillImages[minimumStill], 0, 0, width, height);
  }
}