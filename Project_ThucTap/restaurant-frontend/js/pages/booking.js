const bookingForm = document.getElementById("booking-form");
const branchSelect = document.getElementById("branch-id");
const dateInput = document.getElementById("booking-date");
const timeInput = document.getElementById("booking-time");
const partyInput = document.getElementById("party-size");
const availabilityResult = document.getElementById("availability-result");
const bookingResult = document.getElementById("booking-result");
const lookupForm = document.getElementById("lookup-form");
const lookupResult = document.getElementById("lookup-result");
const cancelBookingButton = document.getElementById("btn-cancel-booking");

let branches = [];

function localDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function getBookingDateTime() {
  if (!dateInput.value || !timeInput.value) return null;
  return dateInput.value + "T" + timeInput.value + ":00";
}

function getSelectedBranch() {
  return branches.find((branch) => branch.id === Number(branchSelect.value));
}

async function loadBookingBranches() {
  try {
    branches = await api.get("/reservations/branches");
    branchSelect.innerHTML = '<option value="">-- Chọn chi nhánh --</option>' +
      branches.map((branch) =>
        '<option value="' + branch.id + '">' + escapeHtml(branch.name) + '</option>'
      ).join("");

    if (branches.length === 0) {
      branchSelect.innerHTML = '<option value="">Hiện chưa có chi nhánh hoạt động</option>';
    }
    updateBranchInfo();
  } catch (error) {
    branchSelect.innerHTML = '<option value="">Không tải được chi nhánh</option>';
    showToast(error.message, "error");
  }
}

function updateBranchInfo() {
  const branch = getSelectedBranch();
  const info = document.getElementById("branch-info");
  if (!branch) {
    info.textContent = "";
    return;
  }
  info.textContent = branch.address + " · Giờ mở cửa: " +
    String(branch.open_time).slice(0, 5) + " - " + String(branch.close_time).slice(0, 5);
}

async function checkAvailability() {
  const dateTime = getBookingDateTime();
  const branchId = Number(branchSelect.value);
  const partySize = Number(partyInput.value);

  if (!branchId || !dateTime || !partySize || partySize < 1 || partySize > 30) {
    availabilityResult.textContent = "Vui lòng chọn chi nhánh, ngày, giờ và số khách hợp lệ.";
    availabilityResult.className = "text-error";
    return false;
  }

  availabilityResult.textContent = "Đang kiểm tra...";
  availabilityResult.className = "muted";

  try {
    const result = await api.get("/reservations/availability", {
      branch_id: branchId,
      reserved_at: dateTime,
      party_size: partySize,
    });
    availabilityResult.textContent = result.message + " (" + result.available_tables + " bàn phù hợp)";
    availabilityResult.className = result.available ? "availability-ok" : "text-error";
    return result.available;
  } catch (error) {
    availabilityResult.textContent = error.message;
    availabilityResult.className = "text-error";
    return false;
  }
}

document.getElementById("btn-check").addEventListener("click", checkAvailability);
branchSelect.addEventListener("change", updateBranchInfo);

[dateInput, timeInput, partyInput, branchSelect].forEach((input) => {
  input.addEventListener("change", () => {
    availabilityResult.textContent = "";
    availabilityResult.className = "muted";
  });
});

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const reservedAt = getBookingDateTime();
  const data = {
    branch_id: Number(branchSelect.value),
    guest_name: document.getElementById("guest-name").value.trim(),
    guest_phone: document.getElementById("guest-phone").value.trim(),
    email: document.getElementById("guest-email").value.trim() || null,
    party_size: Number(partyInput.value),
    reserved_at: reservedAt,
    note: document.getElementById("booking-note").value.trim() || null,
  };

  const button = document.getElementById("btn-book");
  button.disabled = true;
  bookingResult.innerHTML = "";

  try {
    const reservation = await api.post("/reservations", data);
    bookingResult.innerHTML =
      '<div class="booking-success"><h3>Đã gửi yêu cầu đặt bàn!</h3>' +
      '<p>Mã đặt bàn của bạn:</p><strong class="booking-code">' +
      escapeHtml(reservation.code) + '</strong>' +
      '<p>Vui lòng lưu mã này và số điện thoại để tra cứu hoặc hủy đặt bàn.</p>' +
      '<p>Trạng thái: <strong>Chờ xác nhận</strong></p></div>';
    showToast("Đặt bàn thành công");
    bookingForm.reset();
    dateInput.min = localDateValue(new Date());
    partyInput.value = "2";
    updateBranchInfo();
    availabilityResult.textContent = "";
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    button.disabled = false;
  }
});

function getLookupData() {
  return {
    code: document.getElementById("lookup-code").value.trim().toUpperCase(),
    phone: document.getElementById("lookup-phone").value.trim(),
  };
}

function renderReservation(reservation) {
  const statuses = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    seated: "Đang phục vụ",
    cancelled: "Đã hủy",
    no_show: "Không đến",
  };

  lookupResult.innerHTML =
    '<div class="lookup-detail"><p><strong>Mã đặt bàn:</strong> ' + escapeHtml(reservation.code) + '</p>' +
    '<p><strong>Khách hàng:</strong> ' + escapeHtml(reservation.guest_name) + '</p>' +
    '<p><strong>Số khách:</strong> ' + reservation.party_size + '</p>' +
    '<p><strong>Thời gian:</strong> ' + formatDateTime(reservation.reserved_at) + '</p>' +
    '<p><strong>Trạng thái:</strong> ' + escapeHtml(statuses[reservation.status] || reservation.status) + '</p>' +
    '<p><strong>Ghi chú:</strong> ' + escapeHtml(reservation.note || "Không có") + '</p></div>';
}

lookupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  lookupResult.textContent = "Đang tra cứu...";
  try {
    const reservation = await api.post("/reservations/lookup", getLookupData());
    renderReservation(reservation);
  } catch (error) {
    lookupResult.textContent = error.message;
    showToast(error.message, "error");
  }
});

cancelBookingButton.addEventListener("click", async () => {
  if (!lookupForm.reportValidity()) return;
  if (!confirm("Bạn chắc chắn muốn hủy đặt bàn này?")) return;

  try {
    const reservation = await api.post("/reservations/cancel", getLookupData());
    renderReservation(reservation);
    showToast("Đã hủy đặt bàn");
  } catch (error) {
    showToast(error.message, "error");
  }
});

dateInput.min = localDateValue(new Date());
dateInput.value = localDateValue(new Date());
timeInput.value = "19:00";
loadBookingBranches();