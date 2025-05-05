function generateInputs() {
    let numAlternativesInput = document.getElementById("numAlternatives");
    let numCriteriaInput = document.getElementById("numCriteria");
    let numAlternativesValue = numAlternativesInput.value; // Lấy giá trị chuỗi
    let numCriteriaValue = numCriteriaInput.value;     // Lấy giá trị chuỗi
    let numAlternatives = parseInt(numAlternativesValue);
    let numCriteria = parseInt(numCriteriaValue);
    let container = document.getElementById("namesContainer");
    let alternativeError = document.getElementById("alternativeError");
    let criteriaError = document.getElementById("criteriaError");
    container.innerHTML = "";
    alternativeError.textContent = "";
    criteriaError.textContent = "";

    function isValidNaturalNumber(value) {
        // Kiểm tra xem có phải là một số, không phải NaN, là số nguyên và lớn hơn hoặc bằng 2
        return !isNaN(value) && Number(value) === parseInt(value) && Number(value) >= 2;
    }

    let hasError = false;

    if (!isValidNaturalNumber(numAlternativesValue)) { // Kiểm tra giá trị chuỗi
        alternativeError.textContent = "Số phương án phải là một số nguyên lớn hơn hoặc bằng 2.";
        hasError = true;
    }

    if (!isValidNaturalNumber(numCriteriaValue)) {     // Kiểm tra giá trị chuỗi
        criteriaError.textContent = "Số tiêu chí phải là một số nguyên lớn hơn hoặc bằng 2.";
        hasError = true;
    }

    if (hasError) {
        return;
    }

    container.innerHTML += "<h3>Nhập tên phương án và tiêu chí:</h3>";

    container.innerHTML += "<h4>Phương án:</h4>";
    for (let i = 0; i < numAlternatives; i++) {
        let input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Phương án " + (i + 1);
        input.id = "alternative_" + i;
        container.appendChild(input);
    }

    container.innerHTML += "<h4>Tiêu chí:</h4>";
    for (let i = 0; i < numCriteria; i++) {
        let input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Tiêu chí " + (i + 1);
        input.id = "criteria_" + i;
        container.appendChild(input);
    }

    document.getElementById("createMatrixBtn").style.display = "block";
}
function validateAlternatives() {
    let numAlternativesInput = document.getElementById("numAlternatives");
    let numAlternatives = parseInt(numAlternativesInput.value);
    let alternativeError = document.getElementById("alternativeError");

    if (!Number.isInteger(numAlternatives) || numAlternatives < 2) {
        alternativeError.textContent = "Số phương án phải là một số tự nhiên lớn hơn hoặc bằng 2.";
    } else {
        alternativeError.textContent = "";
    }
}

function validateCriteria() {
    let numCriteriaInput = document.getElementById("numCriteria");
    let numCriteria = parseInt(numCriteriaInput.value);
    let criteriaError = document.getElementById("criteriaError");

    if (!Number.isInteger(numCriteria) || numCriteria < 2) {
        criteriaError.textContent = "Số tiêu chí phải là một số tự nhiên lớn hơn hoặc bằng 2.";
    } else {
        criteriaError.textContent = "";
    }
}



function generateEvaluationMatrix() {
  let numCriteria = document.getElementById("numCriteria").value;
  let criteriaContainer = document.getElementById("criteriaMatrixContainer");
  criteriaContainer.innerHTML = "<h3>Ma trận so sánh tiêu chí</h3>";

  let table = document.createElement("table");
  table.classList.add("matrix-table");
  let headerRow = document.createElement("tr");
  headerRow.appendChild(document.createElement("th")); // Ô trống góc trên

  for (let i = 0; i < numCriteria; i++) {
      let th = document.createElement("th");
      th.innerText = document.getElementById(`criteria_${i}`).value || `Tiêu chí ${i + 1}`;
      headerRow.appendChild(th);
  }
  table.appendChild(headerRow);

  for (let i = 0; i < numCriteria; i++) {
      let row = document.createElement("tr");
      let th = document.createElement("th");
      th.innerText = document.getElementById(`criteria_${i}`).value || `Tiêu chí ${i + 1}`;
      row.appendChild(th);

      for (let j = 0; j < numCriteria; j++) {
          let cell = document.createElement("td");
          let input = document.createElement("input");
          input.type = "number";
          setupAHPInput(input); //gọi hàm để chuẩn hóa lại input
          input.id = `criteria_${i}_${j}`;  // Gán ID để lấy giá trị sau này
          if (i === j) {
              input.value = 1;
              input.disabled = true;       // khóa ô đường chéo
            } else {
              input.value = 1;
              input.disabled = false;
            }
             
          input.min = "0.1";
          input.max = "9"; 
          input.step = "0.1";
          input.addEventListener('input', () => {
            const v = parseFloat(input.value);
            if (v > 9) {
                alert('AHP chỉ cho phép giá trị từ 1/9 đến 9');
                input.value = 9;
            } else if (v < 0.1) {
                alert('AHP chỉ cho phép giá trị từ 1/9 đến 9');
                input.value = 1;
            }
            });
        
            
          input.dataset.row = i;
          input.dataset.col = j;
          input.onblur = function() { updateSymmetricValue(this); };
          cell.appendChild(input);
          row.appendChild(cell);
      }
      table.appendChild(row);
  }
  criteriaContainer.appendChild(table);

  document.getElementById("calcBtn").style.display = "block";  // Hiển thị nút tính toán
  generateAlternativeMatrices();
  document.getElementById("crCheckBtnContainer").style.display = "block"; // Hiện nút kiểm tra CR
  document.getElementById("altCRCheckBtnContainer").style.display = "none"; // ẩn trước, chỉ hiện khi CR tiêu chí ok
  document.getElementById("calcBtn").style.display= "none";



}
function generateAlternativeMatrices() {
  let numCriteria = document.getElementById("numCriteria").value;
  let numAlternatives = document.getElementById("numAlternatives").value;
  let alternativeContainer = document.getElementById("alternativeMatricesContainer");
  alternativeContainer.innerHTML = "<h3>Ma trận so sánh các phương án</h3>";

  for (let i = 0; i < numCriteria; i++) {
      let table = document.createElement("table");
      table.classList.add("matrix-table");
      let criteriaName = document.getElementById(`criteria_${i}`).value || `Tiêu chí ${i + 1}`;
      table.innerHTML = `<caption>${criteriaName}</caption>`;

      let headerRow = document.createElement("tr");
      headerRow.appendChild(document.createElement("th"));

      for (let j = 0; j < numAlternatives; j++) {
          let th = document.createElement("th");
          th.innerText = document.getElementById(`alternative_${j}`).value || `Phương án ${j + 1}`;
          headerRow.appendChild(th);
      }
      table.appendChild(headerRow);

      for (let j = 0; j < numAlternatives; j++) {
          let row = document.createElement("tr");
          let th = document.createElement("th");
          th.innerText = document.getElementById(`alternative_${j}`).value || `Phương án ${j + 1}`;
          row.appendChild(th);

          for (let k = 0; k < numAlternatives; k++) {
              let cell = document.createElement("td");
              let input = document.createElement("input");
              input.type = "number";
                setupAHPInput(input);// gọi hàm chuẩn hóa input
              input.id = `alt_${i}_${j}_${k}`;  // Gán ID để lấy giá trị
              if (j === k) {
                  input.value = 1;
                  input.disabled = true;       // khóa ô đường chéo
                } else {
                  input.value = 1;
                  input.disabled = false;
                }
              input.min = "0.1";
              input.max = "9"; 
              input.step = "0.1";
              // Thêm listener chặn >9
              input.addEventListener('input', () => {
                const v = parseFloat(input.value);
                if (v > 9) {
                    alert('AHP chỉ cho phép giá trị từ 1/9 đến 9');
                    input.value = 9;
                } else if (v < 0.1) {
                    alert('AHP chỉ cho phép giá trị từ 1/9 đến 9');
                    input.value = 1;
                }
                });
            
              input.dataset.row = j;
              input.dataset.col = k;
              input.dataset.criteria = i;
              input.onblur = function() { updateSymmetricValue(this); };
              cell.appendChild(input);
              row.appendChild(cell);
          }
          table.appendChild(row);
      }
      alternativeContainer.appendChild(table);
  }

  document.getElementById("calcBtn").style.display = "block";  // Hiển thị nút tính toán
}


function updateSymmetricValue(input) {
    let row = input.dataset.row;
    let col = input.dataset.col;
    let value = parseFloat(input.value);
    let criteriaIndex = input.dataset.criteria;

    console.log(`Input tại hàng: ${row}, cột: ${col}, giá trị: ${value}, criteriaIndex: ${criteriaIndex}`);

    if (!isNaN(value) && value > 0) {
        let selector;
        if (criteriaIndex === undefined) {
            // Trường hợp ma trận so sánh tiêu chí (không có data-criteria)
            selector = `input[data-row='${col}'][data-col='${row}']`;
        } else {
            // Trường hợp ma trận so sánh các phương án (có data-criteria)
            selector = `input[data-criteria='${criteriaIndex}'][data-row='${col}'][data-col='${row}']`;
        }
        let symmetricInput = document.querySelector(selector);
        console.log(`Selector: ${selector}`);
        console.log("Tìm thấy phần tử đối xứng:", symmetricInput);
        if (symmetricInput) {
            symmetricInput.value = (1 / value).toFixed(2);
        }
    }
}


function generateMatrixTable(matrix, rowLabels, colLabels) {
    let html = `<table><tr><th></th>`;
    colLabels.forEach(label => html += `<th>${label}</th>`);
    html += `</tr>`;
    matrix.forEach((row, i) => {
        html += `<tr><th>${rowLabels[i]}</th>`;
        row.forEach(cell => {
            html += `<td>${parseFloat(cell).toFixed(4)}</td>`;
        });
        html += `</tr>`;
    });
    html += `</table>`;
    return html;
}


function calculateAHP() {
    let numAlternatives = parseInt(document.getElementById("numAlternatives").value);
    let numCriteria = parseInt(document.getElementById("numCriteria").value);
    
    // Lấy tên các phương án
    let alternativeNames = [];
    for (let i = 0; i < numAlternatives; i++) {
        let altName = document.getElementById(`alternative_${i}`).value.trim();
        if (!altName) {
            alert("Thiếu dữ liệu: alternative_names");
            return;
        }
        alternativeNames.push(altName);
    }
    
    // Lấy tên các tiêu chí
    let criteriaNames = [];
    for (let i = 0; i < numCriteria; i++) {
        let criteriaName = document.getElementById(`criteria_${i}`).value.trim();
        if (!criteriaName) {
            alert("Thiếu dữ liệu: criteria_names");
            return;
        }
        criteriaNames.push(criteriaName);
    }
    
    // Xây dựng ma trận tiêu chí
    let criteriaMatrix = [];
    for (let i = 0; i < numCriteria; i++) {
        let row = [];
        for (let j = 0; j < numCriteria; j++) {
            let inputElement = document.getElementById(`criteria_${i}_${j}`);
            let value = parseFloat(inputElement.value);
            if (isNaN(value) || value <= 0) {
                alert(`Giá trị ma trận tiêu chí không hợp lệ tại vị trí [${i}, ${j}]!`);
                return;
            }
            row.push(value);
        }
        criteriaMatrix.push(row);
    }
    
    // Xây dựng ma trận các phương án theo từng tiêu chí
    let alternativeMatrices = {};
    for (let i = 0; i < numCriteria; i++) {
        let matrix = [];
        for (let j = 0; j < numAlternatives; j++) {
            let row = [];
            for (let k = 0; k < numAlternatives; k++) {
                let inputElement = document.getElementById(`alt_${i}_${j}_${k}`);
                let value = parseFloat(inputElement.value);
                if (isNaN(value) || value <= 0) {
                    alert(`Giá trị ma trận phương án không hợp lệ tại tiêu chí ${i + 1}, vị trí [${j}, ${k}]!`);
                    return;
                }
                row.push(value);
            }
            matrix.push(row);
        }
        // Đặt tên cho ma trận theo tiêu chí
        alternativeMatrices[criteriaNames[i]] = matrix;
    }
    
    // Gửi dữ liệu qua AJAX, bao gồm cả criteria_names
    $.ajax({
        url: "/ahp",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            criteria_matrix: criteriaMatrix,
            alternative_matrices: alternativeMatrices,
            alternative_names: alternativeNames,
            criteria_names: criteriaNames
        }),
        success: function(response) {
            let resultHTML = `<div class="result-block"><h3>Kết quả chi tiết:</h3>`
            window.lastResult = response;
            // Hiển thị nút export Excel
            document.getElementById('exportExcelBtn').style.display = 'inline-block';
            document.getElementById('btnPDF').style.display       = 'inline-block';
            
            // Ma trận tiêu chí chuẩn hóa
            if (response.normalized_criteria_matrix && response.criteria_names) {
              resultHTML += `
                <h4>Ma trận tiêu chí chuẩn hóa</h4>
                ${generateMatrixTable(response.normalized_criteria_matrix, response.criteria_names, response.criteria_names)}
              `
            }
          
            // Trọng số tiêu chí
            if (response.criteria_weights) {
              resultHTML += `<h4>Trọng số tiêu chí</h4><table><tr><th>Tiêu chí</th><th>Trọng số</th></tr>`
              response.criteria_names.forEach((name, i) => {
                resultHTML += `<tr><td>${name}</td><td>${response.criteria_weights[i].toFixed(4)}</td></tr>`
              })
              resultHTML += `</table>`
            }
          
            // Trọng số phương án
            if (response.alternative_weights) {
              resultHTML += `<h3>Trọng số phương án theo từng tiêu chí:</h3>`
              Object.entries(response.alternative_weights).forEach(([criterion, weights]) => {
                resultHTML += `<h4>Tiêu chí "${criterion}"</h4><table><tr><th>Phương án</th><th>Trọng số</th></tr>`
                response.alternative_names.forEach((alt, i) => {
                  resultHTML += `<tr><td>${alt}</td><td>${weights[i].toFixed(4)}</td></tr>`
                })
                resultHTML += `</table>`
              })
            }
          
            // Kết quả tổng hợp
            resultHTML += `<h3>Kết quả cuối cùng:</h3>`

            const best = response.final_scores[0];
            resultHTML += `
            <h3 style="color: green;">✅ Phương án tối ưu nhất: <strong>${best.alternative}</strong> với điểm số: <strong>${best.score.toFixed(4)}</strong></h3>
            <table>
                <tr><th>Xếp hạng</th><th>Phương án</th><th>Điểm</th></tr>
            `;

            response.final_scores.forEach((item, index) => {
            resultHTML += `
                <tr ${index === 0 ? 'style="background-color:#e8f5e9;font-weight:bold;"' : ''}>
                <td>${index + 1}</td>
                <td>${item.alternative}</td>
                <td>${item.score.toFixed(4)}</td>
                </tr>
            `;
            });
            resultHTML += `</table>`;

          
            // === Các biểu đồ hình ảnh (themed + wrapped) ===
            let chartSection = ''
            if (
              response.final_scores_image ||
              response.criteria_weights_image ||
              response.criteria_weights_pie_image
            ) {
              chartSection += `<div class="chart-container">`
          
              if (response.final_scores_image) {
                chartSection += `
                  <h3>Biểu đồ so sánh điểm tổng hợp:</h3>
                  <img src="${response.final_scores_image}" alt="Biểu đồ điểm tổng hợp" class="chart-img" loading="lazy">
                `
              }
          
              if (response.criteria_weights_image) {
                chartSection += `
                  <h3>Biểu đồ trọng số của các tiêu chí:</h3>
                  <img src="${response.criteria_weights_image}" alt="Biểu đồ trọng số tiêu chí" class="chart-img" loading="lazy">
                `
              }
          
              if (response.criteria_weights_pie_image) {
                chartSection += `
                  <h3>Biểu đồ tròn tỷ lệ trọng số của các tiêu chí:</h3>
                  <img src="${response.criteria_weights_pie_image}" alt="Biểu đồ tròn trọng số tiêu chí" class="chart-img" loading="lazy">
                `
              }
          
              chartSection += `</div>`
            }
          
            resultHTML += chartSection
            resultHTML += `</div>`
          
            document.getElementById('result').innerHTML = resultHTML
          },
          
        
        error: function(err) {
            document.getElementById("result").innerHTML = `<p style="color:red;">Lỗi: ${err.responseJSON.error}</p>`;
        }
    });
}




    // Hiển thị popup khi vào trang
window.onload = function() {
    document.getElementById('popup').style.display = 'block';
}

// Hàm đóng popup
function closePopup() {
    document.getElementById('popup').style.display = 'none';
}


//Check CR tiêu chí
function checkCriteriaCR() {
let numCriteria = parseInt(document.getElementById("numCriteria").value);
let criteriaMatrix = [];

for (let i = 0; i < numCriteria; i++) {
let row = [];
for (let j = 0; j < numCriteria; j++) {
  let value = parseFloat(document.getElementById(`criteria_${i}_${j}`).value);
  if (isNaN(value) || value <= 0) {
      alert(`Lỗi dữ liệu tại ô [${i + 1}, ${j + 1}]`);
      return;
  }
  row.push(value);
}
criteriaMatrix.push(row);
}

$.ajax({
url: "/check_criteria_cr",
method: "POST",
contentType: "application/json",
data: JSON.stringify({ criteria_matrix: criteriaMatrix }),
success: function(res) {
  let html = `<h4>Chỉ số nhất quán:</h4>
      <p>Lambda Max: <strong>${res.lambda_max.toFixed(4)}</strong></p>
      <p>CI (Chỉ số nhất quán): <strong>${res.CI.toFixed(4)}</strong></p>
      <p>CR (Tỷ số nhất quán): <strong>${res.CR.toFixed(4)}</strong></p>`;

  if (res.valid) {
      html += `<p style="color:green;"><strong>CR hợp lý. Bạn có thể tiếp tục nhập ma trận phương án.</strong></p>`;
      generateAlternativeMatrices(); // Cho phép tiếp tục nhập phương án
  } else {
      html += `<p style="color:red;"><strong>CR quá cao (> 0.1). Vui lòng điều chỉnh ma trận tiêu chí!</strong></p>`;
  }

  if (res.valid) {
      // hiện nút kiểm tra CR phương án
      document.getElementById("altCRCheckBtnContainer").style.display = "block";
      // (nếu muốn cũng có thể ẩn nút calcBtn trước khi CR phương án)
      document.getElementById("calcBtn").style.display = "none";
    } else {
      document.getElementById("altCRCheckBtnContainer").style.display = "none";
      document.getElementById("calcBtn").style.display = "none";
    }

  document.getElementById("crCheckResult").innerHTML = html;
},
error: function(err) {
  document.getElementById("crCheckResult").innerHTML = `<p style="color:red;">Lỗi: ${err.responseJSON.error}</p>`;
}
});



}


//Check CR phương án
function checkAlternativeCR() {
const numCriteria     = parseInt(document.getElementById("numCriteria").value);
const numAlternatives = parseInt(document.getElementById("numAlternatives").value);
const criteriaNames   = Array.from({length: numCriteria}, (_, i) =>
document.getElementById(`criteria_${i}`).value.trim() || `Tiêu chí ${i+1}`
);

let resultsHtml = `<h4>Chỉ số nhất quán – Ma trận phương án</h4>`;
let allValid    = true;
const ajaxCalls  = [];

for (let i = 0; i < numCriteria; i++) {
// 1. Xây dựng ma trận phương án thứ i
const matrix = [];
for (let r = 0; r < numAlternatives; r++) {
const row = [];
for (let c = 0; c < numAlternatives; c++) {
const val = parseFloat(document.getElementById(`alt_${i}_${r}_${c}`).value);
row.push(isNaN(val) ? 0 : val);
}
matrix.push(row);
}

// 2. Gửi AJAX tới /check_criteria_cr để lấy lambda_max, CI, CR
ajaxCalls.push(
$.ajax({
url: "/check_criteria_cr",
method: "POST",
contentType: "application/json",
data: JSON.stringify({ criteria_matrix: matrix })
})
.then(res => {
const valid = res.valid;
allValid = allValid && valid;
resultsHtml += `
  <div class="alt-cr-block">
    <h5>Ma trận "${criteriaNames[i]}"</h5>
    <p>λₘₐₓ = ${res.lambda_max.toFixed(4)}</p>
    <p>CI      = ${res.CI.toFixed(4)}</p>
    <p>CR      = ${res.CR.toFixed(4)} 
       ${valid 
          ? `<span style="color:green;">(Hợp lệ)</span>` 
          : `<span style="color:red;">(Quá cao!)</span>`}
    </p>
  </div>`;
})
.catch(err => {
allValid = false;
resultsHtml += `
  <div class="alt-cr-block">
    <h5>Ma trận "${criteriaNames[i]}"</h5>
    <p style="color:red;">Lỗi khi kiểm tra nhất quán</p>
  </div>`;
})
);
}

// 3. Khi tất cả AJAX hoàn thành, render kết quả và bật/tắt nút Tính toán
Promise.all(ajaxCalls).then(() => {
const container = document.getElementById("altCrCheckResult");
container.innerHTML = resultsHtml;
// Nếu tất cả đều hợp lệ, hiển thị nút Tính toán AHP
document.getElementById("calcBtn").style.display = allValid ? "block" : "none";
});
}

//Hàm chuẩn hóa lại input
function setupAHPInput(input) {
    input.setAttribute("title", "Thang đo AHP:\n1 = Bằng nhau\n2 = Thỏa hiệp giữa 1 và 3\n3 = Ưu tiên nhẹ\n4 = Thỏa hiệp giữa 3 và 5\n5 = Ưu tiên mạnh\n6 = Thỏa hiệp giữa 5 và 7\n7 = Rất mạnh\n8 = Thỏa hiệp giữa 7 và 9\n9 = Cực kỳ ưu tiên");


    input.addEventListener('blur', () => {
        const v = parseFloat(input.value);
        const epsilon = 0.03;
        const fractionMap = {
            "1/9": 1 / 9, "1/7": 1 / 7, "1/5": 1 / 5, "1/4": 1 / 4,
            "1/3": 1 / 3, "1/2": 1 / 2, "2": 2, "4": 4, "6": 6, "8": 8
        };
        // for (const [label, value] of Object.entries(fractionMap)) {
        //     if (Math.abs(v - value) < epsilon) {
        //         if (confirm(`Bạn có muốn chuyển ${v.toFixed(3)} thành ${label} không?`)) {
        //             input.value = value.toFixed(3);
        //         }
        //         break;
        //     }
        // }
    });
}


// loại bỏ ký tự không hợp lệ và làm cho mỗi bảng có tên độc nhất không trùng
function sanitizeSheetName(name, existingNames = new Set()) {
    // Loại bỏ ký tự không hợp lệ và giới hạn độ dài
    let cleanName = name.replace(/[:\\\/\?\*\[\]]/g, '').substring(0, 31).trim();
    if (!cleanName) cleanName = 'Sheet';
  
    // Đảm bảo tên duy nhất
    let uniqueName = cleanName;
    let counter = 1;
    while (existingNames.has(uniqueName)) {
      uniqueName = `${cleanName}_${counter}`;
      if (uniqueName.length > 31) {
        uniqueName = uniqueName.substring(0, 31 - (`_${counter}`.length)) + `_${counter}`;
      }
      counter++;
    }
  
    existingNames.add(uniqueName);
    return uniqueName;
  }
  
//Hàm xuất file excel
  function exportToExcel() {
    const wb = XLSX.utils.book_new();
    const usedSheetNames = new Set();
  
    // 1. Ma trận tiêu chí chuẩn hóa
    if (window.lastResult?.normalized_criteria_matrix) {
      const names = window.lastResult.criteria_names;
      const matrix = window.lastResult.normalized_criteria_matrix;
      const sheetData = [[""].concat(names)];
      matrix.forEach((row, i) => {
        sheetData.push([names[i]].concat(row));
      });
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const sheetName = sanitizeSheetName("Ma trận tiêu chí", usedSheetNames);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  
    // 2. Trọng số tiêu chí
    if (window.lastResult?.criteria_weights) {
      const header = ["Tiêu chí", "Trọng số"];
      const rows = window.lastResult.criteria_names.map((c, i) => [c, window.lastResult.criteria_weights[i]]);
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      const sheetName = sanitizeSheetName("Trọng số tiêu chí", usedSheetNames);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  
    // 3. Trọng số phương án
    if (window.lastResult?.alternative_weights) {
      for (const [crit, wts] of Object.entries(window.lastResult.alternative_weights)) {
        const header = ["Phương án", "Trọng số"];
        const rows = window.lastResult.alternative_names.map((alt, i) => [alt, wts[i]]);
        const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
        const sheetName = sanitizeSheetName(`Phương án ${crit}`, usedSheetNames);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    }
  
    // 4. Kết quả tổng hợp
    if (window.lastResult?.final_scores) {
      const header = ["Phương án", "Điểm tổng hợp"];
      const rows = window.lastResult.final_scores.map(o => [o.alternative, o.score]);
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      const sheetName = sanitizeSheetName("Kết quả tổng hợp", usedSheetNames);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  
    // Xuất file
    XLSX.writeFile(wb, "ket_qua_ahp.xlsx");
  }
  
  
  //Hàm xuất file PDF
  function exportServerPDF() {
    fetch('/report_pdf', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(window.lastResult)
    })
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report_ahp.pdf';
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(console.error);
  }
  
