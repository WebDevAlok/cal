const videoData = {};
let currentVideo = null;
let currentSegment = null;
let responseData = {};
let videoUrls = [];
let pendingUploads = 0;
let defaultSegments = 0;
let defaultQuestions = 0;
let videoDurations = {};
let modifiedResponseData = {};
let hierarchyData = null;
let selectedSectionId = null;

// IndexedDB Storage Utility
class QuestionIndexedDB {
  constructor(dbName = "VideoQuestionDB", version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("videos")) {
          const videoStore = db.createObjectStore("videos", {
            keyPath: "video_url",
          });
          videoStore.createIndex("section_id", "section_id", { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject(`IndexedDB error: ${event.target.error}`);
      };
    });
  }

  async saveVideoData(videoData) {
    await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["videos"], "readwrite");
      const store = transaction.objectStore("videos");
      const request = store.put(videoData);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject("Failed to save video data");
    });
  }

  async getVideoData(videoUrl) {
    await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["videos"], "readonly");
      const store = transaction.objectStore("videos");
      const request = store.get(videoUrl);

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject("Failed to retrieve video data");
    });
  }

  async getAllVideos() {
    await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["videos"], "readonly");
      const store = transaction.objectStore("videos");
      const request = store.getAll();

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject("Failed to retrieve all videos");
    });
  }
}

const questionDB = new QuestionIndexedDB();

// Fetch course hierarchy when page loads
fetch("http://127.0.0.1:5000/api/courses/hierarchy", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((response) => response.json())
  .then((data) => {
    hierarchyData = data;
    populateCourseDropdown();
  })
  .catch((error) => console.error("Error fetching hierarchy:", error));

//Something similar should work while working on github codespaces

/*   fetch('https://refactored-waddle-wp7j4447vpq2g5xw-5000.app.github.dev/api/courses/hierarchy', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
  .then(response => response.json())
  .then(data => {
    hierarchyData = data;
    populateCourseDropdown();
  })
  .catch(error => console.error('Error fetching hierarchy:', error)); */

function populateCourseDropdown() {
  const courseSelect = document.getElementById("course-select");
  courseSelect.innerHTML = '<option value="">Select Course</option>';

  hierarchyData.results.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.name;
    courseSelect.appendChild(option);
  });
}

function deepCopy(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepCopy(item));
  }

  const copy = {};
  Object.keys(obj).forEach((key) => {
    copy[key] = deepCopy(obj[key]);
  });
  return copy;
}

function updateModuleDropdown(courseId) {
  const moduleSelect = document.getElementById("module-select");
  moduleSelect.innerHTML = '<option value="">Select Module</option>';
  moduleSelect.disabled = !courseId;

  if (!courseId) return;

  const course = hierarchyData.results.find((c) => c.id === parseInt(courseId));
  if (course) {
    course.modules.forEach((module) => {
      const option = document.createElement("option");
      option.value = module.id;
      option.textContent = module.title;
      moduleSelect.appendChild(option);
    });
  }
}

function updateSectionDropdown(moduleId) {
  const sectionSelect = document.getElementById("section-select");
  sectionSelect.innerHTML = '<option value="">Select Section</option>';
  sectionSelect.disabled = !moduleId;

  if (!moduleId) return;

  const course = hierarchyData.results.find((c) =>
    c.modules.some((m) => m.id === parseInt(moduleId))
  );
  if (course) {
    const module = course.modules.find((m) => m.id === parseInt(moduleId));
    if (module) {
      module.sections.forEach((section) => {
        const option = document.createElement("option");
        option.value = section.id;
        option.textContent = section.title;
        sectionSelect.appendChild(option);
      });
    }
  }
}

// Add event listeners for dropdowns
document.getElementById("course-select").addEventListener("change", (e) => {
  updateModuleDropdown(e.target.value);
  document.getElementById("section-select").disabled = true;
  document.getElementById("section-select").innerHTML =
    '<option value="">Select Section</option>';
});

document.getElementById("module-select").addEventListener("change", (e) => {
  updateSectionDropdown(e.target.value);
});

document.getElementById("section-select").addEventListener("change", (e) => {
  selectedSectionId = e.target.value ? parseInt(e.target.value) : null;
});

function secondsToHMS(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return { hrs, mins, secs };
}

function hmsToSeconds(hrs, mins, secs) {
  return hrs * 3600 + mins * 60 + secs;
}

function updateSegmentTimestamps(videoIndex, numSegments) {
  const videoDuration = videoDurations[videoIndex];
  const segmentDuration = videoDuration / numSegments;

  for (let i = 1; i <= numSegments; i++) {
    if (videoData[videoIndex].segments[i]) {
      videoData[videoIndex].segments[i].timestamp =
        i === 1 ? 0 : (i - 1) * segmentDuration;
    }
  }
}

function isPlaylistUrl(url) {
  return url.includes("playlist?list=") || url.includes("&list=");
}

// Load YouTube API
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "360",
    width: "640",
    videoId: "",
    playerVars: {
      playsinline: 1,
    },
  });
}

async function getVideoDuration(videoId) {
  return new Promise((resolve) => {
    const tempPlayer = new YT.Player("temp-player", {
      videoId: videoId,
      events: {
        onReady: (event) => {
          const duration = event.target.getDuration();
          event.target.destroy();
          resolve(duration);
        },
      },
    });
  });
}

function selectVideo(index) {
  currentVideo = index;

  // Extract video ID from URL and load it
  const videoUrl = videoUrls[index];
  const videoId = videoUrl.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts#\w\/\w\/.*\/))([^\/&\?]{10,12})/
  );
  if (videoId && videoId[1]) {
    if (player && player.loadVideoById) {
      player.loadVideoById(videoId[1]);
    }
  }

  const blocks = document.getElementsByClassName("video-block");
  Array.from(blocks).forEach((block) => block.classList.remove("active"));
  blocks[index].classList.add("active");

  const videoForm = document.getElementById("video-form");
  videoForm.style.display = "block";

  document.getElementById("num-segments-container").style.display = "block";

  if (!videoData[index]) {
    videoData[index] = {
      segments: {},
    };
    document.getElementById("num-segments").value = "";
    document.getElementById("segments-container").innerHTML = "";
    document.getElementById("details-form").style.display = "none";
  } else {
    const numSegments = Object.keys(videoData[index].segments).length;
    document.getElementById("num-segments").value = numSegments;

    // Rebuild segments UI without recalculating timestamps
    const segmentsContainer = document.getElementById("segments-container");
    segmentsContainer.innerHTML = "";

    for (let i = 1; i <= numSegments; i++) {
      const segmentBlock = document.createElement("div");
      segmentBlock.className = "segment-block";
      segmentBlock.textContent = `Segment ${i}`;
      segmentBlock.setAttribute("data-segment", i);
      segmentBlock.addEventListener("click", () => openSegmentForm(i));
      segmentsContainer.appendChild(segmentBlock);
    }
  }

  if (Object.keys(videoData[currentVideo].segments).length > 0) {
    openSegmentForm(1); // First segment is 1-based index
    const segmentBlocks = document.getElementsByClassName("segment-block");
    Array.from(segmentBlocks).forEach((block) =>
      block.classList.remove("active")
    );
    if (segmentBlocks.length > 0) {
      segmentBlocks[0].classList.add("active"); // Highlight first segment block
    }
  }
}

document.getElementById("fetch-videos").addEventListener("click", async () => {
  const playlistUrl = document.getElementById("playlist-url").value;
  defaultSegments =
    parseInt(document.getElementById("default-segments").value) || 0;
  defaultQuestions =
    parseInt(document.getElementById("default-questions").value) || 0;

  if (!defaultSegments) {
    alert("Please enter default number of segments");
    return;
  }
  if (!defaultQuestions) {
    alert("Please enter default number of questions");
    return;
  }

  try {
    if (isPlaylistUrl(playlistUrl)) {
      // Existing playlist handling
      const response = await fetch("/questions/get_urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: playlistUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      videoUrls = data.video_urls;
    } else {
      // Single video handling
      videoUrls = [playlistUrl];
    }

    // Get durations for all videos
    for (let i = 0; i < videoUrls.length; i++) {
      const videoId = videoUrls[i].match(
        /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts#\w\/\w\/.*\/))([^\/&\?]{10,12})/
      )[1];
      videoDurations[i] = await getVideoDuration(videoId);
    }

    displayVideoBlocks();
    document.getElementById("video-form").style.display = "block";

    // Auto-populate all videos with default segments
    videoUrls.forEach((_, index) => {
      videoData[index] = {
        segments: {},
      };
      if (defaultSegments > 0) {
        const numSegments = defaultSegments;
        for (let i = 1; i <= numSegments; i++) {
          const segmentDuration = videoDurations[index] / numSegments;
          videoData[index].segments[i] = {
            timestamp: (i - 1) * segmentDuration,
            questions: defaultQuestions || null,
            type: "analytical",
          };
        }
        document.getElementById("num-segments").value = numSegments;
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
});

function displayVideoBlocks() {
  const container = document.getElementById("videos-container");
  container.innerHTML = "";

  videoUrls.forEach((_, index) => {
    const videoBlock = document.createElement("div");
    videoBlock.className = "video-block";
    videoBlock.textContent = `Video ${index + 1}`;
    videoBlock.addEventListener("click", () => selectVideo(index));
    container.appendChild(videoBlock);
  });
}

const numSegmentsInput = document.getElementById("num-segments");
numSegmentsInput.addEventListener("input", () => {
  if (currentVideo === null) return;

  const numSegments = parseInt(numSegmentsInput.value) || 0;
  const segmentsContainer = document.getElementById("segments-container");
  const currentSegments = videoData[currentVideo].segments;

  // Clear container
  segmentsContainer.innerHTML = "";

  // Calculate segment duration based on video duration
  const videoDuration = videoDurations[currentVideo];
  const segmentDuration = videoDuration / numSegments;

  // Create new segments object
  const newSegments = {};

  for (let i = 1; i <= numSegments; i++) {
    const segmentBlock = document.createElement("div");
    segmentBlock.className = "segment-block";
    segmentBlock.textContent = `Segment ${i}`;
    segmentBlock.setAttribute("data-segment", i);
    segmentBlock.addEventListener("click", () => openSegmentForm(i));
    segmentsContainer.appendChild(segmentBlock);

    // Preserve existing segment data if available
    if (currentSegments[i]) {
      newSegments[i] = {
        ...currentSegments[i],
      };
    } else {
      // Only calculate new timestamp for new segments
      newSegments[i] = {
        timestamp: i === 1 ? 0 : (i - 1) * segmentDuration,
        questions: defaultQuestions || null,
        type: "analytical",
      };
    }
  }

  // Replace old segments with new ones
  videoData[currentVideo].segments = newSegments;
});

function openSegmentForm(segmentNumber) {
  currentSegment = segmentNumber;
  const data = videoData[currentVideo].segments[segmentNumber];

  const formTitle = document.getElementById("form-title");
  const questionsInput = document.getElementById("questions");
  const typeInput = document.getElementById("type");

  const timestampFields = document.querySelectorAll(
    "#timestamp-hr, #timestamp-min, #timestamp-sec"
  );
  if (segmentNumber === 1) {
    timestampFields.forEach((field) => {
      field.value = "0";
      field.disabled = true;
    });
  } else {
    const timestamp = data.timestamp || 0;
    const { hrs, mins, secs } = secondsToHMS(timestamp);
    document.getElementById("timestamp-hr").value = hrs;
    document.getElementById("timestamp-min").value = mins;
    document.getElementById("timestamp-sec").value = secs;
    timestampFields.forEach((field) => (field.disabled = false));
  }

  formTitle.textContent = `Segment ${segmentNumber} Details`;
  questionsInput.value = data.questions || "";
  typeInput.value = data.type || "";

  document.getElementById("details-form").style.display = "block";

  const segmentBlocks = document.getElementsByClassName("segment-block");
  Array.from(segmentBlocks).forEach((block) =>
    block.classList.remove("active")
  );
  document
    .querySelector(`[data-segment="${segmentNumber}"]`)
    ?.classList.add("active");
}

function saveSegmentData() {
  if (currentVideo === null || currentSegment === null) return;

  const hrs = parseInt(document.getElementById("timestamp-hr").value) || 0;
  const mins = parseInt(document.getElementById("timestamp-min").value) || 0;
  const secs = parseInt(document.getElementById("timestamp-sec").value) || 0;
  const questionsInput = document.getElementById("questions");
  const typeInput = document.getElementById("type");

  videoData[currentVideo].segments[currentSegment] = {
    timestamp: currentSegment === 1 ? 0 : hmsToSeconds(hrs, mins, secs),
    questions: parseInt(questionsInput.value) || null,
    type: typeInput.value || "",
  };
}

function validateTimestamps() {
  for (let videoIndex in videoData) {
    const segments = videoData[videoIndex].segments;
    const segmentNumbers = Object.keys(segments).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );

    let previousTimestamp = -1;

    for (let segNum of segmentNumbers) {
      const currentTimestamp = segments[segNum].timestamp;

      // Check if timestamps are in order
      if (currentTimestamp <= previousTimestamp && segNum !== "1") {
        alert(
          `Video ${
            parseInt(videoIndex) + 1
          }, Segment ${segNum}: Timestamp (${currentTimestamp}s) must be greater than previous segment's timestamp (${previousTimestamp}s)`
        );
        return false;
      }

      // Check if last segment timestamp is less than video duration
      if (segNum === segmentNumbers[segmentNumbers.length - 1]) {
        if (currentTimestamp >= videoDurations[videoIndex]) {
          alert(
            `Video ${
              parseInt(videoIndex) + 1
            }, Segment ${segNum}: Last segment timestamp (${currentTimestamp}s) must be less than video duration (${
              videoDurations[videoIndex]
            }s)`
          );
          return false;
        }
      }

      previousTimestamp = currentTimestamp;
    }
  }
  return true;
}

document.getElementById("questions").addEventListener("input", saveSegmentData);
document.getElementById("type").addEventListener("change", saveSegmentData);

["timestamp-hr", "timestamp-min", "timestamp-sec"].forEach((id) => {
  document.getElementById(id).addEventListener("input", saveSegmentData);
});

function getTotalSegments(videoIndex) {
  return Object.keys(videoData[videoIndex]?.segments || {}).length;
}

function createBatches(videoIndices) {
  const batches = [];
  let currentBatch = [];
  let currentBatchSegments = 0;

  for (const videoIndex of videoIndices) {
    const videoSegments = getTotalSegments(videoIndex);

    if (currentBatchSegments + videoSegments > 15) {
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }
      currentBatch = [videoIndex];
      currentBatchSegments = videoSegments;
    } else {
      currentBatch.push(videoIndex);
      currentBatchSegments += videoSegments;
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

async function processBatches(batches) {
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    // Process all videos in current batch concurrently
    const batchPromises = batch.map(async (videoIndex) => {
      const videoURL = videoUrls[videoIndex];
      const segments = videoData[videoIndex].segments;

      const timestamps = [];
      const segmentWiseQNo = [];
      const segmentWiseQModel = [];

      Object.values(segments).forEach((data) => {
        if (data.timestamp !== null)
          timestamps.push(parseInt(data.timestamp, 10));
        if (data.questions !== null) segmentWiseQNo.push(data.questions);
        if (data.type !== null) segmentWiseQModel.push(data.type);
      });

      const payload = {
        url: videoURL,
        user_api_key: document.getElementById("user-api-key").value,
        timestamps,
        segment_wise_q_no: segmentWiseQNo,
        segment_wise_q_model: segmentWiseQModel,
      };

      console.log("SUMN SUS GOIN' ON HERE:", payload);

      const response = await fetch("/questions/process_video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      responseData[videoIndex] = data;

      // Save to IndexedDB
      await questionDB.saveVideoData({
        ...data,
        video_url: videoURL,
      });

      return data;
    });

    await Promise.all(batchPromises);

    // Wait 90 seconds before processing next batch
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 90000));
    }
  }
}

document
  .getElementById("video-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateTimestamps()) {
      return;
    }

    const userApiKey = document.getElementById("user-api-key").value;
    const generatingSign = document.getElementById("generating-sign");
    const outputDiv = document.getElementById("output");
    const confirmButton = document.getElementById("confirm-btn");

    generatingSign.style.display = "block";
    outputDiv.style.display = "none";
    confirmButton.style.display = "none";

    try {
      const videoIndices = Object.keys(videoData).map(Number);
      const batches = createBatches(videoIndices);
      await processBatches(batches);

      modifiedResponseData = deepCopy(responseData);

      console.log("Original responseData:", responseData);
      console.log("Modified responseData:", modifiedResponseData);

      generatingSign.style.display = "none";
      outputDiv.style.display = "block";
      displayOutput(modifiedResponseData[currentVideo]);
      confirmButton.style.display = "inline-block";
    } catch (error) {
      generatingSign.style.display = "none";
      outputDiv.textContent = `Error processing videos: ${error.message}`;
    }
  });

function displayOutput(data) {
  // Add logging to track data
  console.log("Raw data entering displayOutput:", data);

  // Display output video blocks
  const outputVideosContainer = document.getElementById(
    "output-videos-container"
  );
  if (!outputVideosContainer.hasChildNodes()) {
    videoUrls.forEach((_, index) => {
      const videoBlock = document.createElement("div");
      videoBlock.className = "video-block";
      videoBlock.textContent = `Video ${index + 1}`;
      videoBlock.addEventListener("click", () => {
        // Add logging before calling showVideoOutput
        console.log(
          "Data before showing video output:",
          modifiedResponseData[index]
        );
        showVideoOutput(index);
      });
      outputVideosContainer.appendChild(videoBlock);
    });
  }

  // Ensure data is passed correctly to showVideoOutput
  if (data) {
    console.log("Data before initial showVideoOutput:", data);
    showVideoOutput(currentVideo);
  }
}

function saveVideoEdits(videoIndex) {
  if (!modifiedResponseData[videoIndex]) return;

  const data = modifiedResponseData[videoIndex];

  // Save title and description
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("description");
  if (titleEl) data.title = titleEl.value;
  if (descEl) data.description = descEl.value;

  // Save segment modifications
  data.segments.forEach((segment, i) => {
    const textEl = document.getElementById(`segment-text-${i}`);
    if (textEl) segment.text = textEl.value;
  });

  // Save question modifications
  data.questions = data.questions.map((question, i) => {
    const newQuestion = { ...question };
    const questionTextEl = document.getElementById(`question-text-${i}`);
    const option1El = document.getElementById(`option-${i}-0`);
    const option2El = document.getElementById(`option-${i}-1`);
    const option3El = document.getElementById(`option-${i}-2`);
    const option4El = document.getElementById(`option-${i}-3`);
    const correctAnswerEl = document.getElementById(`correct-answer-${i}`);

    if (questionTextEl) newQuestion.question = questionTextEl.value;
    if (option1El) newQuestion.option_1 = option1El.value;
    if (option2El) newQuestion.option_2 = option2El.value;
    if (option3El) newQuestion.option_3 = option3El.value;
    if (option4El) newQuestion.option_4 = option4El.value;
    if (correctAnswerEl)
      newQuestion.correct_answer = parseInt(correctAnswerEl.value);

    return newQuestion;
  });

  questionDB.saveVideoData(data);
}

async function showVideoOutput(index) {
  // First, try to get data from IndexedDB
  const storedVideoData = await questionDB.getVideoData(videoUrls[index]);

  if (storedVideoData) {
    // If data exists in IndexedDB, use it
    modifiedResponseData[index] = storedVideoData;
  }

  if (!modifiedResponseData[index]) return;

  if (currentVideo !== null) {
    saveVideoEdits(currentVideo);
  }

  const data = modifiedResponseData[index];

  // Store the current video index for the download
  currentVideo = index;

  const blocks = document
    .getElementById("output-videos-container")
    .getElementsByClassName("video-block");
  Array.from(blocks).forEach((block) => block.classList.remove("active"));
  blocks[index].classList.add("active");

  // Display video information
  const videoInfo = document.getElementById("video-info");
  videoInfo.innerHTML = `
    <label for="video-url">Video URL</label>
    <input type="text" id="video-url" value="${data.video_url}" disabled />

    <label for="title">Title</label>
    <input type="text" id="title" value="${data.title}" />

    <label for="description">Description</label>
    <textarea id="description">${data.description}</textarea>

    <label for="section-info">Selected Section</label>
    <input type="text" id="section-info" value="${
      hierarchyData?.results
        .find((course) =>
          course.modules.some((module) =>
            module.sections.some((section) => section.id === selectedSectionId)
          )
        )
        ?.modules.find((module) =>
          module.sections.some((section) => section.id === selectedSectionId)
        )
        ?.sections.find((section) => section.id === selectedSectionId)?.title ||
      "No section selected"
    }" disabled />
  `;

  // Display segments
  const segmentsContainer = document.getElementById(
    "output-segments-container"
  );
  const segmentDetailsContainer = document.getElementById(
    "segment-details-container"
  );

  segmentsContainer.innerHTML = "";
  segmentDetailsContainer.innerHTML = "";

  data.segments.forEach((segment, i) => {
    const segmentBlock = document.createElement("div");
    segmentBlock.className = "segment-block";
    segmentBlock.textContent = `Segment ${i + 1}`;
    segmentBlock.dataset.segment = i;
    segmentBlock.addEventListener("click", () => showSegmentDetails(i));
    segmentsContainer.appendChild(segmentBlock);

    const segmentDetails = document.createElement("div");
    segmentDetails.className = "segment-details";
    segmentDetails.id = `segment-${i}`;
    segmentDetails.innerHTML = `
      <h5>Segment ${i + 1}</h5>
      <label for="segment-text-${i}">Text</label>
      <textarea id="segment-text-${i}">${segment.text}</textarea>

      <label for="start-time-${i}">Start Time</label>
      <div style="display: flex; gap: 10px;">
        <input type="number" id="start-time-hr-${i}" value="${Math.floor(
      i === 0 ? 0 : segment.start_time / 3600
    )}" disabled style="width: 33%;" />
        <input type="number" id="start-time-min-${i}" value="${Math.floor(
      (i === 0 ? 0 : segment.start_time % 3600) / 60
    )}" disabled style="width: 33%;" />
        <input type="number" id="start-time-sec-${i}" value="${Math.floor(
      (i === 0 ? 0 : segment.start_time) % 60
    )}" disabled style="width: 33%;" />
      </div>

      <label for="end-time-${i}">End Time</label>
      <div style="display: flex; gap: 10px;">
        <input type="number" id="end-time-hr-${i}" value="${Math.floor(
      segment.end_time / 3600
    )}" disabled style="width: 33%;" />
        <input type="number" id="end-time-min-${i}" value="${Math.floor(
      (segment.end_time % 3600) / 60
    )}" disabled style="width: 33%;" />
        <input type="number" id="end-time-sec-${i}" value="${Math.floor(
      segment.end_time % 60
    )}" disabled style="width: 33%;" />
      </div>
    `;
    segmentDetailsContainer.appendChild(segmentDetails);
  });

  // Display questions
  const questionsContainer = document.getElementById(
    "output-questions-container"
  );
  const questionDetailsContainer = document.getElementById(
    "question-details-container"
  );

  questionsContainer.innerHTML = "";
  questionDetailsContainer.innerHTML = "";
  console.log("Data", data);

  data.questions.forEach((question, i) => {
    const questionBlock = document.createElement("div");
    questionBlock.className = "question-block";
    questionBlock.textContent = `Question ${i + 1}`;
    questionBlock.dataset.question = i;
    questionBlock.addEventListener("click", () => showQuestionDetails(i));
    questionsContainer.appendChild(questionBlock);

    const questionDetails = document.createElement("div");
    questionDetails.className = "question-details";
    questionDetails.id = `question-${i}`;

    questionDetails.innerHTML = `
      <h5>Question ${i + 1}</h5>
      <label for="question-text-${i}">Question Text</label>
      <textarea id="question-text-${i}">${question.question}</textarea>
      
      <h6>Options</h6>
      <label for="option-${i}-0">Option 1</label>
      <input type="text" id="option-${i}-0" value="${
      question.option_1 || ""
    }" />
      <label for="option-${i}-1">Option 2</label>
      <input type="text" id="option-${i}-1" value="${
      question.option_2 || ""
    }" />
      <label for="option-${i}-2">Option 3</label>
      <input type="text" id="option-${i}-2" value="${
      question.option_3 || ""
    }" />
      <label for="option-${i}-3">Option 4</label>
      <input type="text" id="option-${i}-3" value="${
      question.option_4 || ""
    }" />

      <label for="correct-answer-${i}">Correct Answer</label>
      <input type="number" id="correct-answer-${i}" value="${
      question.correct_answer
    }" />

      <label for="segment-index-${i}">Segment</label>
      <input type="number" id="segment-index-${i}" value="${
      question.segment
    }" disabled />
    `;
    questionDetailsContainer.appendChild(questionDetails);
  });

  // Show first segment and question by default
  if (data.segments.length > 0) showSegmentDetails(0);
  if (data.questions.length > 0) showQuestionDetails(0);
}

function showSegmentDetails(index) {
  const allDetails = document.getElementsByClassName("segment-details");
  Array.from(allDetails).forEach((detail) => (detail.style.display = "none"));

  const allBlocks = document.getElementsByClassName("segment-block");
  Array.from(allBlocks).forEach((block) => block.classList.remove("active"));

  document.getElementById(`segment-${index}`).style.display = "block";
  document.querySelector(`[data-segment="${index}"]`).classList.add("active");

  saveVideoEdits(currentVideo);
}

function showQuestionDetails(index) {
  const allDetails = document.getElementsByClassName("question-details");
  Array.from(allDetails).forEach((detail) => (detail.style.display = "none"));

  const allBlocks = document.getElementsByClassName("question-block");
  Array.from(allBlocks).forEach((block) => block.classList.remove("active"));

  document.getElementById(`question-${index}`).style.display = "block";
  document.querySelector(`[data-question="${index}"]`).classList.add("active");

  saveVideoEdits(currentVideo);
}

document
  .getElementById("recalculate-timestamps")
  .addEventListener("click", () => {
    if (currentVideo === null || !videoDurations[currentVideo]) return;

    const numSegments = Object.keys(videoData[currentVideo].segments).length;
    const videoDuration = videoDurations[currentVideo];
    const segmentDuration = videoDuration / numSegments;

    // Update all segments except the first one (which stays at 0)
    for (let i = 2; i <= numSegments; i++) {
      const newTimestamp = (i - 1) * segmentDuration;
      videoData[currentVideo].segments[i].timestamp = newTimestamp;

      // If this segment is currently open in the form, update the form fields
      if (currentSegment === i) {
        const { hrs, mins, secs } = secondsToHMS(newTimestamp);
        document.getElementById("timestamp-hr").value = hrs;
        document.getElementById("timestamp-min").value = mins;
        document.getElementById("timestamp-sec").value = secs;
      }
    }
  });

document.getElementById("confirm-btn").addEventListener("click", async () => {
  if (!selectedSectionId) {
    alert("Please select a section before submitting");
    return;
  }

  // Save modifications for current video before proceeding
  if (currentVideo !== null) {
    saveVideoEdits(currentVideo);
  }

  // Gather and send data for all videos
  const videoIndices = Object.keys(modifiedResponseData).map(Number);
  const errors = [];

  for (const videoIndex of videoIndices) {
    const data = modifiedResponseData[videoIndex];

    const modifiedData = {
      video_url: data.video_url,
      title: data.title,
      description: data.description,
      section_id: selectedSectionId,
      segments: data.segments.map((segment) => ({ ...segment })),
      questions: data.questions.map((question) => ({ ...question })),
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/output", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(modifiedData),
      });

      await questionDB.saveVideoData(modifiedData);

      if (!response.ok) {
        throw new Error(
          `Video ${videoIndex + 1}: HTTP error! status: ${response.status}`
        );
      }
    } catch (error) {
      console.error("Error:", error);
      errors.push(error.message);
    }
  }

  if (errors.length > 0) {
    alert("Some videos failed to submit:\n" + errors.join("\n"));
  } else {
    alert("All videos submitted successfully!");
  }
});
