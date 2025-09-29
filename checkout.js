// ✅ 共用 supabase-config.js 的 supabaseClient

const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get("course_id");

async function loadCourse() {
  if (!courseId) {
    alert("課程不存在");
    window.location.href = "index.html";
    return;
  }

  const { data: course, error } = await supabaseClient
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (error || !course) {
    alert("找不到課程");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("courseCover").src = course.cover;
  document.getElementById("courseTitle").textContent = course.title;
  document.getElementById("courseDesc").textContent = course.description || "";
  document.getElementById("coursePrice").textContent =
    course.price > 0 ? `NT$ ${course.price}` : "免費";
  document.getElementById("courseTotal").textContent =
    course.price > 0 ? `NT$ ${course.price}` : "免費";

  document.getElementById("payBtn").onclick = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user) {
      window.location.href = "login.html";
      return;
    }

    if (course.price === 0) {
      alert("這堂課免費，無需付款");
      window.location.href = `course.html?id=${course.id}`;
      return;
    }

    const { error: errInsert } = await supabaseClient
      .from("purchases")
      .insert([{ user_id: session.user.id, course_id: course.id }]);

    if (errInsert) {
      alert("付款失敗：" + errInsert.message);
    } else {
      alert("✅ 購買成功");
      window.location.href = `course.html?id=${course.id}`;
    }
  };
}

loadCourse();
