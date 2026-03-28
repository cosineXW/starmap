import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import Ridge
import json

def train_and_export(csv_file, model_name, output_file):
    print(f"\n🚀 开始处理: {csv_file}")
    
    # 1. 读取你的直觉数据
    df = pd.read_csv(csv_file, encoding='utf-8-sig', header=0, names=['text', 'x_score', 'y_score'])
    df = df.dropna(subset=['text', 'x_score', 'y_score'])    
    texts = df['text'].tolist()
    Y = df[['x_score', 'y_score']].values # 目标二维坐标
    
    # 2. 召唤大模型提取高维特征 (The heavy lifting)
    print(f"🧠 正在加载模型 {model_name} (初次运行需下载，请稍候)...")
    model = SentenceTransformer(model_name)
    print("✨ 正在提取文本灵魂 (计算 Embeddings)...")
    embeddings = model.encode(texts) 
    
    # 3. 核心炼金算法：线性脊回归 (Ridge Regression)
    print("🧮 正在训练直觉矩阵...")
    clf = Ridge(alpha=1.0) # alpha 防止死记硬背
    clf.fit(embeddings, Y)
    
    # 4. 提取出那 10KB 的精华矩阵
    matrix_data = {
        "weights": clf.coef_.tolist(),    # 权重矩阵
        "intercepts": clf.intercept_.tolist() # 偏移量 (Bias)
    }
    
    # 5. 封存为 JSON，供前端秒速调用
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(matrix_data, f)
    
    file_size = len(json.dumps(matrix_data)) / 1024
    print(f"✅ 炼金完成！矩阵已保存为 {output_file} (体积仅为 {file_size:.1f} KB！)")

# 炼制中文矩阵
train_and_export('cn.csv', 'BAAI/bge-small-zh-v1.5', 'cn_matrix.json')

# 炼制英文矩阵
train_and_export('en.csv', 'sentence-transformers/all-MiniLM-L6-v2', 'en_matrix.json')