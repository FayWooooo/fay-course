// ⚡ Supabase 初始化設定
// 這個檔案只負責建立連線，不要綁定任何 DOM 或按鈕事件

// 你的 Supabase 專案 URL
const SUPABASE_URL = "https://ibnfnrabvaasrwtugjic.supabase.co";  

// 你的公開 anon key（建議放 .env，這裡示範用直寫）
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibmZucmFidmFhc3J3dHVnamljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NzY3NTcsImV4cCI6MjA3NDU1Mjc1N30.aDutkDvMHAmkjy0Ecc6E7WzOpXXj1u7tnAdwOTGfDsw";  

// 建立全域 Supabase client，其他檔案 (index.js, admin.js) 可以直接用
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 匯出 (如果要支援 ES Module，可用 export)
// export { supabaseClient };
