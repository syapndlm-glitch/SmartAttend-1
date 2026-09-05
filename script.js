let sessionCode=localStorage.getItem("sessionCode")||"";
let attendance=JSON.parse(localStorage.getItem("attendance"))||[];
let timer=60, interval;
function randomCode(){return Math.random().toString(36).substring(2,8).toUpperCase();}
function startAttendance(){clearInterval(interval);generateNewCode();interval=setInterval(()=>{timer--;updateTimer();if(timer<=0)generateNewCode();},1000);}
function getStudentUrl(){
  // When hosted, use the real public origin automatically.
  // When SMARTATTEND_PUBLIC_URL is set, it can override the origin.
  const base = (typeof SMARTATTEND_PUBLIC_URL === "string" && SMARTATTEND_PUBLIC_URL.trim())
    ? SMARTATTEND_PUBLIC_URL.trim().replace(/\/$/, "") + "/"
    : window.location.href;
  const url = new URL("student.html", base);
  url.search = "";
  url.hash = "";
  const activeCode = localStorage.getItem("sessionCode") || "";
  if (activeCode) url.searchParams.set("session", activeCode);
  return url.href;
}
function generateQR(){const qr=document.getElementById("qrcode");if(!qr||typeof QRCode==="undefined")return;const target=getStudentUrl();qr.innerHTML="";new QRCode(qr,{text:target,width:190,height:190,correctLevel:QRCode.CorrectLevel.H});const link=document.getElementById("qrLink");if(link)link.innerText=target;}
function generateNewCode(){sessionCode=randomCode();localStorage.setItem("sessionCode",sessionCode);timer=60;const codeBox=document.getElementById("code");if(codeBox)codeBox.innerText=sessionCode;const status=document.getElementById("sessionStatus");if(status)status.innerText="ACTIVE";updateTimer();generateQR();}
function updateTimer(){const t=document.getElementById("timer");if(t)t.innerText=Math.floor(timer/60)+":"+String(timer%60).padStart(2,"0");}
async function copyCode(){const code=localStorage.getItem("sessionCode")||"";if(!code)return;try{await navigator.clipboard.writeText(code);const b=document.querySelector('.icon-btn');const old=b.innerText;b.innerText='Copied';setTimeout(()=>b.innerText=old,1200);}catch(e){}}
function markAttendance(){const roll=document.getElementById("roll").value.trim();const name=document.getElementById("name").value.trim();const entered=document.getElementById("session").value.trim().toUpperCase();const result=document.getElementById("result");const current=localStorage.getItem("sessionCode");if(!roll||!name||!entered){showResult("Complete all fields before confirming.","error");return;}if(entered!==current){showResult("That code is invalid or has expired.","error");return;}const exists=attendance.find(s=>s.roll===roll&&s.code===current);if(exists){showResult("Attendance is already recorded for this session.","error");return;}attendance.push({roll,name,code:current,time:new Date().toLocaleTimeString()});localStorage.setItem("attendance",JSON.stringify(attendance));showResult("Attendance confirmed successfully.","success");}
function showResult(text,type){const result=document.getElementById("result");if(result){result.innerText=text;result.className="result "+type;}}
function loadAttendance(){const table=document.getElementById("attendanceTable");const count=document.getElementById("count");if(!table)return;attendance=JSON.parse(localStorage.getItem("attendance"))||[];table.innerHTML="";attendance.forEach(s=>{table.innerHTML+=`<tr><td>${s.roll}</td><td>${s.name}</td><td>${s.time}</td><td><span class="status-badge">PRESENT</span></td></tr>`});if(count)count.innerText=attendance.length;const bar=document.getElementById('progressBar');if(bar)bar.style.width=Math.min(attendance.length*5,100)+'%';}
setInterval(loadAttendance,1000);loadAttendance();
if(document.getElementById("code")){document.getElementById("code").innerText=localStorage.getItem("sessionCode")||"------";updateTimer();generateQR();}
if(document.getElementById("session")){const qrSession=new URLSearchParams(window.location.search).get("session");if(qrSession){document.getElementById("session").value=qrSession.toUpperCase();document.body.classList.add("qr-entry");const roll=document.getElementById("roll");if(roll)roll.focus();}}
function clearAttendance() {
  localStorage.removeItem("attendanceData"); // Clears the saved entries
  location.reload(); // Refreshes the page to show an empty table
}
