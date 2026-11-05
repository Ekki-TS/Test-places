// Trang tra cuu dat ban. Tra cuu theo ma (thong tin lien he bi an) hoac theo so dien thoai.
(function () {
    var U = window.CustomerUtil;
    var $ = U.$;

    var mode = "code";           // "code" | "phone"
    var cancelTarget = null;     // dat ban dang xac nhan huy
    var requestToken = 0;

    var PLACEHOLDER = {
        code: "Nhập mã đặt bàn, VD: RB-2K9X4F",
        phone: "Nhập số điện thoại, VD: 0901 234 567"
    };

    function showSearchError(msg) {
        var el = $("searchErr");
        el.textContent = msg || "";
        el.hidden = !msg;
    }

    function setMode(m) {
        mode = m;
        document.querySelectorAll("#tabs button").forEach(function (b) {
            b.classList.toggle("on", b.dataset.mode === m);
        });
        $("q").placeholder = PLACEHOLDER[m];
        $("q").type = m === "phone" ? "tel" : "text";
        $("leadIcon").innerHTML = U.svg(m === "phone" ? "mobile" : "ticket");
        $("q").value = "";
        showSearchError("");
        $("q").focus();
    }

    function cell(icon, label, value) {
        return '<div class="cell"><small>' + U.svg(icon) + " " + label + "</small><strong></strong></div>";
    }

    function renderCard(r) {
        var when = U.parseLocal(r.reservation_time);
        var card = document.createElement("div");
        card.className = "res-card";
        card.innerHTML =
            '<div class="res-top"><div class="res-code"></div><span class="badge"></span></div>' +
            '<div class="res-grid">' +
            cell("calendar", "Thời gian") + cell("users", "Số lượng khách") +
            cell("pin", "Chi nhánh") + cell("chair", "Khu vực bàn") +
            cell("user", "Người đặt") + cell("phone", "Điện thoại") +
            "</div>";

        // Gan bang textContent de tranh chen HTML tu du lieu
        card.querySelector(".res-code").textContent = U.formatCode(r.code);
        var badge = card.querySelector(".badge");
        badge.classList.add(r.status);
        badge.textContent = U.statusLabel(r.status);

        var values = [
            U.formatTime(when) + " - " + U.weekdays[when.getDay()] + ", " + U.formatDate(when),
            r.party_size + " Khách",
            r.branch_name,
            U.prefLabel(r.preference),
            r.full_name,
            r.phone
        ];
        card.querySelectorAll(".cell strong").forEach(function (el, i) { el.textContent = values[i]; });

        var canCancel = (r.status === "pending" || r.status === "confirmed") && when.getTime() > Date.now();
        if (canCancel) {
            var actions = document.createElement("div");
            actions.className = "res-actions";
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn danger-outline";
            btn.textContent = "Hủy đặt bàn";
            btn.addEventListener("click", function () { openCancel(r); });
            actions.appendChild(btn);
            card.appendChild(actions);
        }
        return card;
    }

    function renderResults(list) {
        var box = $("results");
        box.innerHTML = "";
        if (!list.length) {
            box.innerHTML = '<div class="empty-state"><strong>Không tìm thấy đặt bàn</strong>' +
                'Vui lòng kiểm tra lại thông tin hoặc <a href="booking.html">đặt bàn mới</a>.</div>';
            return;
        }
        list.forEach(function (r) { box.appendChild(renderCard(r)); });
    }

    function search() {
        showSearchError("");
        var value = $("q").value.trim();
        var path;

        if (mode === "code") {
            var code = U.normalizeCode(value);
            if (code.length < 4) { showSearchError("Vui lòng nhập mã đặt bàn hợp lệ"); return; }
            path = "/reservations/lookup?code=" + encodeURIComponent(code);
        } else {
            var phone = U.cleanPhone(value);
            if (!U.isPhone(phone)) { showSearchError("Số điện thoại không hợp lệ"); return; }
            path = "/reservations/lookup?phone=" + encodeURIComponent(phone);
        }

        var token = ++requestToken;
        var btn = $("searchBtn");
        btn.disabled = true;
        $("results").innerHTML = '<div class="loading">Đang tra cứu...</div>';

        apiRequest(path)
            .then(function (res) {
                if (token === requestToken) renderResults(res.data || []);
            })
            .catch(function (err) {
                if (token !== requestToken) return;
                $("results").innerHTML = "";
                showSearchError(U.errorMessage(err));
            })
            .finally(function () { btn.disabled = false; });
    }

    /* ---------- Huy dat ban ---------- */

    function showCancelError(msg) {
        var el = $("cancelErr");
        el.textContent = msg || "";
        el.hidden = !msg;
    }

    function openCancel(r) {
        cancelTarget = r;
        showCancelError("");
        $("cancelDesc").textContent = "Đặt bàn " + U.formatCode(r.code) + " sẽ bị hủy. Vui lòng nhập số điện thoại đã dùng khi đặt bàn để xác nhận.";
        $("cancelPhone").value = r.phone_masked ? "" : r.phone;
        $("cancelPhoneField").hidden = !r.phone_masked;
        $("cancelModal").hidden = false;
        if (r.phone_masked) $("cancelPhone").focus();
    }

    function closeCancel() {
        $("cancelModal").hidden = true;
        cancelTarget = null;
    }

    function confirmCancel() {
        if (!cancelTarget) return;
        var phone = U.cleanPhone($("cancelPhone").value);
        if (!U.isPhone(phone)) { showCancelError("Số điện thoại không hợp lệ"); return; }

        var btn = $("cancelConfirm");
        btn.disabled = true;
        showCancelError("");
        apiRequest("/reservations/" + encodeURIComponent(cancelTarget.code) + "/cancel", "PATCH", { phone: phone })
            .then(function () {
                closeCancel();
                window.showToast("Đã hủy đặt bàn");
                search();
            })
            .catch(function (err) { showCancelError(U.errorMessage(err)); })
            .finally(function () { btn.disabled = false; });
    }

    /* ---------- Khoi dong ---------- */

    document.addEventListener("DOMContentLoaded", function () {
        $("tabs").addEventListener("click", function (e) {
            var btn = e.target.closest("button");
            if (btn) setMode(btn.dataset.mode);
        });
        $("lookupForm").addEventListener("submit", function (e) {
            e.preventDefault();
            search();
        });
        $("cancelKeep").addEventListener("click", closeCancel);
        $("cancelConfirm").addEventListener("click", confirmCancel);
        $("cancelModal").addEventListener("click", function (e) { if (e.target === this) closeCancel(); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCancel(); });

        // Mo tu trang thanh cong: lookup.html?code=RBXXXXXX
        var presetCode = new URLSearchParams(location.search).get("code");
        if (presetCode) {
            $("q").value = U.formatCode(U.normalizeCode(presetCode));
            search();
        }
    });
})();