// Trang dat ban. Can: ../assets/js/api.js (apiRequest) va common.js (CustomerUtil)
(function () {
    var U = window.CustomerUtil;
    var $ = U.$;

    var state = {
        branches: [],
        party: 4,
        time: null,       // "19:00"
        pref: "window",   // general | window | vip
        slotsToken: 0     // chong ket qua tra ve sai thu tu
    };

    var PREF_TO_API = { general: null, window: "window", vip: "vip" };

    /* ---------- Tien ich form ---------- */

    function setError(name, message) {
        var field = $("f-" + name);
        if (!field) return;
        field.classList.toggle("invalid", !!message);
        field.querySelector(".err").textContent = message || "";
    }

    function clearErrors() {
        ["branch_id", "date", "party_size", "time", "full_name", "phone", "email", "note"]
            .forEach(function (n) { setError(n, ""); });
    }

    function branchById(id) {
        for (var i = 0; i < state.branches.length; i++) {
            if (String(state.branches[i].id) === String(id)) return state.branches[i];
        }
        return null;
    }

    /* ---------- Tom tat ben phai ---------- */

    function setSummary(id, text, placeholder) {
        var el = $(id);
        el.textContent = text;
        el.classList.toggle("placeholder", !!placeholder);
    }

    function renderSummary() {
        var b = branchById($("branch_id").value);
        setSummary("sumBranch", b ? b.name : "Chưa chọn", !b);

        var date = $("date").value;
        if (date && state.time) {
            var d = date.split("-");
            setSummary("sumTime", state.time + ", " + d[2] + "/" + d[1] + "/" + d[0], false);
        } else {
            setSummary("sumTime", "Chưa chọn", true);
        }

        $("partyText").textContent = state.party + " Khách";
        setSummary("sumParty", state.party + " Khách", false);
        setSummary("sumPref", U.prefLabel(PREF_TO_API[state.pref]), false);

        var name = $("full_name").value.trim();
        setSummary("sumName", name || "Chưa nhập", !name);
    }

    /* ---------- Chi nhanh ---------- */

    function loadBranches() {
        var select = $("branch_id");
        apiRequest("/customer/branches")
            .then(function (res) {
                state.branches = res.data || [];
                select.innerHTML = "";
                if (!state.branches.length) {
                    select.innerHTML = '<option value="">Chưa có chi nhánh đang hoạt động</option>';
                    renderSummary();
                    return;
                }
                state.branches.forEach(function (b) {
                    var o = document.createElement("option");
                    o.value = b.id;
                    o.textContent = b.name + " - " + b.address + ", " + b.city;
                    select.appendChild(o);
                });
                // Cho phep chon san chi nhanh qua ?branch=ID
                var wanted = new URLSearchParams(location.search).get("branch");
                if (wanted && branchById(wanted)) select.value = wanted;
                renderSummary();
                loadSlots();
            })
            .catch(function (err) {
                select.innerHTML = '<option value="">Không tải được chi nhánh</option>';
                setError("branch_id", U.errorMessage(err));
            });
    }

    /* ---------- Khung gio ---------- */

    function slotButton(slot) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "slot" + (state.time === slot.time ? " on" : "");
        btn.textContent = slot.time;
        btn.disabled = !slot.available;
        btn.title = slot.available ? "Còn " + slot.remaining + " chỗ" : "Không khả dụng";
        btn.addEventListener("click", function () {
            state.time = slot.time;
            setError("time", "");
            document.querySelectorAll(".slot").forEach(function (s) { s.classList.remove("on"); });
            btn.classList.add("on");
            renderSummary();
        });
        return btn;
    }

    function loadSlots() {
        var branchId = $("branch_id").value;
        var date = $("date").value;
        var lunch = $("slotsLunch");
        var dinner = $("slotsDinner");
        var status = $("slotStatus");
        if (!branchId || !date) return;

        var token = ++state.slotsToken;
        status.className = "slot-status";
        status.textContent = "Đang kiểm tra chỗ trống...";

        var path = "/reservations/availability?branch_id=" + encodeURIComponent(branchId) +
            "&date=" + encodeURIComponent(date) + "&party_size=" + state.party;

        apiRequest(path)
            .then(function (res) {
                if (token !== state.slotsToken) return;
                lunch.innerHTML = "";
                dinner.innerHTML = "";
                var slots = res.data.slots || [];
                var anyAvailable = false;
                var stillValid = false;
                slots.forEach(function (s) {
                    if (s.available) anyAvailable = true;
                    if (s.available && s.time === state.time) stillValid = true;
                    (s.period === "lunch" ? lunch : dinner).appendChild(slotButton(s));
                });
                if (!stillValid) state.time = null;
                if (anyAvailable) {
                    status.textContent = "";
                } else {
                    status.className = "slot-status warn";
                    status.textContent = "Ngày này đã hết chỗ hoặc quá giờ nhận đặt. Vui lòng chọn ngày khác.";
                }
                renderSummary();
            })
            .catch(function (err) {
                if (token !== state.slotsToken) return;
                lunch.innerHTML = "";
                dinner.innerHTML = "";
                state.time = null;
                status.className = "slot-status warn";
                status.textContent = U.errorMessage(err);
                renderSummary();
            });
    }

    /* ---------- So khach ---------- */

    function setParty(n) {
        state.party = n;
        renderSummary();
        loadSlots();
    }

    function initParty() {
        var group = $("partyGroup");
        var bigBox = $("bigPartyBox");
        group.addEventListener("click", function (e) {
            var btn = e.target.closest("button");
            if (!btn) return;
            group.querySelectorAll("button").forEach(function (b) { b.classList.remove("on"); });
            btn.classList.add("on");
            setError("party_size", "");
            if (btn.dataset.size === "big") {
                bigBox.hidden = false;
                var n = parseInt($("bigParty").value, 10);
                setParty(isNaN(n) ? 8 : Math.min(Math.max(n, 8), 20));
            } else {
                bigBox.hidden = true;
                setParty(parseInt(btn.dataset.size, 10));
            }
        });
        $("bigParty").addEventListener("change", function () {
            var n = parseInt(this.value, 10);
            if (isNaN(n) || n < 8 || n > 20) {
                setError("party_size", "Số khách tối đa trực tuyến là 20. Vui lòng gọi hotline cho đoàn lớn hơn.");
                return;
            }
            setError("party_size", "");
            setParty(n);
        });
    }

    /* ---------- Uu tien cho ngoi ---------- */

    function initPref() {
        $("prefGrid").addEventListener("click", function (e) {
            var btn = e.target.closest(".pref");
            if (!btn) return;
            document.querySelectorAll(".pref").forEach(function (p) { p.classList.remove("on"); });
            btn.classList.add("on");
            state.pref = btn.dataset.pref;
            renderSummary();
        });
    }

    /* ---------- Ngay ---------- */

    function initDate() {
        var input = $("date");
        var today = new Date();
        var max = new Date();
        max.setDate(max.getDate() + 60);
        input.min = U.toDateInput(today);
        input.max = U.toDateInput(max);
        // Mac dinh: hom nay neu con khung gio, backend se tu danh dau khung da qua la het cho
        input.value = U.toDateInput(today);
        input.addEventListener("change", function () {
            setError("date", "");
            if (input.value && (input.value < input.min || input.value > input.max)) {
                setError("date", "Chỉ nhận đặt bàn từ hôm nay đến 60 ngày tới");
                return;
            }
            loadSlots();
            renderSummary();
        });
    }

    /* ---------- Kiem tra du lieu ---------- */

    function validate() {
        clearErrors();
        var ok = true;
        var first = null;
        function bad(name, msg) {
            setError(name, msg);
            ok = false;
            if (!first) first = $("f-" + name);
        }

        if (!$("branch_id").value) bad("branch_id", "Vui lòng chọn chi nhánh");
        if (!$("date").value) bad("date", "Vui lòng chọn ngày dùng bữa");
        if (state.party < 1 || state.party > 20) bad("party_size", "Số khách từ 1 đến 20");
        if (!state.time) bad("time", "Vui lòng chọn khung giờ đón tiếp");

        if ($("full_name").value.trim().length < 2) bad("full_name", "Vui lòng nhập họ và tên");
        if (!U.isPhone(U.cleanPhone($("phone").value))) bad("phone", "Số điện thoại không hợp lệ (VD: 0901 234 567)");

        var email = $("email").value.trim();
        if (!email) bad("email", "Vui lòng nhập email để nhận mã đặt bàn");
        else if (!U.isEmail(email)) bad("email", "Email không hợp lệ");

        if ($("note").value.length > 255) bad("note", "Ghi chú tối đa 255 ký tự");

        if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
        return ok;
    }

    // Dau tick xanh khi o hop le
    function initTicks() {
        function wire(id, test) {
            var input = $(id);
            var tick = input.parentNode.querySelector(".tick");
            function update() {
                if (tick) tick.hidden = !test(input.value);
                setError(id, "");
            }
            input.addEventListener("input", function () { update(); renderSummary(); });
        }
        wire("full_name", function (v) { return v.trim().length >= 2; });
        wire("phone", function (v) { return U.isPhone(U.cleanPhone(v)); });
        $("email").addEventListener("input", function () { setError("email", ""); });
    }

    /* ---------- Gui dat ban ---------- */

    function showFailure(message) {
        $("failMsg").textContent = message;
        $("failModal").hidden = false;
        $("failRetry").focus();
    }

    function submit(e) {
        e.preventDefault();
        if (!validate()) return;

        var btn = $("submitBtn");
        var original = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = "Đang giữ chỗ...";

        var body = {
            full_name: $("full_name").value.trim(),
            phone: U.cleanPhone($("phone").value),
            email: $("email").value.trim(),
            branch_id: parseInt($("branch_id").value, 10),
            reservation_time: $("date").value + "T" + state.time + ":00",
            party_size: state.party,
            preference: PREF_TO_API[state.pref],
            note: $("note").value.trim() || null
        };

        apiRequest("/reservations", "POST", body)
            .then(function (res) {
                try {
                    sessionStorage.setItem("lastReservation", JSON.stringify(res.data));
                } catch (e2) { /* trinh duyet chan storage: trang ket qua se bao khong co du lieu */ }
                location.href = "booking-success.html?code=" + encodeURIComponent(res.data.code);
            })
            .catch(function (err) {
                showFailure(U.errorMessage(err));
                // Co the do het cho: cap nhat lai khung gio
                loadSlots();
                btn.disabled = false;
                btn.innerHTML = original;
            });
    }

    /* ---------- Khoi dong ---------- */

    document.addEventListener("DOMContentLoaded", function () {
        initDate();
        initParty();
        initPref();
        initTicks();
        renderSummary();
        loadBranches();

        $("branch_id").addEventListener("change", function () {
            setError("branch_id", "");
            state.time = null;
            renderSummary();
            loadSlots();
        });
        $("bookingForm").addEventListener("submit", submit);
        $("failRetry").addEventListener("click", function () { $("failModal").hidden = true; });
        $("failModal").addEventListener("click", function (e) {
            if (e.target === this) this.hidden = true;
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") $("failModal").hidden = true;
        });
    });
})();