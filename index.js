// index.js

document.addEventListener("DOMContentLoaded", async () => {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userInfo = document.getElementById("userInfo");
  const courseList = document.getElementById("courseList");

  // ========== 登入 / 登出 ==========
  loginBtn.onclick = async () => {
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) console.error("登入失敗:", error.message);
    } catch (err) {
      console.error("登入發生錯誤:", err);
    }
  };

  logoutBtn.onclick = async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
  
      if (!session) {
        console.warn("⚠️ 沒有登入狀態，直接顯示登出 UI");
        showGuest();
        return;
      }
  
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        console.error("登出失敗:", error.message);
      } else {
        showGuest();
      }
    } catch (err) {
      console.error("登出發生錯誤:", err);
    }
  };
  

  function showUser(user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    const name = user.user_metadata?.full_name || user.email;
    userInfo.innerHTML = `<i class="icon-hand"></i> 歡迎，${name}`;
  }
  

  function showGuest() {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    userInfo.textContent = "";
  }

  // 監聽登入狀態
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      showUser(session.user);
    } else {
      showGuest();
    }
  });

  // ========== 載入課程清單 ==========
  async function loadCourses() {
    try {
      const { data, error } = await supabaseClient
        .from("courses")
        .select("*");

      if (error) {
        courseList.innerHTML = "<p>❌ 載入課程失敗</p>";
        console.error("課程讀取錯誤:", error);
        return;
      }

      if (!data || data.length === 0) {
        courseList.innerHTML = "<p>目前沒有課程</p>";
        return;
      }

      courseList.innerHTML = data
        .map(
          (course) => `
        <div class="course-card">
          <div class="course-img">
            <img src="${course.cover}" alt="${course.title}">
          </div>
          <div class="course-content">
            <h3>${course.title}</h3>
            <p class="desc">${course.description || "這門課程沒有簡介"}</p>
            <div class="course-footer">
              <span class="price">NT$ ${course.price}</span>
              <button class="enroll-btn" onclick="window.location.href='course.html?id=${course.id}'">詳細資訊</button>
            </div>
          </div>
        </div>
      `
        )
        .join("");
    } catch (err) {
      console.error("Unexpected error:", err);
      courseList.innerHTML = "<p>⚠️ 載入課程時發生錯誤</p>";
    }
  }
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
  
  await loadCourses();
});
