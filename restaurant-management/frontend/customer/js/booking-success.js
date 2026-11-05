// Trang bao dat ban thanh cong. Du lieu lay tu sessionStorage do booking.js luu.
(function () {
    var U = window.CustomerUtil;
    var $ = U.$;

    function load() {
        var raw = null;
        try { raw = sessionStorage.getItem("lastReservation"); } catch (e) { /* bo qua */ }
        if (!raw) return null;
        try {
            var r = JSON.parse(raw);
            // Chi tin du lieu neu trung ma tren URL (neu co)
            var urlCode = U.normalizeCode(new URLSearchParams(location.search).get("code"));
            if (urlCode && urlCode !== r.code) return null;
            return r;
        } catch (e2) {
            return null;
        }
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            var ok = false;
            try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
            ta.remove();
            ok ? resolve() : reject();
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var r = load();
        if (!r) {
            $("emptyView").hidden = false;
            return;
        }

        var when = U.parseLocal(r.reservation_time);
        $("code").textContent = U.formatCode(r.code);
        $("rTime").textContent = U.formatTime(when) + " - " + U.weekdays[when.getDay()] + ", " + U.formatDate(when);
        $("rParty").textContent = (r.party_size < 10 ? "0" : "") + r.party_size + " Khách";
        $("rBranch").textContent = r.branch_name;
        $("rPref").textContent = U.prefLabel(r.preference);
        $("rName").textContent = r.full_name;
        $("rStatus").textContent = U.statusLabel(r.status);
        $("lookupLink").href = "lookup.html?code=" + encodeURIComponent(r.code);
        $("okView").hidden = false;

        $("copyBtn").addEventListener("click", function () {
            copyText(r.code).then(
                function () { window.showToast("Đã sao chép mã " + U.formatCode(r.code)); },
                function () { window.showToast("Không sao chép được, vui lòng chép thủ công"); }
            );
        });
    });
})();