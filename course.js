document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("courseContainer");

  // 從 URL query string 抓課程 ID
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("id");

  if (!courseId) {
    window.location.href = "404.html";
    return;
  }

  try {
    // 抓課程資料
    const { data: course, error } = await supabaseClient
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (error || !course) {
      console.error("課程不存在:", error);
      window.location.href = "404.html";
      return;
    }

    // 顯示課程內容
    container.innerHTML = `
    <div class="course-header">
      <h1>${course.title}</h1>
      <img src="${course.cover}" alt="課程封面" style="width:900px;border-radius:15px">
      <p>${course.description}</p>
      <p class="price">${course.price > 0 ? `NT$ ${course.price}` : "免費"}</p>
      <div id="purchaseSection"></div>
    </div>
    <div id="courseLessons"></div>
  `;
  

    renderChapters(course.lessons, course.id);
    renderPurchaseButton(course);

  } catch (err) {
    console.error("Unexpected error:", err);
    window.location.href = "404.html";
  }
});

// ========== 渲染章節與單元 ==========
async function renderChapters(chapters, courseId) {
    const container = document.getElementById("courseLessons");
    container.innerHTML = "";
  
    if (!chapters || chapters.length === 0) {
      container.innerHTML = "<p>尚未有課程內容。</p>";
      return;
    }
  
    // 取得目前使用者
    const { data: { session } } = await supabaseClient.auth.getSession();
    const user = session?.user || null;
  
    chapters.forEach(chapter => {
      const chapterDiv = document.createElement("div");
      chapterDiv.classList.add("chapter-block");
  
      // 章節標題
      const chapterHeader = document.createElement("h3");
      chapterHeader.textContent = chapter.title;
      chapterHeader.style.cursor = "pointer";
      chapterHeader.style.padding = "10px";
      chapterHeader.style.background = "#f4f4f4";
      chapterHeader.style.border = "1px solid #ddd";
      chapterHeader.style.borderRadius = "6px";
  
      // 單元容器（預設收合）
      const lessonsContainer = document.createElement("div");
      lessonsContainer.style.display = "none";
      lessonsContainer.style.margin = "10px 0 20px 20px";
  
      // 單元列表
      let lessonsHtml = "";
      for (const lesson of chapter.items) {
        // 判斷內容型態（文章/影片）
        const typeIcon = lesson.videoUrl && lesson.videoUrl.endsWith(".mp4")
          ? `<i class="icon-video"></i>`   // 影片
          : `<i class="icon-article"></i>`; // 文章或其他
  
        // 免費 / 付費標籤
        const accessLabel = lesson.isFree
          ? `<span style="color:green; font-size:0.9em;">[免費]</span>`
          : `<span style="color:#c00; font-size:0.9em;">[付費]</span>`;
  
        lessonsHtml += `
          <div class="lesson-block" style="margin-bottom: 10px;display:flex;align-items: center;">
          <h4>
          <i class="fa-solid fa-video"></i> ${lesson.title} 
          <span class="duration">(${Math.floor(lesson.duration / 60)}分${lesson.duration % 60}秒)</span>
        </h4>
        
            <div class="lesson-video" data-url="${lesson.videoUrl}" data-free="${lesson.isFree}" data-course="${courseId}">
              ${lesson.isFree 
                ? `<button style="margin-left:20px;background-color:white;color:#007bff;padding:5px;cursor:pointer;border-radius:10px;border:solid #007bff 2px;">觀看影片</button>` 
                : `<button style="margin-left:20px;background-color:white;color:#007bff;padding:5px;cursor:pointer;border-radius:10px;border:solid #007bff 2px;">購買後可看</button>`}
            </div>
          </div>
        `;
      }
      lessonsContainer.innerHTML = lessonsHtml;
  
      // 點擊章節標題 → 切換展開/收合
      chapterHeader.addEventListener("click", () => {
        lessonsContainer.style.display = lessonsContainer.style.display === "none" ? "block" : "none";
      });
  
      // 組裝
      chapterDiv.appendChild(chapterHeader);
      chapterDiv.appendChild(lessonsContainer);
      container.appendChild(chapterDiv);
    });
  
    // 綁定播放事件
    document.querySelectorAll(".lesson-video").forEach(el => {
      el.querySelector("button").addEventListener("click", async () => {
        await handlePlay(el, user);
      });
    });
    
  }
  

  // ========== 播放控制 ==========
  async function handlePlay(el, user) {
    const fileName = el.dataset.url;
    const isFree = el.dataset.free === "true";
    const courseId = el.dataset.course;
    const title = el.closest(".lesson-block").querySelector("h4").textContent;
  
    if (!isFree && !user) {
      alert("⚠️ 請先登入才能觀看付費課程");
      return;
    }
  
    if (!isFree) {
      const { data: purchase } = await supabaseClient
        .from("purchases")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .single();
      if (!purchase) {
        alert("⚠️ 尚未購買此課程");
        return;
      }
    }
  
    openVideoModal(`videos/${fileName}`, title);
  }
  
  
  // ========== 插入影片 ==========
  function insertVideo(parent, src) {
    if (parent.querySelector("video")) return;
    // 這裡只要處理插入，不要再宣告 openVideoModal
  }
  
  // ========== 開啟影片小視窗 (Modal) ==========
  function openVideoModal(src, title) {
    const modal = document.getElementById("videoModal");
    const videoWrapper = document.getElementById("videoWrapper");
    const videoTitle = document.getElementById("videoTitle");
  
    videoTitle.textContent = title;
    videoWrapper.innerHTML = `
      <video id="customVideo">
        <source src="${src}" type="video/mp4">
      </video>
    `;
  
    modal.style.display = "flex";
  
    const video = document.getElementById("customVideo");
    const playPause = document.getElementById("playPause");
    const seekBar = document.getElementById("seekBar");
    const mute = document.getElementById("mute");
    const fullscreen = document.getElementById("fullscreen");
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    seekBar.parentElement.appendChild(tooltip);
  
    // 確保平滑移動
    seekBar.setAttribute("step", "0.01");
  
    // ▶ 播放 / ❚❚ 暫停
    playPause.innerHTML = `<i class="fa-solid fa-play"></i>`;
    playPause.onclick = () => {
      if (video.paused) {
        video.play();
        playPause.innerHTML = `<i class="fa-solid fa-pause"></i>`;
      } else {
        video.pause();
        playPause.innerHTML = `<i class="fa-solid fa-play"></i>`;
      }
    };
  
    // 更新進度條（平滑）
    video.ontimeupdate = () => {
      if (!isNaN(video.duration)) {
        seekBar.value = (video.currentTime / video.duration) * 100;
      }
    };
  
    // 拖曳進度條
    seekBar.oninput = () => {
      video.currentTime = (seekBar.value / 100) * video.duration;
    };
  
    // Hover 顯示時間
    seekBar.onmousemove = (e) => {
      const rect = seekBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const previewTime = percent * video.duration;
      const mins = Math.floor(previewTime / 60);
      const secs = Math.floor(previewTime % 60);
      tooltip.textContent = `${mins}分${secs}秒`;
      tooltip.style.left = `${e.clientX - rect.left}px`;
      tooltip.style.top = `-25px`;
      tooltip.style.display = "block";
    };
    seekBar.onmouseleave = () => {
      tooltip.style.display = "none";
    };
  
    // 🔊 聲音 / 🔇 靜音
    mute.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
    mute.onclick = () => {
      video.muted = !video.muted;
      mute.innerHTML = video.muted
        ? `<i class="fa-solid fa-volume-xmark"></i>`
        : `<i class="fa-solid fa-volume-high"></i>`;
    };
  
    // ⛶ 全螢幕
    fullscreen.innerHTML = `<i class="fa-solid fa-expand"></i>`;
    fullscreen.onclick = () => {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    };
  
    // 關閉 modal
    document.getElementById("closeModal").onclick = () => {
      video.pause();
      modal.style.display = "none";
    };
  }
  
  
  
  const style = document.createElement("style");
style.textContent = `
  /* ---- Modal ---- */
  .modal {
    display: none;
    position: fixed;
    z-index: 9999;
    left: 0; top: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(12px);
    justify-content: center;
    align-items: center;
  }
  .modal-content {
    background: rgba(20,20,20,0.95);
    padding: 20px;
    border-radius: 16px;
    max-width: 900px;
    width: 90%;
    position: relative;
    box-shadow: 0 0 20px rgba(0,255,255,0.3);
    animation: popIn 0.3s ease;
  }
  @keyframes popIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  /* ---- Title ---- */
  #videoTitle {
    font-size: 1.4rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 10px;
    background: linear-gradient(90deg, #00f2ff, #9d00ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* ---- Video ---- */
  .modal video {
    width: 100%;
    border-radius: 12px;
    background: black;
    box-shadow: 0 0 15px rgba(0,0,0,0.6);
  }

  /* ---- Close ---- */
  .close {
    position: absolute;
    top: 12px; right: 18px;
    font-size: 28px;
    cursor: pointer;
    color: #fff;
    transition: 0.2s;
  }
  .close:hover {
    color: #00f2ff;
  }

  /* ---- Controls ---- */
  .custom-controls {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: rgba(30,30,30,0.85);
    border-radius: 12px;
  }
  .custom-controls button {
    background: rgba(0,0,0,0.6);
    border: none;
    color: #fff;
    font-size: 1.1rem;
    width: 40px; height: 40px;
    border-radius: 50%;
    cursor: pointer;
    transition: 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .custom-controls button:hover {
    background: linear-gradient(135deg, #00f2ff, #9d00ff);
    color: #fff;
    box-shadow: 0 0 10px rgba(0,255,255,0.5);
  }

  /* ---- Seek Bar ---- */
  .custom-controls input[type="range"] {
    flex: 1;
    height: 6px;
    -webkit-appearance: none;
    background: linear-gradient(90deg, #00f2ff, #9d00ff);
    border-radius: 4px;
    cursor: pointer;
  }
  .custom-controls input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #00f2ff;
    cursor: pointer;
    transition: 0.2s;
  }
  .custom-controls input[type="range"]::-webkit-slider-thumb:hover {
    background: #00f2ff;
  }
  .tooltip {
    position: absolute;
    background: rgba(0,0,0,0.75);
    color: white;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
    pointer-events: none;
    display: none;
    transform: translateX(-50%);
  }

  .tooltip {
    position: absolute;
    background: rgba(0,0,0,0.75);
    color: white;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
    pointer-events: none;
    display: none;
    transform: translateX(-50%);
  };
  /* 頁面轉換 Loading 條 */
#page-loader {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  width: 0;
  background: #0077ff;
  z-index: 9999;
  transition: width 0.4s ease;
}
#page-loader.active {
  width: 100%;
}
`
  document.head.appendChild(style);
  // ========== 購買按鈕 ==========
  async function renderPurchaseButton(course) {
    const section = document.getElementById("purchaseSection");
  
    if (course.price > 0) {
      section.innerHTML = `
        <button id="buyBtn" class="btn primary" style="background-color:white;color:#007bff;padding:5px;cursor:pointer;border-radius:10px;border:solid #007bff 2px;">
          <i class="fa-solid fa-cart-shopping"></i> 立即購買 (NT$${course.price})
        </button>
      `;
  
      document.getElementById("buyBtn").onclick = async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.user) {
          window.location.href = "index.html";
          return;
        }
        window.location.href = `checkout.html?course_id=${course.id}`;
      };
    } else {
      section.innerHTML = `<p style="color:green;font-weight:bold;">本課程為免費課程</p>`;
    }
  }
  // 模擬每次頁面轉換時顯示進度條
function showPageLoader() {
  const loader = document.getElementById("page-loader");
  loader.classList.add("active");

  // 自動隱藏 (模擬載入結束)
  setTimeout(() => {
    loader.classList.remove("active");
    loader.style.width = "0"; // 重置
  }, 800); // 0.8 秒結束
}

// 當網頁載入或換頁時觸發
window.addEventListener("beforeunload", showPageLoader);
window.addEventListener("load", showPageLoader);

  