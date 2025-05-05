import io
import numpy as np
from flask import Flask, make_response,send_file, request, jsonify, render_template
from pymongo import MongoClient
import datetime
import matplotlib.pyplot as plt
import os
import uuid
import pandas as pd
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Image as RLImage
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, String
from reportlab.graphics.charts.piecharts import Pie
from reportlab.platypus import Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors



# Kết nối MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["ahp_database"]
collection = db["ahp_results"]

app = Flask(__name__, template_folder="templates")
app.config["TEMPLATES_AUTO_RELOAD"] = True
@app.route("/")
def home():
    return render_template("index.html")  # Hiển thị trang web


def normalize_matrix(matrix):
    """Chuẩn hóa ma trận và tính trọng số AHP."""
    norm_matrix = matrix / matrix.sum(axis=0)  
    priority_vector = norm_matrix.mean(axis=1)  
    return norm_matrix, priority_vector.tolist()

def calculate_priority_vector(matrix):
    """Tính vector trọng số ưu tiên từ ma trận so sánh cặp."""
    eigenvalues, eigenvectors = np.linalg.eig(matrix)
    max_index = np.argmax(eigenvalues)                  
    priority_vector = np.real(eigenvectors[:, max_index])
    priority_vector = priority_vector / np.sum(priority_vector)
    return np.real(eigenvalues[max_index]), priority_vector.tolist()

def calculate_consistency_ratio(matrix):
    """Tính chỉ số nhất quán CI và tỷ số nhất quán CR."""
    n = matrix.shape[0]
    RI_dict = {1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45}
    
    lambda_max, _ = calculate_priority_vector(matrix)
    CI = (lambda_max - n) / (n - 1)
    RI = RI_dict.get(n, 1.45)  
    CR = CI / RI if RI != 0 else 0
    
    return lambda_max, CI, CR

@app.route("/check_criteria_cr", methods=["POST"])
def check_criteria_cr():
    try:
        data = request.json
        criteria_matrix = np.array(data["criteria_matrix"], dtype=np.float64)

        lambda_max, CI, CR = calculate_consistency_ratio(criteria_matrix)
        return jsonify({
            "lambda_max": lambda_max,
            "CI": CI,
            "CR": CR,
            "valid": bool(CR <= 0.1) #ép kiểu về bool
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400



@app.route('/ahp', methods=['POST'])
def ahp_api():
    """API xử lý AHP."""
    data = request.json
    print("Dữ liệu nhận được:", data)  # DEBUG

    # Kiểm tra dữ liệu đầu vào
    required_keys = ["criteria_matrix", "alternative_matrices", "alternative_names", "criteria_names"]
    for key in required_keys:
        if key not in data or not data[key]:
            return jsonify({"error": f"Thiếu dữ liệu: {key}"}), 400

    try:
        criteria_matrix = np.array(data["criteria_matrix"], dtype=np.float64)
        alternative_matrices = {key: np.array(value, dtype=np.float64) for key, value in data["alternative_matrices"].items()}
        alternative_names = data["alternative_names"]
        criteria_names = data["criteria_names"]
    except Exception as e:
        return jsonify({"error": f"Lỗi chuyển đổi dữ liệu: {str(e)}"}), 400

    # Kiểm tra kích thước ma trận tiêu chí (phải là vuông)
    num_criteria = len(criteria_names)
    if criteria_matrix.shape != (num_criteria, num_criteria):
        return jsonify({"error": "Ma trận tiêu chí phải là ma trận vuông (n × n)"}), 400

    # Kiểm tra số lượng phương án
    num_alternatives = len(alternative_names)
    for key, matrix in alternative_matrices.items():
        if matrix.shape != (num_alternatives, num_alternatives):
            return jsonify({"error": f"Ma trận phương án '{key}' không hợp lệ (phải là {num_alternatives} × {num_alternatives})"}), 400

     # Chuẩn hóa ma trận tiêu chí 
    normalized_criteria_matrix, _ = normalize_matrix(criteria_matrix)
    
    # Tính trọng số tiêu chí
    lambda_max_criteria, criteria_weights = calculate_priority_vector(criteria_matrix)
    lambda_max_criteria, CI_criteria, CR_criteria = calculate_consistency_ratio(criteria_matrix)
    
   

    # Kiểm tra CR của tiêu chí (nếu quá lớn thì dữ liệu có thể không hợp lệ)
    if CR_criteria > 0.1:
        print(f"Chỉ số CR : {CR_criteria}")
        return jsonify({"error": "Chỉ số nhất quán CR tiêu chí quá cao, dữ liệu có thể không hợp lệ!"}), 400

    # Tính trọng số phương án theo từng tiêu chí
    alternative_weights = {}
    alternative_eigenvalues = {}

    for key, matrix in alternative_matrices.items():
        lambda_alt, weights = calculate_priority_vector(matrix)
        alternative_weights[key] = weights
        alternative_eigenvalues[key] = lambda_alt

    # Chuyển ma trận trọng số phương án thành dạng (p × n)
    alternative_weight_matrix = np.array(list(alternative_weights.values())).T

    # Tính tổng điểm phương án
    final_scores = np.dot(alternative_weight_matrix, np.array(criteria_weights))
    # Ghép và sắp xếp điểm từ cao đến thấp
    final_scores_sorted = sorted(
        [{"alternative": alt, "score": score} for alt, score in zip(alternative_names, final_scores)],
        key=lambda x: x["score"],
        reverse=True
    )

    
    
    
    # Kết quả trả về
    # Kết quả trả về
    result = {
        "criteria_weights": criteria_weights,
        "criteria_names": criteria_names,
        "normalized_criteria_matrix": normalized_criteria_matrix.tolist(),
        "lambda_max_criteria": lambda_max_criteria,
        "CI_criteria": CI_criteria,
        "CR_criteria": CR_criteria,
        "alternative_weights": alternative_weights,
        "alternative_lambda_max": alternative_eigenvalues,
        "final_scores": final_scores_sorted,
        "alternative_names": alternative_names  
    }

    
    # Tạo dữ liệu cho biểu đồ
    alternative_names_plot = [item['alternative'] for item in result['final_scores']]
    final_scores_plot = [item['score'] for item in result['final_scores']]


    # Vẽ biểu đồ bằng Matplotlib
    # Tạo mã duy nhất cho tất cả ảnh
    unique_id = uuid.uuid4().hex[:8]
    criteria_names_plot = criteria_names
    criteria_weights_plot = criteria_weights
    
    # === 1. Biểu đồ điểm tổng hợp ===
    final_score_filename = f'final_scores_{unique_id}.png'
    image_path = os.path.join(app.root_path, 'static', final_score_filename)
    plt.figure(figsize=(10, 6))
    plt.bar(alternative_names_plot, final_scores_plot, color='skyblue')
    plt.xlabel("Phương án")
    plt.ylabel("Điểm tổng hợp")
    plt.title("So sánh điểm tổng hợp giữa các phương án")
    plt.grid(axis='y', linestyle='--')
    plt.savefig(image_path)
    plt.close()
    result['final_scores_image'] = f'/static/{final_score_filename}'

    # === 2. Biểu đồ cột trọng số tiêu chí ===
    criteria_weight_filename = f'criteria_weights_{unique_id}.png'
    image_path_criteria = os.path.join(app.root_path, 'static', criteria_weight_filename)
    plt.figure(figsize=(10, 6))
    
    plt.bar(criteria_names_plot, criteria_weights_plot, color='lightcoral')
    plt.xlabel("Tiêu chí")
    plt.ylabel("Trọng số")
    plt.title("Trọng số của các tiêu chí")
    plt.grid(axis='y', linestyle='--')
    plt.savefig(image_path_criteria)
    plt.close()
    result['criteria_weights_image'] = f'/static/{criteria_weight_filename}'

    # === 3. Biểu đồ tròn trọng số tiêu chí ===
    criteria_pie_filename = f'criteria_weights_pie_{unique_id}.png'
    image_path_criteria_pie = os.path.join(app.root_path, 'static', criteria_pie_filename)
    plt.figure(figsize=(8, 8))
    plt.pie(criteria_weights_plot, labels=criteria_names_plot, autopct='%1.1f%%', startangle=140)
    plt.title('Tỷ lệ trọng số của các tiêu chí')
    plt.axis('equal')
    plt.savefig(image_path_criteria_pie, bbox_inches='tight', pad_inches=0.3)
    plt.close()
    result['criteria_weights_pie_image'] = f'/static/{criteria_pie_filename}'

    
    
    
    
    
    
    # Lưu vào MongoDB
    collection.insert_one({
    "timestamp": datetime.datetime.utcnow(),
    "criteria_names": criteria_names,
    "criteria_weights": criteria_weights,  # Sửa ở đây
    "CR_criteria": CR_criteria,
    "alternative_weights": alternative_weights,  # Sửa ở đây
    "final_scores": final_scores_sorted
    })




    print("Kết quả xử lý:", result)  # DEBUG
    return jsonify(result)



@app.route('/results', methods=['GET'])
def get_results():
    """API lấy lịch sử tính toán AHP từ MongoDB."""
    try:
        limit = int(request.args.get("limit", 10))
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        query = {}

        # Lọc theo khoảng thời gian
        if start_date or end_date:
            query["timestamp"] = {}
            if start_date:
                query["timestamp"]["$gte"] = datetime.datetime.strptime(start_date, "%Y-%m-%d")
            if end_date:
                query["timestamp"]["$lte"] = datetime.datetime.strptime(end_date, "%Y-%m-%d")

        # Lấy dữ liệu từ MongoDB
        data = list(collection.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit))

        return jsonify(data)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/download_excel', methods=['POST'])
def download_excel():
    data = request.get_json()
    # Ví dụ: xuất final_scores
    df_scores = pd.DataFrame(data['final_scores'])
    
    # Tạo buffer in-memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        # Sheet 1: điểm tổng hợp
        df_scores.to_excel(writer, index=False, sheet_name='KQ Tổng hợp')
        # Sheet 2: trọng số tiêu chí
        df_crit = pd.DataFrame({
            'Tiêu chí': data['criteria_names'],
            'Trọng số': data['criteria_weights']
        })
        df_crit.to_excel(writer, index=False, sheet_name='Trọng số tiêu chí')
    output.seek(0)
    
    return send_file(
        output,
        as_attachment=True,
        download_name='ket_qua_ahp.xlsx',
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    
# ===== Đăng ký font Times New Roman (đường dẫn chính xác tùy máy) =====
pdfmetrics.registerFont(TTFont('TimesNewRoman', 'C:\\Windows\\Fonts\\times.ttf'))
registerFontFamily('TimesNewRoman', normal='TimesNewRoman')
@app.route('/report_pdf', methods=['POST'])
def report_pdf():
    data = request.get_json()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=40, bottomMargin=40)

    styles = getSampleStyleSheet()
    styles['Normal'].fontName = 'TimesNewRoman'
    styles['Heading1'].fontName = 'TimesNewRoman'
    styles['Heading2'].fontName = 'TimesNewRoman'
    styles['Heading3'].fontName = 'TimesNewRoman'
    styles['Heading4'].fontName = 'TimesNewRoman'

    elements = []

    # ===== Tiêu đề =====
    elements.append(Paragraph("Báo cáo kết quả AHP", styles['Heading1']))

    
    # ===== Bảng ma trận tiêu chí chuẩn hóa =====
    elements.append(Paragraph("1. Ma trận tiêu chí chuẩn hóa", styles['Heading2']))
    norm_crit_df = pd.DataFrame(data['normalized_criteria_matrix'], columns=data['criteria_names'], index=data['criteria_names'])
    table_data3 = [ ["" ] + norm_crit_df.columns.tolist() ] + [ [idx] + row.tolist() for idx, row in zip(norm_crit_df.index, norm_crit_df.values) ]
    tbl3 = Table(table_data3, hAlign='LEFT')
    tbl3.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'TimesNewRoman'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
    ]))
    elements.append(tbl3)

    # ===== Bảng trọng số tiêu chí =====
    crit_df = pd.DataFrame({
        'Tiêu chí': data['criteria_names'],
        'Trọng số': data['criteria_weights']
    })
    table_data = [crit_df.columns.tolist()] + crit_df.values.tolist()
    tbl = Table(table_data, hAlign='LEFT')
    tbl.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'TimesNewRoman'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
    ]))
    elements.append(Paragraph("2. Trọng số tiêu chí", styles['Heading2']))
    elements.append(tbl)

    # ===== Bảng ma trận phương án theo từng tiêu chí =====
    for crit_name in data['criteria_names']:
        elements.append(Paragraph(f"3. Ma trận phương án theo tiêu chí: {crit_name}", styles['Heading2']))
        alt_weights = data['alternative_weights'][crit_name]
        alt_df = pd.DataFrame({
            'Phương án': data['alternative_names'],
            'Trọng số': alt_weights
        })
        table_data_alt = [alt_df.columns.tolist()] + alt_df.values.tolist()
        tbl_alt = Table(table_data_alt, hAlign='LEFT')
        tbl_alt.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'TimesNewRoman'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ]))
        elements.append(tbl_alt)

    # ===== Bảng kết quả tổng hợp =====
    scores_df = pd.DataFrame(data['final_scores'])
    table_data2 = [scores_df.columns.tolist()] + scores_df.values.tolist()
    tbl2 = Table(table_data2, hAlign='LEFT')
    tbl2.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'TimesNewRoman'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
    ]))
    elements.append(Paragraph("4. Điểm tổng hợp các phương án", styles['Heading2']))
    elements.append(tbl2)

    # ===== Biểu đồ cột tổng hợp (matplotlib) =====
    fig, ax = plt.subplots(figsize=(4, 3))
    alts = [item['alternative'] for item in data['final_scores']]
    vals = [item['score'] for item in data['final_scores']]
    ax.bar(alts, vals, color='skyblue')
    ax.set_title("Điểm tổng hợp")
    ax.set_ylabel("Score")
    buf_img = io.BytesIO()
    fig.savefig(buf_img, format='PNG', dpi=150, bbox_inches='tight')
    plt.close(fig)
    buf_img.seek(0)
    elements.append(Paragraph("5. Biểu đồ cột điểm tổng hợp", styles['Heading2']))
    elements.append(RLImage(buf_img, width=400, height=300))

    # ===== Biểu đồ cột trọng số tiêu chí (matplotlib) =====
    fig2, ax2 = plt.subplots(figsize=(4, 3))
    ax2.bar(data['criteria_names'], data['criteria_weights'], color='lightcoral')
    ax2.set_title("Trọng số tiêu chí")
    ax2.set_ylabel("Trọng số")
    buf_img2 = io.BytesIO()
    fig2.savefig(buf_img2, format='PNG', dpi=150, bbox_inches='tight')
    plt.close(fig2)
    buf_img2.seek(0)
    elements.append(Paragraph("6. Biểu đồ cột trọng số tiêu chí", styles['Heading2']))
    elements.append(RLImage(buf_img2, width=400, height=300))

    # ===== Biểu đồ tròn tiêu chí (ReportLab Pie) =====
    drawing = Drawing(200, 150)
    drawing.add(String(40, 140, "Tỷ lệ trọng số tiêu chí", fontSize=10, fontName='TimesNewRoman'))
    pie = Pie()
    pie.x, pie.y = 50, 15
    pie.data = data['criteria_weights']
    pie.labels = data['criteria_names']
    pie.slices.strokeWidth = 0.5
    drawing.add(pie)
    elements.append(Paragraph("7. Biểu đồ tròn trọng số tiêu chí", styles['Heading2']))
    elements.append(drawing)

    # ===== Kết thúc và trả file PDF =====
    doc.build(elements)
    buffer.seek(0)
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name='report_ahp.pdf'
    )

if __name__ == "__main__":
    app.run(debug=True)