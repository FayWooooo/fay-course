document.addEventListener("DOMContentLoaded", () => {
    const adminEmail = "faywooooo@gmail.com";
  
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const panel = document.getElementById("adminPanel");
    const userInfo = document.getElementById("userInfo");
    const courseList = document.getElementById("adminCourseList");
    const addBtn = document.getElementById("addBtn");
    const chaptersContainer = document.getElementById("chaptersContainer");
    const addChapterBtn = document.getElementById("addChapterBtn");
  
    // ========== 登入 / 登出 ==========
    if (loginBtn) {
      loginBtn.onclick = async () => {
        await supabaseClient.auth.signInWithOAuth({ provider: "google" });
      };
    }
  
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await supabaseClient.auth.signOut();
      };
    }
  
    initSession();
  
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        handleAdmin(session.user);
      }
      if (event === "SIGNED_OUT") {
        showGuest();
      }
    });

  
    function handleAdmin(user) {
        const name = user.user_metadata?.full_name || user.email;
        userInfo.textContent = `目前登入：${name}`;
      
        if (user.email === adminEmail) {
            // ✅ 顯示後台
            document.getElementById("loginScreen").style.display = "none";
            document.querySelector(".sidebar").style.display = "flex";
            document.querySelector(".main-panel").style.display = "block";
          
            loginBtn.classList.add("is-hidden");
            logoutBtn.classList.remove("is-hidden");
            userInfo.textContent = `管理員：${user.email}`;
          
            panel.classList.remove("hidden");
            loadCourses();
          
          } else {
            // 🚫 非管理員 → 直接登出並跳轉首頁
            supabaseClient.auth.signOut();
            window.location.href = "index.html";
          }
          
      }
      
      
      function showGuest() {
        // 顯示登入畫面，隱藏後台
        document.getElementById("loginScreen").style.display = "flex";
        document.querySelector(".sidebar").style.display = "none";
        document.querySelector(".main-panel").style.display = "none";
      
        // nav 狀態：只顯示「登入」
        loginBtn.classList.remove("is-hidden");  // ← 顯示登入
        logoutBtn.classList.add("is-hidden");    // ← 隱藏登出
        userInfo.textContent = "";
      
        if (courseList) courseList.innerHTML = "";
      }
      
      
      
  
    function fileToDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  
    // ========== 動態章節/單元編輯器 ==========
    if (addChapterBtn) {
      addChapterBtn.addEventListener("click", () => {
        addChapter();
      });
    }
  
    function addChapter(title = "", items = []) {
      const chapterDiv = document.createElement("div");
      chapterDiv.classList.add("chapter-block");
      chapterDiv.style.border = "1px solid #ccc";
      chapterDiv.style.padding = "12px";
      chapterDiv.style.marginBottom = "12px";
      chapterDiv.style.borderRadius = "8px";
      chapterDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3>章節：<input type="text" class="chapter-title" value="${title || ""}"></h3>
        <div class="chapter-actions">
          <button type="button" class="btn move-chapter-up"><i class="fa-solid fa-arrow-up"></i></button>
          <button type="button" class="btn move-chapter-down"><i class="fa-solid fa-arrow-down"></i></button>
        </div>
      </div>
      <div class="lessons"></div>
      <button type="button" class="btn addLessonBtn">➕ 新增單元</button>
    `;
    
  
      chaptersContainer.appendChild(chapterDiv);
      // 章節移動
      chapterDiv.querySelector(".move-chapter-up").onclick = () => {
        if (chapterDiv.previousElementSibling) {
          chaptersContainer.insertBefore(chapterDiv, chapterDiv.previousElementSibling);
        }
      };
      
      chapterDiv.querySelector(".move-chapter-down").onclick = () => {
        if (chapterDiv.nextElementSibling) {
          chaptersContainer.insertBefore(chapterDiv.nextElementSibling, chapterDiv);
        }
      };
      
      const lessonsContainer = chapterDiv.querySelector(".lessons");
      items.forEach(lesson => addLesson(lessonsContainer, lesson));
  
      chapterDiv.querySelector(".addLessonBtn").addEventListener("click", () => {
        addLesson(lessonsContainer);
      });
    }
  
    function addLesson(container, data = {}) {
      const lessonDiv = document.createElement("div");
      lessonDiv.classList.add("lesson-block");
      lessonDiv.style.marginTop = "10px";
      lessonDiv.style.padding = "10px";
      lessonDiv.style.border = "1px dashed #aaa";
      lessonDiv.style.borderRadius = "6px";
  
      lessonDiv.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <div>
      <label>單元標題：<input type="text" class="lesson-title" value="${data.title || ""}"></label><br>
      <label>時長：
        <input type="number" class="lesson-minutes" value="${Math.floor((data.duration || 0) / 60)}"> 分 
        <input type="number" class="lesson-seconds" value="${(data.duration || 0) % 60}"> 秒
      </label><br>
      <label>影片檔名 (放在 /videos 資料夾)：<input type="text" class="lesson-video" value="${data.videoUrl || ""}"></label><br>
      <label>是否免費：
        <select class="lesson-free">
          <option value="true" ${data.isFree ? "selected" : ""}>免費</option>
          <option value="false" ${!data.isFree ? "selected" : ""}>付費</option>
        </select>
      </label>
    </div>
    <div class="lesson-actions">
      <button type="button" class="btn move-up"><i class="fa-solid fa-arrow-up"></i></button>
      <button type="button" class="btn move-down"><i class="fa-solid fa-arrow-down"></i></button>
    </div>
  </div>
`;

  
      container.appendChild(lessonDiv);
      // 綁定移動事件
lessonDiv.querySelector(".move-up").onclick = () => {
  if (lessonDiv.previousElementSibling) {
    container.insertBefore(lessonDiv, lessonDiv.previousElementSibling);
  }
};

lessonDiv.querySelector(".move-down").onclick = () => {
  if (lessonDiv.nextElementSibling) {
    container.insertBefore(lessonDiv.nextElementSibling, lessonDiv);
  }
};

    }
  
    // ========== 新增課程 ==========
    if (addBtn) {
      addBtn.onclick = async () => {
        const title = document.getElementById("title").value.trim();
        const desc = document.getElementById("desc").value.trim();
        const price = parseInt(document.getElementById("price").value, 10) || 0;
        const coverFile = document.getElementById("coverFile").files[0];
  
        if (!title || !desc || !coverFile) {
          alert("⚠️ 請填寫完整課程資訊並上傳圖片");
          return;
        }
  
        const coverDataURL = await fileToDataURL(coverFile);
        const chapters = parseChapters();
  
        const { error } = await supabaseClient
          .from("courses")
          .insert([{ title, description: desc, price, cover: coverDataURL, lessons: chapters }]);
  
        if (error) {
          alert("新增失敗: " + error.message);
        } else {
          alert("✅ 課程新增成功");
          resetForm();
          loadCourses();
        }
      };
    }
  
    function parseChapters() {
      const chapters = [];
      const chapterBlocks = chaptersContainer.querySelectorAll(".chapter-block");
  
      chapterBlocks.forEach(chapterDiv => {
        const chapterTitle = chapterDiv.querySelector(".chapter-title").value.trim();
        const lessons = [];
  
        chapterDiv.querySelectorAll(".lesson-block").forEach(lessonDiv => {
            const minutes = parseInt(lessonDiv.querySelector(".lesson-minutes").value, 10) || 0;
            const seconds = parseInt(lessonDiv.querySelector(".lesson-seconds").value, 10) || 0;
            const totalSeconds = minutes * 60 + seconds;
            
            lessons.push({
              title: lessonDiv.querySelector(".lesson-title").value.trim(),
              duration: totalSeconds,
              videoUrl: lessonDiv.querySelector(".lesson-video").value.trim(),
              isFree: lessonDiv.querySelector(".lesson-free").value === "true"
            });
            
        });
  
        if (chapterTitle && lessons.length > 0) {
          chapters.push({ title: chapterTitle, items: lessons });
        }
      });
      return chapters;
    }
  
    function resetForm() {
      document.getElementById("title").value = "";
      document.getElementById("desc").value = "";
      document.getElementById("price").value = "";
      document.getElementById("coverFile").value = "";
      chaptersContainer.innerHTML = "";
    }
  
    // ========== 課程清單 ==========
    async function loadCourses() {
      if (!courseList) return;
  
      courseList.innerHTML = "<tr><td colspan='4'>載入中...</td></tr>";
  
      const { data: courses, error } = await supabaseClient.from("courses").select("*");
  
      if (error) {
        courseList.innerHTML = `<tr><td colspan='4'>讀取失敗: ${error.message}</td></tr>`;
        return;
      }
  
      if (!courses || courses.length === 0) {
        courseList.innerHTML = "<tr><td colspan='4'>暫無課程</td></tr>";
        return;
      }
  
      courseList.innerHTML = "";
      courses.forEach((c) => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.id}</td>
          <td>${c.title}</td>
          <td>${c.price > 0 ? `NT$${c.price}` : "免費"}</td>
          <td>
            <button class="btn edit-btn" onclick='editCourse(${JSON.stringify(c)})'>✏️ 編輯</button>
            <button class="btn delete-btn" onclick="deleteCourse('${c.id}')">🗑️ 刪除</button>
          </td>
        `;
        courseList.appendChild(tr);
      });
    }
  
    // ========== 刪除課程 (雙重確認) ==========
window.deleteCourse = async function (id) {
  const input = prompt("請輸入「確定刪除」以繼續：");
  if (input !== "確定刪除") {
    alert("輸入錯誤，已取消刪除");
    return;
  }

  if (!confirm("⚠️ 真的要刪除這個課程嗎？")) return;

  const { error } = await supabaseClient.from("courses").delete().eq("id", id);
  if (error) {
    alert("刪除失敗: " + error.message);
  } else {
    alert("✅ 課程已刪除");
    loadCourses();
  }
};

async function initSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
      handleAdmin(session.user);
    } else {
      showGuest();
    }
  }
    // ========== 編輯課程 ==========
    window.editCourse = async function (course) {
      resetForm();
      document.getElementById("title").value = course.title;
      document.getElementById("desc").value = course.description || "";
      document.getElementById("price").value = course.price || 0;
  
      if (course.lessons && course.lessons.length > 0) {
        course.lessons.forEach(ch => addChapter(ch.title, ch.items));
      }
  
      addBtn.onclick = async () => {
        const title = document.getElementById("title").value.trim();
        const desc = document.getElementById("desc").value.trim();
        const price = parseInt(document.getElementById("price").value, 10) || 0;
        const coverFile = document.getElementById("coverFile").files[0];
  
        if (!title || !desc) {
          alert("⚠️ 請填寫完整課程資訊");
          return;
        }
  
        const chapters = parseChapters();
        let updateData = { title, description: desc, price, lessons: chapters };
  
        if (coverFile) {
          updateData.cover = await fileToDataURL(coverFile);
        }
  
        const { error } = await supabaseClient
          .from("courses")
          .update(updateData)
          .eq("id", course.id);
  
        if (error) {
          alert("更新失敗: " + error.message);
        } else {
          alert("✅ 課程更新成功");
          resetForm();
          loadCourses();
        }
      };
    };
  });
  // ========== 側邊欄切換功能 ==========
const navLinks = document.querySelectorAll(".sidebar nav a");
const panels = {
  "課程管理": document.getElementById("adminPanel"),
  "學員管理": document.getElementById("studentPanel"),
  "數據分析": document.getElementById("analyticsPanel"),
  "系統設定": document.getElementById("settingsPanel"),
};

navLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    // 清除 active 樣式
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    // 隱藏全部 panel
    Object.values(panels).forEach(p => p.classList.add("hidden"));

    // 顯示對應 panel
    const text = link.innerText.trim();
    if (panels[text]) {
      panels[text].classList.remove("hidden");
    }
  });
});
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebarOverlay");
  
    if (menuToggle) {
      menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
      });
    }
  
    if (overlay) {
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
      });
    }
  
    // 手勢滑動關閉
    let startX = 0;
    sidebar.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });
    sidebar.addEventListener("touchend", (e) => {
      let endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) { // 左滑超過 50px
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
      }
    });
  
  });
  const loader = document.getElementById("page-loader");

  // 換頁前：顯示進度條開始跑
  window.addEventListener("beforeunload", () => {
    loader.style.width = "0"; // 從 0 開始
    loader.classList.add("active");
  });
  
  // 頁面載入完成後：跑滿並消失
  window.addEventListener("load", () => {
    loader.classList.add("active");
    setTimeout(() => {
      loader.style.opacity = "0";   // 淡出
      loader.style.transition = "opacity 0.5s ease";
    }, 600);
  });
    