// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
KNN Classification on Webcam Images with mobileNet. Built with p5.js
=== */
let video;
let canvas;
// Create a KNN classifier
const knnClassifier = ml5.KNNClassifier();
let featureExtractor;

let prompt = "";
let charArray = [];
let charOpacities = [];

let stopClassify = false;

let currentCharIndex = 0;


// Membrane Synth https://tonejs.github.io/docs/r12/MembraneSynth
const synth = new Tone.Synth().toMaster();
const notes = ["C3", "C3", "G3", "G3", "A3", "A3", "G3", null,
               "F3", "F3", "E3", "E3", "D3", "D3", "C3", null,

];

const synthPart = new Tone.Sequence(
  function (time, note) {
    synth.triggerAttackRelease(note, "10hz", time);
  },
  notes,
  "4n"
);

synthPart.start();



/////////////////////////////////////////////////////////////////////////////////



function setup() {
  // Create a featureExtractor that can extract the already learned features from MobileNet
  featureExtractor = ml5.featureExtractor('MobileNet', modelReady);
  // noCanvas();
  canvas = createCanvas(600, 400);
  // Create a video element
  video = createCapture(VIDEO);
  // Append it to the videoContainer DOM element
  video.parent('videoContainer');
  video.hide();
  canvas.parent('canvasHolder');

  // Create the UI buttons
  createButtons();
  prompt = "STAR";
  charOpacities = [0, 0, 0, 0];
  charArray = prompt.split("")
  console.log(charArray);
}

function draw() {
  background(0);
  noStroke();
  textSize(80);

  for (let c of charArray) {
    let charOpacity = charOpacities[charArray.indexOf(c)];
    fill(charOpacity);
    if (charOpacity >= 255) {
      fill(255, 255, 0);
    }
    text(c, 100 * (charArray.indexOf(c) + 1), 200);
  }

  let lightUpCount = 0;
  for (let co of charOpacities) {
    if (co == 255) {
      lightUpCount++;
    }
  }
  currentCharIndex = lightUpCount;
  // console.log(currentCharIndex);
  if (lightUpCount == charOpacities.length) {
    // alert("yay");

    // if (!stopClassify) {
      //playback logic
      // notes.forEach(function (note) {
      //   var noteDuration = note.quantizedEndStep - note.quantizedStartStep;
      //   playNote(note.pitch, noteDuration);
      // });
      Tone.Transport.start();
    // } else {
    //   Tone.Transport.stop();
    // }


    stopClassify = true;
  }

}

function modelReady() {
  select('#status').html('FeatureExtractor(mobileNet model) Loaded')
}

// Add the current frame from the video to the classifier
function addExample(label) {
  // Get the features of the input video
  const features = featureExtractor.infer(video);
  // You can also pass in an optional endpoint, defaut to 'conv_preds'
  // const features = featureExtractor.infer(video, 'conv_preds');
  // You can list all the endpoints by calling the following function
  // console.log('All endpoints: ', featureExtractor.mobilenet.endpoints)

  // Add an example with a label to the classifier
  knnClassifier.addExample(features, label);
  updateCounts();
}

// Predict the current frame.
function classify() {
  // Get the total number of labels from knnClassifier
  const numLabels = knnClassifier.getNumLabels();
  if (numLabels <= 0) {
    console.error('There is no examples in any label');
    return;
  }
  // Get the features of the input video
  const features = featureExtractor.infer(video);

  // Use knnClassifier to classify which label do these features belong to
  // You can pass in a callback function `gotResults` to knnClassifier.classify function
  if (!stopClassify) {
    knnClassifier.classify(features, gotResults);
  }

  // You can also pass in an optional K value, K default to 3
  // knnClassifier.classify(features, 3, gotResults);

  // You can also use the following async/await function to call knnClassifier.classify
  // Remember to add `async` before `function predictClass()`
  // const res = await knnClassifier.classify(features);
  // gotResults(null, res);
}

// A util function to create UI buttons
function createButtons() {
  // When the A button is pressed, add the current frame
  // from the video with a label of "S" to the classifier
  buttonA = select('#addClassS');
  buttonA.mousePressed(function () {
    addExample('S');
  });

  // When the B button is pressed, add the current frame
  // from the video with a label of "T" to the classifier
  buttonB = select('#addClassT');
  buttonB.mousePressed(function () {
    addExample('T');
  });

  // When the C button is pressed, add the current frame
  // from the video with a label of "A" to the classifier
  buttonC = select('#addClassA');
  buttonC.mousePressed(function () {
    addExample('A');
  });

  // When the C button is pressed, add the current frame
  // from the video with a label of "A" to the classifier
  buttonD = select('#addClassR');
  buttonD.mousePressed(function () {
    addExample('R');
  });


  // When the C button is pressed, add the current frame
  // from the video with a label of "A" to the classifier
  buttonE = select('#addClassNothing');
  buttonE.mousePressed(function () {
    addExample('Nothing');
  });


  // Reset buttons
  resetBtnA = select('#resetS');
  resetBtnA.mousePressed(function () {
    clearLabel('S');
  });

  resetBtnB = select('#resetT');
  resetBtnB.mousePressed(function () {
    clearLabel('T');
  });

  resetBtnC = select('#resetA');
  resetBtnC.mousePressed(function () {
    clearLabel('A');
  });

  resetBtnD = select('#resetR');
  resetBtnD.mousePressed(function () {
    clearLabel('R');
  });

  resetBtnD = select('#resetNothing');
  resetBtnD.mousePressed(function () {
    clearLabel('Nothing');
  });


  // Predict button
  buttonPredict = select('#buttonPredict');
  buttonPredict.mousePressed(() => { stopClassify = false; classify() });

  // Clear all classes button
  buttonClearAll = select('#clearAll');
  buttonClearAll.mousePressed(clearAllLabels);

  // Load saved classifier dataset
  buttonSetData = select('#load');
  buttonSetData.mousePressed(loadMyKNN);

  // Get classifier dataset
  buttonGetData = select('#save');
  buttonGetData.mousePressed(saveMyKNN);
}

// Show the results
function gotResults(err, result) {
  // Display any error
  if (err) {
    console.error(err);
  }

  if (result.confidencesByLabel) {
    const confidences = result.confidencesByLabel;
    // result.label is the label that has the highest confidence
    if (result.label) {
      select('#result').html(result.label);
      select('#confidence').html(`${confidences[result.label] * 100} %`);
      // if (confidences[result.label] * 100 >= 60){
        lightUpLetter(result.label);
      // }
      
    }

    select('#confidenceS').html(`${confidences['S'] ? confidences['S'] * 100 : 0} %`);
    select('#confidenceT').html(`${confidences['T'] ? confidences['T'] * 100 : 0} %`);
    select('#confidenceA').html(`${confidences['A'] ? confidences['A'] * 100 : 0} %`);
    select('#confidenceR').html(`${confidences['R'] ? confidences['R'] * 100 : 0} %`);
    select('#confidenceNothing').html(`${confidences['Nothing'] ? confidences['Nothing'] * 100 : 0} %`);
  }

  classify();
}

// Update the example count for each label	
function updateCounts() {
  const counts = knnClassifier.getCountByLabel();

  select('#exampleS').html(counts['S'] || 0);
  select('#exampleT').html(counts['T'] || 0);
  select('#exampleA').html(counts['A'] || 0);
  select('#exampleR').html(counts['R'] || 0);
  select('#exampleNothing').html(counts['Nothing'] || 0);
}

// Clear the examples in one label
function clearLabel(label) {
  knnClassifier.clearLabel(label);
  updateCounts();
}

// Clear all the examples in all labels
function clearAllLabels() {
  knnClassifier.clearAllLabels();
  updateCounts();
}

// Save dataset as myKNNDataset.json
function saveMyKNN() {
  knnClassifier.save('myKNNDataset');
}

// Load dataset to the classifier
function loadMyKNN() {
  knnClassifier.load('./myKNNDataset.json', updateCounts);
}

function lightUpLetter(letter) {
  switch (letter) {
    case "S":
      if (currentCharIndex == 0 && charOpacities[0] < 255) {
        charOpacities[0] += 5;
      }
      break;

    case "T":
      if (currentCharIndex == 1 && charOpacities[1] < 255) {
        charOpacities[1] += 5;
      }
      break;
    case "A":
      if (currentCharIndex == 2 && charOpacities[2] < 255) {
        charOpacities[2] += 5;
      }
      break;
    case "R":
      if (currentCharIndex == 3 && charOpacities[3] < 255) {
        charOpacities[3] += 5;
      }
      break;
  }
}