// ==========================================
// جسور التسامح - نظام النشر المباشر
// Supabase + Local Demo
// ==========================================

const SUPABASE_URL = "https://xqjassgvdqnqeiueosoo.supabase.co";

const SUPABASE_ANON_KEY =
"sb_publishable_-F3D_CNtKstwpQEXpdA7Nw_l05bpZZf";

const hasCloud = Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    window.supabase
);

const db = hasCloud
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )
    : null;


// ==========================================
// العناصر الأساسية
// ==========================================

const $ = selector => document.querySelector(selector);

const roleNames = {
    student: "طالب",
    parent: "ولي أمر",
    teacher: "معلم"
};

const prompts = {
    student: "أكمل العبارة: التسامح بالنسبة لي هو...",
    parent: "ما القيمة التي تحرص على تعليمها لأبنائك لتعزيز التسامح؟",
    teacher: "كيف تعزز ثقافة التسامح وتقبل الاختلاف في البيئة التعليمية؟"
};

const leafColors = {
    student: "#d9bd83",
    parent: "#9eb38a",
    teacher: "#d59a80"
};

let approvedMessages = [];
let isLoading = false;


// ==========================================
// حماية النصوص
// ==========================================

function safeText(value) {

    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

}


// ==========================================
// تغيير السؤال حسب نوع المشارك
// ==========================================

function updateRole() {

    const selected = document.querySelector(
        'input[name="role"]:checked'
    );

    if (!selected) return;

    $("#questionLabel").textContent =
        prompts[selected.value];

}

document
    .querySelectorAll('input[name="role"]')
    .forEach(element => {

        element.addEventListener("change", updateRole);

    });


// ==========================================
// عداد الأحرف
// ==========================================

$("#promptText").addEventListener("input", event => {

    $("#charCount").textContent =
        event.target.value.length + " / 280";

});


// ==========================================
// الإحصائيات
// ==========================================

function renderStats(rows) {

    const counts = {
        student: 0,
        parent: 0,
        teacher: 0
    };

    rows.forEach(row => {

        if (counts[row.role] !== undefined) {
            counts[row.role]++;
        }

    });

    $("#totalCount").textContent = rows.length;

    $("#studentCount").textContent = counts.student;

    $("#parentCount").textContent = counts.parent;

    $("#teacherCount").textContent = counts.teacher;

}


// ==========================================
// جدار الرسائل
// ==========================================

function renderWall(rows) {

    const wall = $("#messageWall");

    if (!rows.length) {

        wall.innerHTML = `
            <div class="empty-wall">
                ستظهر هنا الرسائل من المشاركين 🌿
            </div>
        `;

        return;
    }

    wall.innerHTML = rows.slice(0, 9).map(row => `

        <article class="message-card">

            <span class="leaf-mark">✦</span>

            <p>${safeText(row.message)}</p>

            <small>
                ${roleNames[row.role] || "مشارك"}
                · رسالة مشاركة
            </small>

        </article>

    `).join("");

}


// ==========================================
// شجرة التسامح
// ==========================================

function renderTree(rows) {

    const group = $("#treeLeaves");

    group.innerHTML = "";

    const positions = [
        [300,80],[245,110],[355,110],
        [190,145],[410,145],[270,175],
        [330,180],[130,205],[470,190],
        [220,235],[380,240],[300,265],
        [170,285],[430,285],[260,315],
        [340,320],[300,135],[235,195],
        [365,195],[300,220]
    ];

    rows.slice(0, 40).forEach((row, index) => {

        const [x, y] = positions[index % positions.length];

        const ns = "http://www.w3.org/2000/svg";

        const leaf = document.createElementNS(
            ns,
            "ellipse"
        );

        const extra = index >= positions.length
            ? Math.floor(index / positions.length) * 7
            : 0;

        leaf.setAttribute("cx", x);

        leaf.setAttribute("cy", y + extra);

        leaf.setAttribute("rx", 10 + (index % 3) * 2);

        leaf.setAttribute("ry", 6 + (index % 2) * 2);

        leaf.setAttribute(
            "fill",
            leafColors[row.role] || "#d9bd83"
        );

        leaf.setAttribute("class", "tree-leaf");

        leaf.setAttribute(
            "transform",
            `rotate(${(index * 37) % 90 - 45} ${x} ${y})`
        );

        group.appendChild(leaf);

    });

    $("#treeMessage").textContent = rows.length
        ? `شجرتنا تحمل ${rows.length} أثرًا جميلًا`
        : "كل أثر طيب... ينبت خيرًا";

    $("#treeSub").textContent = rows.length
        ? "كل ورقة هنا تمثل رسالة إيجابية من أحد أفراد المجتمع."
        : "كن أول من يزرع ورقته في شجرتنا.";

}


// ==========================================
// تحديث جميع أجزاء الموقع
// ==========================================

function render(rows) {

    renderStats(rows);

    renderWall(rows);

    renderTree(rows);

}


// ==========================================
// تحميل الرسائل المعتمدة
// ==========================================

async function loadApproved() {

    if (isLoading) return;

    isLoading = true;

    try {

        if (!db) {

            approvedMessages = JSON.parse(
                sessionStorage.getItem("atharApproved") || "[]"
            );

            render(approvedMessages);

            $("#modeHint").textContent =
                "وضع تجريبي محلي: المشاركات تظهر في هذه الجلسة فقط.";

            return;
        }

        const { data, error } = await db
            .from("submissions")
            .select("id,role,message,created_at")
            .eq("status", "approved")
            .order("created_at", {
                ascending: false
            })
            .limit(60);

        if (error) throw error;

        approvedMessages = data || [];

        render(approvedMessages);

        $("#modeHint").textContent =
            "تُنشر المشاركات مباشرة وتظهر للجميع دون انتظار موافقة.";

    }

    catch (error) {

        console.error("Loading error:", error);

        $("#modeHint").textContent =
            "تعذر تحميل المشاركات. تحقق من الاتصال.";

    }

    finally {

        isLoading = false;

    }

}


// ==========================================
// إرسال رسالة ونشرها مباشرة
// ==========================================

$("#shareForm").addEventListener("submit", async event => {

    event.preventDefault();

    const status = $("#formStatus");

    const button = $(".submit-btn");

    const selectedRole = document.querySelector(
        'input[name="role"]:checked'
    );

    if (!selectedRole) {

        status.textContent = "اختر نوع المشاركة أولاً.";

        return;

    }

    const role = selectedRole.value;

    const message = $("#promptText").value.trim();

    // التحقق من نوع المشارك

    if (!roleNames[role]) {

        status.textContent = "نوع المشاركة غير صحيح.";

        return;

    }

    // التحقق من طول الرسالة

    if (message.length < 8 || message.length > 280) {

        status.textContent =
            "يجب أن تكون الرسالة بين 8 و280 حرفًا.";

        return;

    }

    // منع الروابط وبيانات التواصل

    if (/https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(message)) {

        status.textContent =
            "فضلاً، لا تضف روابط أو بيانات تواصل.";

        return;

    }

    // منع الإرسال المتكرر

    button.disabled = true;

    status.textContent = "جارٍ نشر رسالتك...";

    try {

        const payload = {
            role: role,
            message: message,
            status: "approved"
        };

        if (db) {

            const { error } = await db
                .from("submissions")
                .insert(payload);

            if (error) throw error;

            // تحديث الجدار مباشرة

            await loadApproved();

        }

        else {

            approvedMessages.unshift({
                ...payload,
                id: Date.now(),
                created_at: new Date().toISOString()
            });

            sessionStorage.setItem(
                "atharApproved",
                JSON.stringify(approvedMessages)
            );

            render(approvedMessages);

        }

        // تفريغ النموذج

        $("#promptText").value = "";

        $("#charCount").textContent = "0 / 280";

        status.textContent =
            "🌿 وصلت رسالتك ونُشرت بنجاح! شكرًا لمساهمتك في نشر التسامح.";

    }

    catch (error) {

        console.error("Submission error:", error);

        status.textContent =
    "سبب الخطأ: " + (error?.message || String(error));

    }

    finally {

        button.disabled = false;

    }

});


// ==========================================
// التحديث المباشر من Supabase
// ==========================================

if (db) {

    db.channel("public-submissions-live")

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "submissions"
            },
            () => {

                loadApproved();

            }
        )

        .subscribe();

    // تحديث احتياطي كل 15 ثانية

    setInterval(() => {

        loadApproved();

    }, 15000);

}


// ==========================================
// تشغيل الموقع
// ==========================================

updateRole();

load();
