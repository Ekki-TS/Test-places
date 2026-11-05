const lookupForm=document.getElementById("lookup-form");
const lookupError=document.getElementById("lookup-error");
const detail=document.getElementById("lookup-detail");
let currentReservation=null;
let currentMode="code";
document.querySelectorAll(".lookup-tabs button").forEach((button)=>button.addEventListener("click",()=>{
  document.querySelectorAll(".lookup-tabs button").forEach((item)=>item.classList.toggle("active",item===button));
  currentMode=button.dataset.mode;
  document.getElementById("lookup-code").placeholder=currentMode==="code"?"Nhập mã đặt bàn":"Nhập mã đặt bàn để xác thực";
  document.getElementById("lookup-phone").placeholder=currentMode==="phone"?"Nhập số điện thoại đã đăng ký":"Số điện thoại khi đặt bàn";
  (currentMode==="code"?document.getElementById("lookup-code"):document.getElementById("lookup-phone")).focus();
}));
function lookupData(){return {code:document.getElementById("lookup-code").value.trim().toUpperCase(),phone:document.getElementById("lookup-phone").value.trim()};}
function renderDetail(item){
  currentReservation=item;
  const statusMap={pending:"Chờ xác nhận",confirmed:"Đã xác nhận",seated:"Đang phục vụ",cancelled:"Đã hủy",no_show:"Không đến"};
  document.getElementById("detail-code").textContent=item.code;
  document.getElementById("detail-status").textContent=statusMap[item.status]||item.status;
  document.getElementById("detail-name").textContent=item.guest_name;
  document.getElementById("detail-time").textContent=formatDateTime(item.reserved_at);
  document.getElementById("detail-party").textContent=item.party_size+" khách";
  document.getElementById("detail-branch").textContent="Chi nhánh #"+item.branch_id;
  document.getElementById("detail-note").textContent=item.note||"Không có";
  document.getElementById("cancel-reservation").hidden=!["pending","confirmed"].includes(item.status);
  detail.hidden=false;
}
lookupForm.addEventListener("submit",async(event)=>{
  event.preventDefault();lookupError.hidden=true;detail.hidden=true;
  try{const item=await api.post("/reservations/lookup",lookupData());renderDetail(item);}
  catch(error){lookupError.textContent=error.message;lookupError.hidden=false;}
});
document.getElementById("cancel-reservation").addEventListener("click",async()=>{
  if(!currentReservation||!confirm("Bạn chắc chắn muốn hủy đặt bàn này?"))return;
  try{const item=await api.post("/reservations/cancel",lookupData());renderDetail(item);showToast("Đã hủy đặt bàn");}
  catch(error){lookupError.textContent=error.message;lookupError.hidden=false;}
});
const saved=sessionStorage.getItem("latestReservation");
if(saved){try{const data=JSON.parse(saved);document.getElementById("lookup-code").value=data.code;document.getElementById("lookup-phone").value=data.phone;}catch{}}
