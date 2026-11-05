// Dung chung cho cac trang web khach: header, footer, icon, ham tien ich.
// Nap SAU ../assets/js/api.js. Moi trang co <body class="customer" data-page="...">
(function () {
    var ICONS = {
        user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',
        check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
        x: '<path d="M6 6l12 12M18 6L6 18"/>',
        calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><path d="M16 4.7a3.5 3.5 0 010 6.6M18 14.3c2 .8 3.5 2.7 3.5 5.7"/>',
        pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 10-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
        store: '<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3"/>',
        chair: '<path d="M7 4h10v9H7zM5 13h14v3H5zM7 16v4M17 16v4"/>',
        window: '<rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M12 3.5v17M4 12h16"/>',
        door: '<path d="M6 21V4.5A1.5 1.5 0 017.5 3h9A1.5 1.5 0 0118 4.5V21M4 21h16"/><circle cx="14.5" cy="12.5" r=".8"/>',
        sofa: '<path d="M5 11V8a2 2 0 012-2h10a2 2 0 012 2v3M3 13a2 2 0 014 0v1h10v-1a2 2 0 014 0v4H3zM6 17v2M18 17v2"/>',
        mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
        phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
        info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
        shield: '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5L16 9.5"/>',
        star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
        copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6.5a2 2 0 00-2-2h-7a2 2 0 00-2 2v7a2 2 0 002 2h2"/>',
        search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
        home: '<path d="M4 11l8-7 8 7M6 10v10h12V10"/>',
        ticket: '<path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
        mobile: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
        wine: '<path d="M8 3h8l-.5 6a3.5 3.5 0 01-7 0zM12 12.5V20M8.5 20.5h7"/>',
        walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M12 8l-3 3v4l-2 5M12 8l3 3 2 1M11 13l3 3 1 5"/>',
        concierge: '<path d="M12 4a8 8 0 018 8v2H4v-2a8 8 0 018-8zM3 17h18M12 4V2.5"/>',
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
        moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
        arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
        chevron: '<path d="M6 9l6 6 6-6"/>',
        sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'
    };

    function svg(name) {
        return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
    }

    // Thay moi <i data-icon="ten"></i> bang icon SVG
    function applyIcons(root) {
        (root || document).querySelectorAll("i[data-icon]").forEach(function (el) {
            el.outerHTML = svg(el.getAttribute("data-icon"));
        });
    }

    var NAV = [
        ["home", "Trang chủ", "../index.html"],
        ["menu", "Thực đơn", "../index.html#menu"],
        ["branches", "Chi nhánh", "../index.html#branches"],
        ["booking", "Đặt bàn", "booking.html"],
        ["lookup", "Tra cứu đặt bàn", "lookup.html"]
    ];

    function headerHtml(page) {
        var links = NAV.map(function (n) {
            return '<a href="' + n[2] + '"' + (n[0] === page ? ' class="active"' : "") + ">" + n[1] + "</a>";
        }).join("");
        return '<header class="site-header"><div class="wrap">' +
            '<a class="brand" href="../index.html"><span class="name">Nhà hàng</span><span class="tag">Ẩm thực thượng hạng</span></a>' +
            '<nav class="main-nav">' + links + "</nav>" +
            '<div class="header-right">' +
            '<div class="hotline"><small>Hotline đặt bàn</small><strong>1900 8888</strong></div>' +
            '<a class="btn-peach" href="booking.html">Đặt Bàn Ngay</a>' +
            '<a class="avatar-btn" href="../../admin/login.html" title="Đăng nhập"><i data-icon="user"></i></a>' +
            "</div></div></header>";
    }

    function footerHtml() {
        return '<footer class="site-footer"><div class="wrap"><div class="footer-grid">' +
            '<div><div class="logo">Nhà hàng</div>' +
            "<p>Nơi hội tụ tinh hoa ẩm thực truyền thống và đương đại, trao gửi trải nghiệm thượng lưu trong từng phong vị thuần khiết.</p>" +
            '<p class="contact"><b>Hotline:</b> &nbsp;1900 8888</p><p class="contact"><b>Email:</b> &nbsp;concierge@nhahang.vn</p></div>' +
            "<div><h4>Chi nhánh hoạt động</h4>" +
            '<p class="row-b">Chi nhánh Quận 1</p><p>Số 18 Đường Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>' +
            '<p class="row-b">Chi nhánh Hà Nội</p><p>Số 36 Phố Lý Thường Kiệt, Quận Hoàn Kiếm, TP. Hà Nội</p></div>' +
            "<div><h4>Thời gian phục vụ</h4>" +
            '<p class="row-b">Bữa Trưa</p><p>11:30 - 14:30 (Thứ 2 - Chủ Nhật)</p>' +
            '<p class="row-b">Bữa Tối &amp; Yến Tiệc</p><p>17:30 - 22:30 (Thứ 2 - Chủ Nhật)</p>' +
            '<span class="vip-chip">Phục vụ phòng VIP theo yêu cầu riêng</span></div>' +
            "<div><h4>Đặc quyền hội viên</h4>" +
            "<p>Đăng ký nhận thư mời về các thực đơn theo mùa, dạ tiệc rượu vang và sự kiện ẩm thực độc bản.</p>" +
            '<form class="news" onsubmit="event.preventDefault();window.showToast(\'Cảm ơn quý khách đã đăng ký\');this.reset();">' +
            '<input type="email" required placeholder="Địa chỉ email của quý khách..."><button type="submit">Gửi</button></form>' +
            '<div class="footer-note">Chúng tôi cam kết bảo mật thông tin cá nhân.</div></div>' +
            '</div></div><div class="footer-bottom"><div class="wrap">' +
            "<span>© 2024 Nhà hàng Haute Cuisine Collection. Bản quyền thuộc về Nhà hàng.</span>" +
            "<nav><a href=\"#\">Chính sách Đặt Bàn</a><a href=\"#\">Quy Chuẩn Trang Phục</a><a href=\"#\">Bảo Mật</a></nav>" +
            "</div></div></footer>";
    }

    // ---------- Tien ich ----------
    var WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

    function pad(n) { return n < 10 ? "0" + n : "" + n; }

    window.CustomerUtil = {
        svg: svg,
        applyIcons: applyIcons,
        pad: pad,
        weekdays: WEEKDAYS,
        $: function (id) { return document.getElementById(id); },
        cleanPhone: function (p) { return (p || "").replace(/[\s.\-]/g, ""); },
        isPhone: function (p) { return /^(0|\+84)\d{9,10}$/.test(p); },
        isEmail: function (e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); },
        // "RBXXXXXX" -> "RB-XXXXXX"
        formatCode: function (c) { return c && c.length > 2 ? c.slice(0, 2) + "-" + c.slice(2) : c || ""; },
        normalizeCode: function (c) { return (c || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase(); },
        // "2026-11-06T19:00:00" -> Date (gio dia phuong, khong lech mui gio)
        parseLocal: function (iso) {
            var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || "");
            return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : new Date(iso);
        },
        toDateInput: function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); },
        formatDate: function (d) { return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); },
        formatTime: function (d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); },
        prefLabel: function (p) {
            return { window: "Bàn cạnh cửa sổ", vip: "Phòng VIP Private", celebration: "Kỷ niệm / Sinh nhật" }[p] || "Khu vực chung";
        },
        statusLabel: function (s) {
            return { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", cancelled: "Đã hủy", completed: "Hoàn tất" }[s] || s;
        },
        // Loi mang -> thong bao than thien
        errorMessage: function (err) {
            if (err && err.message && err.message !== "Failed to fetch" && err.name !== "TypeError") return err.message;
            return "Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.";
        }
    };

    window.showToast = function (msg) {
        var t = document.createElement("div");
        t.className = "toast";
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 2200);
    };

    document.addEventListener("DOMContentLoaded", function () {
        var page = document.body.getAttribute("data-page");
        var h = document.getElementById("site-header");
        var f = document.getElementById("site-footer");
        if (h) h.outerHTML = headerHtml(page);
        if (f) f.outerHTML = footerHtml();
        applyIcons();
    });
})();