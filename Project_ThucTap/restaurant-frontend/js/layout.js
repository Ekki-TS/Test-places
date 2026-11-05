const MENU = [
  { href: "index.html", label: "Trang chủ" },
  { href: "pages/customer/booking.html", label: "Đặt bàn" },
  { href: "pages/customer/lookup.html", label: "Tra cứu đặt bàn" },
  { href: "pages/admin/branches.html", label: "Chi nhánh" },
];

function renderLayout() {
  const root = document.body.dataset.root || "./";
  const currentPath = window.location.pathname;

  const links = MENU.map((item) => {
    const isActive = currentPath.endsWith("/" + item.href) ||
      (item.href === "index.html" && currentPath.endsWith("/"));
    return `<a href="${root}${item.href}" class="${isActive ? "active" : ""}">${item.label}</a>`;
  }).join("");

  document.getElementById("app-header").innerHTML = `
    <div class="container header-inner">
      <a href="${root}index.html" class="brand">
        <img src="${root}assets/images/logo.svg" alt="logo" width="28" height="28">
        <span>${CONFIG.APP_NAME}</span>
      </a>
      <nav class="nav">${links}</nav>
    </div>`;

  document.getElementById("app-footer").innerHTML = `
    <div class="container">© ${new Date().getFullYear()} Nhóm 6 · Hệ thống quản lý nhà hàng · HN-KS25-CNTT1</div>`;
}

renderLayout();
