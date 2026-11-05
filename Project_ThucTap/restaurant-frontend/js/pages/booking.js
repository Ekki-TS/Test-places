const bookingFormView = document.getElementById("booking-view");
const successView = document.getElementById("booking-success-view");
const failureView = document.getElementById("booking-failure-view");
const branchSelect = document.getElementById("branch-id");
const dateInput = document.getElementById("booking-date");
const partyInput = document.getElementById("party-size");
const availabilityResult = document.getElementById("availability-result");
const bookingError = document.getElementById("booking-error");
let branches = [];
let selectedTime = "19:00";
let latestReservationCode = "";

function dateValue(date) {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}
function selectedBranch() {
  return branches.find((branch) => branch.id === Number(branchSelect.value));
}
function reservedAt() {
  return dateInput.value && selectedTime ? dateInput.value + "T" + selectedTime + ":00" : "";
}
function selectedArea() {
  return document.querySelector('input[name="area"]:checked').value;
}
function showBookingError(message) {
  bookingError.textContent = message;
  bookingError.hidden = false;
}
function updateSummary() {
  const branch = selectedBranch();
  document.getElementById("summary-branch").textContent = branch ? branch.name : "Chưa chọn";
  document.getElementById("summary-time").textContent = dateInput.value ? dateInput.value.split("-").reverse().join("/") + " · " + selectedTime : "Chưa chọn";
  document.getElementById("summary-party").textContent = partyInput.value + " Khách";
  document.getElementById("summary-area").textContent = selectedArea();
  document.getElementById("summary-name").textContent = document.getElementById("guest-name").value.trim() || "Chưa nhập";
  document.getElementById("branch-info").textContent = branch ? branch.address + " · " + String(branch.open_time).slice(0,5) + " – " + String(branch.close_time).slice(0,5) : "";
}
async function loadBranches() {
  try {
    branches = await api.get("/reservations/branches");
    branchSelect.innerHTML = '<option value="">Chọn chi nhánh</option>' + branches.map((branch) => '<option value="' + branch.id + '">' + escapeHtml(branch.name) + " - " + escapeHtml(branch.address) + "</option>").join("");
    if (!branches.length) branchSelect.innerHTML = '<option value="">Chưa có chi nhánh hoạt động</option>';
    updateSummary();
  } catch (error) {
    showBookingError(error.message);
  }
}
async function checkAvailability() {
  if (!branchSelect.value || !reservedAt()) {
    availabilityResult.textContent = "Vui lòng chọn chi nhánh, ngày và giờ.";
    return false;
  }
  availabilityResult.textContent = "Đang kiểm tra tình trạng bàn...";
  try {
    const result = await api.get("/reservations/availability", {branch_id:Number(branchSelect.value), reserved_at:reservedAt(), party_size:Number(partyInput.value)});
    availabilityResult.textContent = result.message + " · " + result.available_tables + " bàn phù hợp";
    availabilityResult.className = result.available ? "availability-ok" : "availability-no";
    return result.available;
  } catch (error) {
    availabilityResult.textContent = error.message;
    availabilityResult.className = "availability-no";
    return false;
  }
}
document.querySelectorAll("#time-options button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("#time-options button").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    selectedTime = button.dataset.time;
    availabilityResult.textContent = "Nhấn kiểm tra để xem bàn còn trống.";
    updateSummary();
  });
});
document.querySelectorAll('input[name="area"]').forEach((input) => input.addEventListener("change", () => {
  document.querySelectorAll(".area-option").forEach((item) => item.classList.toggle("selected", item.querySelector("input").checked));
  updateSummary();
}));
[branchSelect,dateInput,partyInput].forEach((input) => input.addEventListener("change", () => {
  availabilityResult.textContent = "Nhấn kiểm tra để xem bàn còn trống.";
  updateSummary();
}));
document.getElementById("guest-name").addEventListener("input", updateSummary);
document.getElementById("btn-check").addEventListener("click", checkAvailability);
document.getElementById("btn-book").addEventListener("click", async () => {
  bookingError.hidden = true;
  const branch = selectedBranch();
  const name = document.getElementById("guest-name").value.trim();
  const phone = document.getElementById("guest-phone").value.trim();
  const email = document.getElementById("guest-email").value.trim();
  if (!branch || !dateInput.value || !selectedTime || !name || !phone) {
    showBookingError("Vui lòng điền đầy đủ chi nhánh, thời gian, họ tên và số điện thoại.");
    return;
  }
  if (name.length < 2 || !/^[0-9+ -]{9,20}$/.test(phone)) {
    showBookingError("Họ tên hoặc số điện thoại chưa hợp lệ.");
    return;
  }
  if (new Date(reservedAt()) <= new Date()) {
    showBookingError("Thời gian đặt bàn phải ở tương lai.");
    return;
  }
  const button = document.getElementById("btn-book");
  button.disabled = true;
  button.textContent = "Đang gửi yêu cầu...";
  const guestNote = document.getElementById("booking-note").value.trim();
  const areaNote = "Khu vực ưu tiên: " + selectedArea();
  const data = {branch_id:Number(branchSelect.value),guest_name:name,guest_phone:phone,email:email || null,party_size:Number(partyInput.value),reserved_at:reservedAt(),note:(areaNote + (guestNote ? " | Ghi chú: " + guestNote : "")).slice(0,255)};
  try {
    const reservation = await api.post("/reservations", data);
    latestReservationCode = reservation.code;
    document.getElementById("success-code").textContent = reservation.code;
    document.getElementById("success-time").textContent = formatDateTime(reservation.reserved_at);
    document.getElementById("success-party").textContent = reservation.party_size + " khách";
    document.getElementById("success-branch").textContent = branch.name;
    document.getElementById("success-area").textContent = selectedArea();
    document.getElementById("success-status").textContent = "Trạng thái: " + (reservation.status === "pending" ? "Chờ xác nhận từ nhà hàng" : reservation.status);
    sessionStorage.setItem("latestReservation", JSON.stringify({code:reservation.code,phone:phone}));
    bookingFormView.hidden = true;
    successView.hidden = false;
    window.scrollTo({top:0,behavior:"smooth"});
  } catch (error) {
    document.getElementById("failure-message").textContent = error.message || "Không thể gửi yêu cầu. Vui lòng thử lại.";
    bookingFormView.hidden = true;
    failureView.hidden = false;
    window.scrollTo({top:0,behavior:"smooth"});
  } finally {
    button.disabled = false;
    button.textContent = "♧  Xác Nhận Đặt Bàn Ngay";
  }
});
document.getElementById("copy-code").addEventListener("click", async () => {
  if (!latestReservationCode) return;
  try {
    await navigator.clipboard.writeText(latestReservationCode);
    showToast("Đã sao chép mã đặt bàn");
  } catch {
    showToast("Không thể sao chép tự động. Mã đặt bàn: " + latestReservationCode, "error");
  }
});
document.getElementById("retry-booking").addEventListener("click", () => {
  failureView.hidden = true;
  bookingFormView.hidden = false;
});
dateInput.min = dateValue(new Date());
dateInput.value = dateValue(new Date());
loadBranches();