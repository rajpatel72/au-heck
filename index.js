// Create the main container
document.body.style.fontFamily = "Arial, sans-serif";
document.body.style.background = "#f4f4f4";
document.body.style.display = "flex";
document.body.style.height = "100vh";
document.body.style.justifyContent = "center";
document.body.style.alignItems = "center";
document.body.style.margin = "0";

// App container
const container = document.createElement("div");
container.style.textAlign = "center";
container.style.background = "white";
container.style.padding = "40px";
container.style.borderRadius = "10px";
container.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
container.style.minWidth = "300px";

document.body.appendChild(container);

// Title
const title = document.createElement("h1");
title.innerText = "Welcome to My App";
title.style.marginBottom = "20px";
container.appendChild(title);

// Create buttons
const buttons = [
  { id: "signup", text: "Signup Docs" },
  { id: "quote", text: "Quote" },
  { id: "roll", text: "Roll-in/Roll-out" },
];

buttons.forEach(({ id, text }) => {
  const btn = document.createElement("button");
  btn.id = id;
  btn.innerText = text;
  btn.style.display = "block";
  btn.style.width = "200px";
  btn.style.margin = "10px auto";
  btn.style.padding = "12px";
  btn.style.border = "none";
  btn.style.borderRadius = "8px";
  btn.style.color = "white";
  btn.style.fontSize = "16px";
  btn.style.cursor = "pointer";
  btn.style.transition = "0.3s";

  if (id === "signup") btn.style.background = "#007bff";
  if (id === "quote") btn.style.background = "#28a745";
  if (id === "roll") btn.style.background = "#6f42c1";

  btn.addEventListener("mouseover", () => {
    btn.style.opacity = "0.85";
  });
  btn.addEventListener("mouseout", () => {
    btn.style.opacity = "1";
  });

  container.appendChild(btn);
});

// Function to show signup page content
function showSignupPage() {
  container.innerHTML = ""; // Clear previous content

  const title = document.createElement("h2");
  title.innerText = "Signup Documents";
  container.appendChild(title);

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter your name";
  input.style.width = "80%";
  input.style.padding = "10px";
  input.style.margin = "10px 0 20px";
  input.style.border = "1px solid #ccc";
  input.style.borderRadius = "6px";
  container.appendChild(input);

  const checklist = [
    "Check Name",
    "Check ABN",
    "Check Phone",
    "Check DOB",
    "Check NMI",
    "Check Supply Address",
  ];

  checklist.forEach((labelText) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    label.appendChild(checkbox);
    label.append(` ${labelText}`);
    label.style.display = "block";
    label.style.textAlign = "left";
    label.style.marginLeft = "30px";
    container.appendChild(label);
  });

  const backBtn = document.createElement("button");
  backBtn.innerText = "Back";
  backBtn.style.marginTop = "20px";
  backBtn.style.background = "#555";
  backBtn.style.color = "white";
  backBtn.style.padding = "10px 20px";
  backBtn.style.border = "none";
  backBtn.style.borderRadius = "6px";
  backBtn.style.cursor = "pointer";
  backBtn.addEventListener("click", renderHomePage);
  container.appendChild(backBtn);
}

// Function to render main page again
function renderHomePage() {
  container.innerHTML = "";
  const title = document.createElement("h1");
  title.innerText = "Welcome to My App";
  container.appendChild(title);

  buttons.forEach(({ id, text }) => {
    const btn = document.createElement("button");
    btn.id = id;
    btn.innerText = text;
    btn.style.display = "block";
    btn.style.width = "200px";
    btn.style.margin = "10px auto";
    btn.style.padding = "12px";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.color = "white";
    btn.style.fontSize = "16px";
    btn.style.cursor = "pointer";

    if (id === "signup") btn.style.background = "#007bff";
    if (id === "quote") btn.style.background = "#28a745";
    if (id === "roll") btn.style.background = "#6f42c1";

    if (id === "signup") btn.addEventListener("click", showSignupPage);
    else
      btn.addEventListener("click", () => alert(`${text} button clicked!`));

    container.appendChild(btn);
  });
}

// Attach functionality
document.getElementById("signup").addEventListener("click", showSignupPage);
document.getElementById("quote").addEventListener("click", () =>
  alert("Quote button clicked!")
);
document.getElementById("roll").addEventListener("click", () =>
  alert("Roll-in/Roll-out button clicked!")
);
